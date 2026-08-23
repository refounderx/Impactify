-- Public storage bucket for landing hero images (soldier/elderly/family photos).
-- hero_cards.image_url points at objects in this bucket via the public URL:
-- {SUPABASE_URL}/storage/v1/object/public/hero-images/<filename>
insert into storage.buckets (id, name, public) values ('hero-images', 'hero-images', true)
on conflict (id) do nothing;

create policy "hero_images_public_read" on storage.objects
  for select using (bucket_id = 'hero-images');
