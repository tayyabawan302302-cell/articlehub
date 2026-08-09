-- ============================================================================
-- ArticleHub — Content model change: immediate publishing
-- Per updated product direction, editorial approval is no longer mandatory.
-- Writers can publish directly. The pending/approved states and the
-- admin moderation screens are NOT removed — they remain available for
-- admins who want to review, reject, or feature specific pieces after the
-- fact — but they're no longer a required gate before an article goes live.
-- ============================================================================

create or replace function handle_article_status_change()
returns trigger as $$
begin
  if new.status is distinct from old.status then

    if not is_staff() then
      if old.status in ('draft', 'rejected') and new.status in ('pending', 'published') then
        null; -- writer submitting for review OR publishing directly — both allowed now
      elsif old.status = 'published' and new.status = 'archived' then
        null; -- writer archiving their own published article — allowed
      elsif old.status = 'pending' and new.status = 'draft' then
        null; -- writer pulling a submission back to keep editing — allowed
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
      new.published_at := null;
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger itself is unchanged (still points at this function) — no need to
-- drop/recreate it, replacing the function body is enough.

-- Public visibility: approved articles (not just published) are now
-- readable by anyone, matching the homepage's relaxed status filter.
drop policy if exists "published articles public read" on articles;
create policy "published and approved articles public read" on articles for select
  using (status in ('published', 'approved') or author_id = auth.uid() or is_staff());
