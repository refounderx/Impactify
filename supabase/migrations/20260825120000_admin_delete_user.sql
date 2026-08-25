-- Admin-only authentication account deletion with immutable, non-PII audit history.
create table if not exists public.admin_user_deletion_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  deleted_user_id uuid not null,
  deleted_role public.app_role not null,
  created_at timestamptz not null default now()
);

alter table public.admin_user_deletion_audit enable row level security;
create policy "admin_user_deletion_audit_admin_read"
  on public.admin_user_deletion_audit
  for select to authenticated
  using (public.is_admin());

revoke all on public.admin_user_deletion_audit from anon, authenticated;
grant select on public.admin_user_deletion_audit to authenticated;

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Admins cannot delete their own account';
  end if;

  perform pg_advisory_xact_lock(hashtext('impactify-admin-role-management'));
  select * into v_target
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;
  if v_target.app_role = 'admin'
    and (select count(*) from public.profiles where app_role = 'admin') <= 1
  then
    raise exception 'Cannot delete the last admin';
  end if;

  insert into public.admin_user_deletion_audit (
    actor_id, deleted_user_id, deleted_role
  ) values (
    auth.uid(), p_user_id, v_target.app_role
  );

  delete from auth.users where id = p_user_id;
  if not found then
    raise exception 'Authentication account not found';
  end if;
end
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
