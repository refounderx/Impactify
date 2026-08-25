-- Allow NGO owners to create products only for their own organization.
create or replace function public.create_ngo_product(
  p_name text,
  p_name_en text,
  p_description text,
  p_description_en text,
  p_price numeric,
  p_emoji text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_product uuid;
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid()
    and app_role = 'ngo_owner'
    and onboarding_completed_at is not null;

  if v_org is null then
    raise exception 'NGO owner access required';
  end if;
  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 120 then
    raise exception 'Product name is required and must be at most 120 characters';
  end if;
  if p_name_en is not null and length(trim(p_name_en)) > 120 then
    raise exception 'English product name must be at most 120 characters';
  end if;
  if p_description is not null and length(trim(p_description)) > 1000 then
    raise exception 'Description must be at most 1000 characters';
  end if;
  if p_description_en is not null and length(trim(p_description_en)) > 1000 then
    raise exception 'English description must be at most 1000 characters';
  end if;
  if p_price is null or p_price <= 0 or p_price > 10000000 then
    raise exception 'Price must be greater than zero and at most 10000000';
  end if;
  if p_emoji is not null and length(trim(p_emoji)) > 16 then
    raise exception 'Emoji must be at most 16 characters';
  end if;

  insert into public.products (
    org_id, name, name_en, description, description_en, price, emoji
  ) values (
    v_org,
    trim(p_name),
    nullif(trim(p_name_en), ''),
    nullif(trim(p_description), ''),
    nullif(trim(p_description_en), ''),
    p_price,
    nullif(trim(p_emoji), '')
  ) returning id into v_product;

  return v_product;
end
$$;

revoke all on function public.create_ngo_product(text, text, text, text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.create_ngo_product(text, text, text, text, numeric, text)
  to authenticated;
