-- ============================================================================
-- OPTIONAL DEMO CONTENT — for a dev/staging environment ONLY.
--
-- This project's own founding requirement was "never use fake articles,
-- fake users, or fake statistics" in production. This file exists only
-- because a later brief asked for 10 sample articles — it is deliberately
-- kept OUTSIDE supabase/migrations/ so it never runs automatically via
-- `supabase db push`, and is never bundled with your real schema.
--
-- If you want to see the site with content in a throwaway/staging project,
-- paste this into that project's SQL Editor manually. Do NOT run this
-- against your production database — the articles are fake and the
-- "author" is your own first admin account for simplicity, which means IT
-- WILL look like your own account wrote 10 demo pieces if you run it live.
-- ============================================================================

do $$
declare
  demo_author_id uuid;
  demo_category_id uuid;
begin
  select id into demo_author_id from profiles where role = 'admin' limit 1;
  if demo_author_id is null then
    raise notice 'No admin account found — create one first, then re-run this script.';
    return;
  end if;

  select id into demo_category_id from categories limit 1;

  insert into articles (author_id, category_id, title, subtitle, slug, content, content_html, status, published_at, reading_time_minutes, is_featured)
  values
    (demo_author_id, demo_category_id, 'DEMO: The Quiet Rise of On-Device AI', 'Why the next leap in AI might happen on your phone, not in a data center.', 'demo-on-device-ai-' || substr(gen_random_uuid()::text,1,6), '{}', '<p>Demo content — replace or delete.</p>', 'published', now(), 4, true),
    (demo_author_id, demo_category_id, 'DEMO: Notes on Writing Every Day', 'A short essay on discipline, doubt, and showing up.', 'demo-writing-every-day-' || substr(gen_random_uuid()::text,1,6), '{}', '<p>Demo content — replace or delete.</p>', 'published', now(), 3, false)
  ;
end $$;
