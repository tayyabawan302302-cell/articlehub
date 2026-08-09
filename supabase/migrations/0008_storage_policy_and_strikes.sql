-- ============================================================================
-- ArticleHub — Storage policy gap fix + plagiarism strikes
-- ============================================================================

-- The 'media' bucket had no storage.objects RLS policies at all — meaning
-- writes were either silently blocked or unintentionally wide open,
-- depending on how the bucket was manually configured. Unlike avatars/
-- covers, media has always been organized by admin-chosen folder names
-- (e.g. "article-covers", "uncategorized") rather than per-user paths, so
-- policies here are scoped by role, not by folder ownership: any signed-in
-- user can upload and read; only staff can delete/modify existing objects
-- (matches the existing app-level check in deleteMedia()).
create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "authenticated users upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "staff manage media objects"
  on storage.objects for update using (bucket_id = 'media' and is_staff())
  with check (bucket_id = 'media' and is_staff());

create policy "staff delete media objects"
  on storage.objects for delete using (bucket_id = 'media' and is_staff());

-- Plagiarism strikes (Priority 7): track violations, auto-suspend at 3.
alter table profiles
  add column if not exists plagiarism_strikes int not null default 0;

create or replace function auto_suspend_on_third_strike()
returns trigger as $$
begin
  if new.plagiarism_strikes >= 3 and old.plagiarism_strikes < 3 then
    new.is_suspended := true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_auto_suspend_strikes on profiles;
create trigger trg_auto_suspend_strikes
  before update on profiles
  for each row execute function auto_suspend_on_third_strike();

-- Originality confirmation, stored per-article (Priority 7's "I confirm
-- this work is original" checkbox).
alter table articles
  add column if not exists originality_confirmed boolean not null default false;

-- Reporting a comment needs to be possible for ANY signed-in reader, not
-- just the comment's author or staff — but the existing UPDATE policy on
-- comments only allows those two. Rather than widen that policy (which
-- would let any reader edit/delete others' comments too), this narrow
-- security-definer function only ever flips is_reported, nothing else.
create or replace function report_comment(comment_id uuid)
returns void as $$
  update comments set is_reported = true where id = comment_id;
$$ language sql security definer;
