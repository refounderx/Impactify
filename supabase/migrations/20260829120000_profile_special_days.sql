begin;

create table if not exists public.profile_special_days (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  event_date date not null,
  emoji text not null default '🎉' check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now()
);

create index if not exists profile_special_days_profile_id_idx
  on public.profile_special_days(profile_id, event_date);

alter table public.profile_special_days enable row level security;

drop policy if exists "profile_special_days_own_select" on public.profile_special_days;
drop policy if exists "profile_special_days_own_insert" on public.profile_special_days;
drop policy if exists "profile_special_days_own_update" on public.profile_special_days;
drop policy if exists "profile_special_days_own_delete" on public.profile_special_days;

create policy "profile_special_days_own_select" on public.profile_special_days
  for select to authenticated using (profile_id = auth.uid());
create policy "profile_special_days_own_insert" on public.profile_special_days
  for insert to authenticated with check (profile_id = auth.uid());
create policy "profile_special_days_own_update" on public.profile_special_days
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "profile_special_days_own_delete" on public.profile_special_days
  for delete to authenticated using (profile_id = auth.uid());

revoke all on public.profile_special_days from public, anon;
grant select, insert, update, delete on public.profile_special_days to authenticated;

insert into supabase_migrations.schema_migrations(version, name)
values ('20260829120000', 'profile_special_days')
on conflict (version) do nothing;

commit;
