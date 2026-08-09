-- ============================================================================
-- ArticleHub — Magazine PDF tracking
-- Reuses magazine_issues.published_at as the issue's publication date/month
-- (already exists, set when an issue is published) — not duplicated here.
-- ============================================================================

alter table magazine_issues
  add column if not exists pdf_url text,
  add column if not exists pdf_storage_path text,
  add column if not exists pdf_generated_at timestamptz;
