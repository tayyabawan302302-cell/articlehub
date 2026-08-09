-- ============================================================================
-- ArticleHub — Profile photo upload support
-- Creates dedicated public buckets for avatars and cover banners, each
-- scoped so a user can only write inside their own folder (named by their
-- user id), while anyone can read (since avatars/covers are public-facing).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Public read on both — avatars/covers are meant to be seen by everyone.
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "covers public read"
  on storage.objects for select
  using (bucket_id = 'covers');

-- A user may only insert/update/delete objects inside a path that starts
-- with their own user id, e.g. avatars/<user_id>/photo.jpg — enforced by
-- checking the first path segment against auth.uid().
create policy "users manage own avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users manage own cover"
  on storage.objects for all
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
