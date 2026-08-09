-- ============================================================================
-- ArticleHub — Premium redesign support
-- Adds: featured-writer flag, a real trending score (not just view_count),
-- and indexes for the new query patterns the redesign needs.
-- ============================================================================

alter table profiles
  add column if not exists is_featured boolean not null default false;

-- Trending = a time-decayed blend of views/likes/comments, not just raw
-- view_count. Recomputed on read (cheap at MVP scale — revisit with a
-- materialized view if the articles table gets into the tens of thousands).
create or replace function trending_score(
  p_view_count bigint,
  p_like_count bigint,
  p_comment_count bigint,
  p_published_at timestamptz
)
returns numeric as $$
  select (
    (p_view_count * 1.0) + (p_like_count * 3.0) + (p_comment_count * 5.0)
  ) / power(
    extract(epoch from (now() - coalesce(p_published_at, now()))) / 3600 + 2,
    1.5
  );
$$ language sql immutable;

alter table articles
  add column if not exists comment_count bigint not null default 0;

-- Keep articles.like_count / comment_count / bookmark_count in sync with
-- the actual likes/comments/bookmarks tables via triggers, so every article
-- card and page can just read a column instead of counting rows on every
-- request (the N+1 pattern the redesign brief explicitly asked to avoid).
create or replace function sync_article_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update articles set like_count = like_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update articles set like_count = greatest(like_count - 1, 0) where id = old.article_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_likes_sync_count on likes;
create trigger trg_likes_sync_count
  after insert or delete on likes
  for each row execute function sync_article_like_count();

create or replace function sync_article_comment_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update articles set comment_count = comment_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update articles set comment_count = greatest(comment_count - 1, 0) where id = old.article_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_comments_sync_count on comments;
create trigger trg_comments_sync_count
  after insert or delete on comments
  for each row execute function sync_article_comment_count();

create or replace function sync_article_bookmark_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update articles set bookmark_count = bookmark_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update articles set bookmark_count = greatest(bookmark_count - 1, 0) where id = old.article_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_bookmarks_sync_count on bookmarks;
create trigger trg_bookmarks_sync_count
  after insert or delete on bookmarks
  for each row execute function sync_article_bookmark_count();

-- Backfill existing counts in case any likes/comments/bookmarks already
-- exist from before this migration.
update articles a set
  like_count = coalesce((select count(*) from likes l where l.article_id = a.id), 0),
  comment_count = coalesce((select count(*) from comments c where c.article_id = a.id and not c.is_deleted), 0),
  bookmark_count = coalesce((select count(*) from bookmarks b where b.article_id = a.id), 0);

create index if not exists articles_featured_idx on articles (is_featured) where is_featured = true;
create index if not exists profiles_featured_idx on profiles (is_featured) where is_featured = true;
create index if not exists articles_trending_idx on articles (published_at desc) where status = 'published';
