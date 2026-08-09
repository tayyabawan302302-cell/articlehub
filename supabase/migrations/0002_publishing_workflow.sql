-- ============================================================================
-- ArticleHub — Publishing workflow fix
-- Adds: approved / archived states, audit columns, and a trigger that
-- enforces valid status transitions at the database level (not just in
-- application code) and auto-stamps published_at / approved_at / archived_at.
-- ============================================================================

-- New workflow states. (Postgres enum additions must run outside a
-- transaction block on older versions — Supabase's migration runner handles
-- this correctly when each statement is applied individually.)
alter type article_status add value if not exists 'approved';
alter type article_status add value if not exists 'archived';

alter table articles
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

-- ----------------------------------------------------------------------------
-- Single trigger, two jobs:
--  1. Permission guard — a non-staff author can only move their own article
--     through the transitions they're actually allowed to make. Anything
--     that reaches "approved" or "published" MUST come from staff. This is
--     the fix for the workflow-bypass hole in the old RLS-only setup.
--  2. Timestamp guarantee — published_at / approved_at / archived_at are
--     stamped here, at the DB layer, so no future code path can publish an
--     article and forget to set them.
-- ----------------------------------------------------------------------------
create or replace function handle_article_status_change()
returns trigger as $$
begin
  if new.status is distinct from old.status then

    if not is_staff() then
      if old.status in ('draft', 'rejected') and new.status = 'pending' then
        null; -- writer submitting (or resubmitting) for review — allowed
      elsif old.status = 'published' and new.status = 'archived' then
        null; -- writer archiving their own published article — allowed
      else
        raise exception
          'Only staff can change an article status from % to %', old.status, new.status;
      end if;
    end if;

    if new.status = 'published' and new.published_at is null then
      new.published_at := now();
    end if;

    if new.status = 'approved' then
      new.approved_at := now();
      new.approved_by := auth.uid();
    end if;

    if new.status = 'archived' then
      new.archived_at := now();
    end if;

    if new.status = 'rejected' then
      new.published_at := null; -- a rejected article is not published, ever
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_articles_status_change on articles;
create trigger trg_articles_status_change
  before update on articles
  for each row execute function handle_article_status_change();
