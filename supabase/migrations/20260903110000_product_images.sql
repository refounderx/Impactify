begin;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists video_url text;
insert into supabase_migrations.schema_migrations(version, name)
values ('20260903110000', 'product_images') on conflict do nothing;
commit;
