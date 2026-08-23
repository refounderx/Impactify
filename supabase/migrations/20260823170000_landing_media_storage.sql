-- Public storage bucket for media embedded on the landing page.
-- The landing video is served from:
-- {SUPABASE_URL}/storage/v1/object/public/landing-media/landing-video.mp4
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'landing-media',
  'landing-media',
  true,
  26214400,
  array['video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "landing_media_public_read" on storage.objects;

create policy "landing_media_public_read" on storage.objects
  for select using (bucket_id = 'landing-media');
