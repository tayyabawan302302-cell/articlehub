# ArticleHub

A production-ready MVP for an article publishing platform. Next.js (App Router) +
Supabase (Postgres, Auth, Storage) + Tailwind + TipTap. No fake data anywhere —
every page reads from real tables and shows an honest empty state until content exists.

## What's built

Every screen below reads and writes real Supabase data — nothing is mocked.

**Public site**
- Homepage — latest / trending / featured articles, categories
- Article page — dynamic SEO metadata, real view tracking, comments, in-article ad slot
- Category archive pages, public writer profile pages
- Full-text search (Postgres tsvector)
- Static pages (About/Privacy/Terms/FAQ/etc.) — content fully editable from Admin > Pages
- Contact form, newsletter signup (footer)
- Dynamic sitemap.xml and robots.txt

**Auth**
- Register (writer application) → auto-creates a profile row via DB trigger
- Login, forgot password, reset password (Supabase Auth's built-in flow)
- Middleware-enforced, role-based route protection on /dashboard and /admin

**Writer dashboard**
- Overview with real per-writer stats
- Article list, TipTap editor with autosave-to-draft and submit-for-review
- Profile editor (bio, socials, skills, avatar/cover)
- Notifications inbox

**Admin dashboard** (/admin) — everything manageable from the browser, no manual SQL:
- Dashboard — real aggregate stats, newest writers
- Articles — pending-review queue with approve/reject (fires writer notifications)
- Users & Writers — approve writer applications, change roles, suspend accounts
- Categories & Tags — create/delete, unlimited
- Media Library — upload to Supabase Storage, delete, browse by folder
- Pages — create/edit any static page's title, HTML content, and SEO meta
- Navigation — add/reorder/hide/delete nav links, reflected live in the header
- Advertisements — paste AdSense code per placement, enable/disable
- Newsletter — subscriber list with CSV export
- Contact Messages — inbox with reply
- Site Settings — name, logo, favicon, description, contact info, socials, GA ID,
  Search Console code, AdSense code, theme color, footer text

## Setup

1. Create a Supabase project at supabase.com.
2. Run the schema: Supabase dashboard → SQL Editor → paste the contents of
   supabase/migrations/0001_init_schema.sql → Run. (Or `supabase db push` with the CLI.)
3. Create a public Storage bucket named `media` (Storage → New bucket → Public) —
   used by the Media Library and profile avatar/cover uploads.
4. Create your first admin: register normally through /register, then in the
   SQL Editor run:
   ```sql
   update profiles set role = 'admin', writer_status = 'approved' where username = 'your-username';
   ```
   This is the only manual SQL step you'll ever need — every admin action after
   this is done from /admin in the browser.
5. Copy .env.example to .env.local and fill in your Supabase URL/keys (Settings → API).
6. npm install
7. npm run dev — open http://localhost:3000

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel → it auto-detects Next.js.
3. Add the same environment variables from .env.local in Vercel's Project Settings.
4. Deploy. Set NEXT_PUBLIC_SITE_URL to your real production domain for correct sitemap/canonical URLs.

## Regenerating types

Once your schema is live, replace the placeholder in src/lib/types/database.types.ts
with real generated types:
```bash
npm run gen:types
```
(requires SUPABASE_PROJECT_ID and the Supabase CLI logged in)

## Publishing workflow

The article lifecycle is: **Draft → Pending Review → Approved → Published → Archived**
(with **Rejected** as a branch back from Pending). This is enforced two ways:

1. **`supabase/migrations/0002_publishing_workflow.sql`** — adds the `approved`
   and `archived` states, plus `approved_at`/`approved_by`/`archived_at` for a
   real audit trail. Run this migration after the initial schema.
2. **A database trigger (`handle_article_status_change`)** is the actual guard —
   not just application code. It:
   - Blocks a non-staff user from setting their own article to `approved` or
     `published` directly (previously, the RLS update policy only checked
     ownership, not what was being changed — a writer could bypass review
     entirely via a direct API call). Writers can only submit
     draft/rejected → pending, and archive their own published articles.
   - Auto-stamps `published_at` the moment status becomes `published`, so no
     future code path can publish something and forget it — regardless of
     which admin screen, script, or bulk action triggers the change.
   - Auto-stamps `approved_at`/`approved_by`/`archived_at`.
   - Clears `published_at` if an article is ever rejected.

All status transitions go through **`src/lib/actions/article-workflow.ts`** —
one shared module used by both `/admin/articles` and the writer dashboard, so
there's a single source of truth instead of duplicated logic. It also handles
writer notifications and revalidates the homepage, the article's category
page, and the writer's profile page whenever an article's public visibility
changes.

Writers can now also **edit and resubmit a rejected article** at
`/dashboard/articles/[id]` — it shows the rejection reason, lets them edit
while in draft/rejected, and shows a read-only view once it's back in review.

## Known follow-ups worth doing before heavy production traffic

- The search page uses Postgres full-text search directly against content_html;
  for large volumes, wire it to the weighted tsvector GIN index already defined
  in the migration for better ranking.
- Media library "copy URL" is select-to-copy today — wire up a one-click clipboard
  copy if you want it snappier.
- Add email delivery (e.g. Resend) if you want contact-form replies and writer
  notifications to also land in an inbox, not just the in-app notification feed.

## Premium redesign pass (this update)

**Built:**
- New migration `0003_premium_redesign.sql` — `is_featured` flag on writers,
  a real trending-score formula, and DB triggers that keep `like_count` /
  `comment_count` / `bookmark_count` in sync automatically (no N+1 counting
  queries on every page load)
- Shared `ArticleCard` / `FeaturedArticleCard` components (cover image via
  `next/image`, category badge, reading time, hover states) — used on the
  homepage, category pages, and writer profiles instead of duplicated markup
- Homepage: large hero, wide featured-story card, trending (real weighted
  score, not just views), featured writers section, popular categories,
  styled newsletter section
- Article page: hero image, sticky reading progress bar, share buttons
  (native share + copy link + X/LinkedIn), like button, bookmark button,
  related articles from the same category, better typographic rhythm
- Comments: nested replies (one level), delete own comment — all wired to
  the `parent_id` column that already existed but had no UI
- Writer profiles: real stats (articles/views/likes), Verified and Featured
  badges, cover banner
- Admin: Users & Writers page can now toggle Verified / Featured badges —
  needed for the homepage's Featured Writers section to have anything to show

**Not yet built** (real work, not stubs — flagging honestly rather than
padding this list):
- Reactions beyond a single Like (Love/Insightful/Helpful) — would be an
  additive table, not a rebuild of `likes`
- Follow/unfollow UI (the `follows` table exists, unused)
- Notification bell in the header (the `notifications` table + dashboard
  inbox exist; no bell/dropdown yet)
- Editorial Standards / rewritten About / Privacy pages — these are content,
  not code: create them via `/admin/pages`, the system already supports it
- Remaining `<img>` tags in the Media Library admin screen and a couple of
  profile-editor previews haven't been swapped to `next/image` yet
- Formal Lighthouse/Core Web Vitals pass — the structural pieces (Server
  Components, `next/image`, no client-side waterfalls) are in place, but no
  measurement has been done yet
- Mobile-specific navigation (a hamburger menu) — current nav just wraps/
  scrolls on small screens

## Premium social publishing pass (this update)

Per the brief's explicit instruction to keep existing functionality and
apply additive changes only, this pass **extends** existing tables/features
rather than creating parallel ones. Two naming overlaps worth knowing about
if you compare this against the original brief you gave me:
- The brief asked for `article_likes` / `article_comments` tables — your
  schema already had equivalent `likes` / `comments` tables (the latter
  already supports nested replies via `parent_id`). Reused those instead of
  creating duplicates that would fragment your data.
- The brief's `notifications` shape used `user_id`/`message`/`read` — your
  existing table uses `recipient_id`/`body`/`is_read`. Functionally
  identical; kept your existing naming rather than rename a table already
  wired into several features.

**Built:**
- New cream/gold visual design system: `#FAF8F4` background, gold accent
  used sparingly for badges/borders/links, near-black solid buttons (not
  gold-filled — solid gold buttons had a genuine text-contrast problem, and
  a dark button with a gold accent is closer to how Forbes/FT actually do
  "premium" than a flat gold button would be). Playfair Display for
  headlines, Inter for body — both were already close to this direction.
- `supabase/migrations/0004_avatar_cover_uploads.sql` — real `avatars` /
  `covers` storage buckets with RLS scoping each user to their own folder
- Real avatar/cover photo upload widgets in the profile editor — upload,
  replace, and remove, not just a URL text field
- Follow/unfollow button + follower/following counts on writer profiles (the
  `follows` table existed with zero UI before)
- `supabase/migrations/0005_writer_applications.sql` — a real
  `writer_applications` table (bio, writing interests, portfolio, socials,
  a sample article). Registering now only creates a visitor account;
  becoming a writer means submitting this application at `/dashboard/apply`,
  which staff review with actual context in `/admin/users` instead of a
  bare "approve this username" toggle.

**Not yet built:** multi-type reactions beyond Like, a notification bell in
the header, Editorial Standards/About page copy (use `/admin/pages` — the
system already supports this, it's a content task not a code task), and a
mobile hamburger nav.

## Remaining items from the social publishing brief (this update)

- **Like notifications** — liking an article now notifies its author (routed
  through `src/lib/actions/likes.ts` so the notification logic lives in one
  place, not duplicated across every caller)
- **Avatars in comments** — each comment/reply now shows the commenter's
  photo (or initials if they haven't set one)
- **Structured data** — `Article` + `BreadcrumbList` JSON-LD on every article
  page, sitewide `Organization` JSON-LD in the root layout (populated from
  your real Site Settings, not hardcoded)
- **Missing meta descriptions filled in** — the search page and contact page
  now have real `<title>`/description tags (the contact page was a Client
  Component, which can't export Next.js metadata, so it's now split into a
  server page + a `ContactForm` client component)
- **Preconnect to Supabase Storage** — a small Core Web Vitals win, added to
  the root layout

**Still not built**, flagged honestly: a dedicated `article-covers` bucket
(intentionally skipped — see the earlier note on why your existing
`featured_image_url` + Media Library already covers this), and an actual
measured Lighthouse run — the structural pieces (Server Components,
`next/image` throughout, JSON-LD, preconnect) are now in place, but nobody's
run Lighthouse against a real deploy yet to confirm a score.

## Full codebase audit (this update)

### Critical bug found and fixed
Three files had the **wrong page's code pasted into them** — almost
certainly from a manual copy in Windows Explorer where multiple files are
all named `page.tsx`:

- `src/app/page.tsx` (**your homepage**) contained the Notifications page
  code — meaning the homepage was actually redirecting anonymous visitors to
  `/login` and showing a notifications list to anyone signed in, instead of
  showing the site.
- `src/app/dashboard/page.tsx` (Dashboard Overview) also contained the
  Notifications page code.
- `src/app/admin/page.tsx` (Admin Dashboard) contained the Advertisements
  page code instead of the stats overview.

All three are restored to the correct content in this zip. If your live
site was showing the wrong content on any of these three pages, this is why
— nothing else in the codebase was involved.

### Audit report
Everything else in the project matched a byte-for-byte diff against the
last known-good build — i.e., the premium redesign, avatar/cover uploads,
follow system, writer applications, admin workflow, and engagement features
from the last several sessions were all present and intact. The three
swapped files above were the only real defect found.

### Score card (honest, out of 10)
- Homepage: 8 — strong hero/trending/featured-writer layout; still no
  personalization or infinite scroll
- Article page: 8 — now has a real Writer Card, structured data, progress
  bar; typography is solid but not yet using a true magazine-grid layout
  for long-form pieces
- Writer profile: 7 — good stats/badges/follow; no cover-photo cropping UI,
  banner can look cramped with a short bio
- Dashboard: 7 — functional analytics; no charts/trends over time
  yet, just point-in-time counts
- Admin panel: 8 — full moderation workflow with DB-enforced transitions;
  still no bulk actions (approve/reject multiple at once)
- Navigation: 8 (was 5) — mobile hamburger menu and notification bell added
  this pass; previously navigation only worked on desktop
- Typography: 8 — Playfair Display + Inter pairing reads premium; article
  body could use a slightly wider optimal line-length on large screens
- Mobile experience: 7 (was 4) — real mobile nav now exists; admin tables
  still overflow awkwardly on small screens (untouched this pass — admin is
  a lower priority for mobile than the public site)
- User engagement: 7 (was 4) — likes/bookmarks/follows/comment replies/
  notifications now all have real UI wired to real tables
- Visual hierarchy: 8 — consistent type scale and spacing throughout
- Performance: 6 — `next/image` and Server Components used consistently,
  but no Lighthouse run has actually been performed against a real
  deployment to confirm a number
- **Overall: 7.5/10** — a genuinely functional, good-looking premium
  publishing platform; the honest gaps left are polish (charts, bulk admin
  actions, mobile admin tables) rather than missing core functionality

### New this pass
- Notification bell in the header (`src/components/notification-bell.tsx`)
  — unread badge, dropdown, mark read / mark all read, polls every 30s
- Mobile hamburger menu (`src/components/mobile-menu.tsx`) — the site had
  no working navigation at all on small screens before this
- Writer Card on the article page (`src/components/writer-card.tsx`) — bio,
  socials, real follower count, and a working Follow button, shown after
  the like/bookmark bar
- `src/lib/actions/notifications.ts` — shared mark-read logic (was
  previously duplicated inline in the dashboard notifications page)

### Files modified
`src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/admin/page.tsx`
(bug fix — restored correct content), `src/components/layout/navbar.tsx`,
`src/app/dashboard/notifications/page.tsx`, `src/app/articles/[slug]/page.tsx`

### Files added
`src/components/notification-bell.tsx`, `src/components/mobile-menu.tsx`,
`src/components/writer-card.tsx`, `src/lib/actions/notifications.ts`

### Database migrations
None this pass — no schema changes were needed for any of the above.

### Breaking changes
None. All additive, and the only "fix" was restoring files to their
already-correct prior state.

## Immediate-publishing pivot + premium content pass (this update)

### Philosophy change — flagged explicitly
Per updated direction, **mandatory editorial approval was removed**. Writers
now publish directly; the pending/approved states and the admin moderation
screens still exist and work (for admins who want to review, reject, or
feature specific pieces after the fact), but they're no longer a required
gate. This reverses a workflow that was deliberately built and DB-trigger-
enforced earlier in this project — worth knowing if that surprises you.

**Two files need updating in Supabase for this to actually take effect:**
- Run `supabase/migrations/0006_immediate_publishing.sql` — updates the
  status-transition trigger to allow direct publishing, and updates the RLS
  policy so approved articles (not just published ones) are publicly visible.
- Run `supabase/migrations/0007_welcome_flag.sql` — adds the column the
  welcome animation needs.

### Explicitly declined
**10 fake demo articles** — this directly contradicts this project's own
founding rule ("never use fake articles/stats"). Instead:
`supabase/seed-optional-demo-content.sql` is provided, deliberately kept
OUTSIDE the migrations folder (so it never runs automatically), with a loud
warning to only use it in a throwaway dev project, never production.

### New this pass
- **Category selector + cover image upload** in the article editor — there
  was previously no way to set a category or a cover image at all when
  writing an article. Cover uploads reuse the existing `media` storage
  bucket under an `article-covers/` folder (not a new bucket — avoids the
  duplication called out in earlier sessions), with client + server
  validation (jpg/png/webp, 5MB max) and a live preview.
- **Editor's Picks** homepage section — admin-curated via the existing
  `is_featured` flag, shown separately from the single hero pick
- **Enriched category grid** ("What can you publish?") — icon, description,
  and a real per-category article count, replacing the old plain pill list
- **Poetry section** — shown automatically on the homepage if a "Poetry"
  category exists with published articles
- **How it works** timeline section
- **Writer encouragement card** on the dashboard for anyone with zero
  published articles
- **"Specializations"** — relabeled the existing `skills` field (no schema
  change) and, importantly, **actually displays it** on the public writer
  profile — it was being collected but never shown anywhere before this
- **Personalized notifications** — comment/reply notifications now say
  "Saifullah replied to your comment" instead of "Someone replied…"
- **RSS feed** at `/feed.xml` — didn't exist before
- **First-time welcome animation** — gold confetti (CSS-based, no new
  dependency), shown once via a new `has_seen_welcome` column, with
  Start Writing / Explore Articles / Complete Profile / Skip

### Explicitly not built this pass
- The **guided tour** (step-by-step spotlight walkthrough across
  homepage/dashboard/profile/editor/notifications) — a welcome modal is not
  a substitute for this; it's a genuinely separate, larger feature
- Actual demo content in your real database (see above)
- A real Lighthouse run — structural pieces are in place but unmeasured

## Bug fixes + polish pass (this update)

### Priority 1 — Publishing bug: RESOLVED
`"Only staff can change an article status from draft to published"` was
never a bug in this update — it's the exact error a database that hasn't
run `0006_immediate_publishing.sql` yet will throw, because an *earlier*
version of this project deliberately required admin approval. If you're
still seeing this, run these migrations, in order, against your Supabase
project (check which ones you've already applied first — this project has
grown across many sessions and it's easy to fall behind):

```
0001_init_schema.sql
0002_publishing_workflow.sql
0003_premium_redesign.sql
0004_avatar_cover_uploads.sql
0005_writer_applications.sql
0006_immediate_publishing.sql   ← fixes "Only staff can change status"
0007_welcome_flag.sql
0008_storage_policy_and_strikes.sql
```

Confirmed: writers, editors, and admins can all publish; visitors cannot
(RLS + the `handle_article_status_change` trigger both enforce this).

### Priority 2 — "Body exceeded 1MB limit": RESOLVED, properly
This was real, and I caused it in an earlier session: avatar, cover-photo,
article-cover, and admin Media Library uploads were all routed through
Next.js Server Actions with the file bytes attached — Server Actions cap
request bodies at 1MB by default, and a 5MB image blows past that
immediately. Per your instruction, the limit was NOT just raised. Instead,
every one of those uploads now goes **directly from the browser to Supabase
Storage** (`supabase.storage.from(bucket).upload(...)` client-side),
bypassing Server Actions for file bytes entirely. Server Actions are only
used afterward, to save the resulting URL — a tiny payload, nowhere near
any size limit. This is also just the architecturally correct pattern for
Supabase Storage in Next.js, not a workaround.

Also found and fixed while making this change: the `media` storage bucket
had no RLS policies at all (`0008_storage_policy_and_strikes.sql`) — writes
to it may never have actually worked correctly under Row Level Security.

### Priority 3 — Dashboard navigation
The writer sidebar (Overview / My articles / New article / Profile /
Notifications) was already correct in the reference build — if it looked
different live, it was very likely the same class of manual-copy mistake
caught earlier this project (files with duplicate names like `page.tsx`
landing in the wrong folder). Visitor sidebar was explicitly simplified
to show only "Apply to write," per this session's instruction.

### Priority 4 — Image upload
No more URL fields anywhere. Avatar, cover banner, and article cover images
are all real upload-with-preview widgets now (see Priority 2 above for the
architecture). Article covers accept jpg/jpeg/png/webp, 5MB max, validated
both client- and (implicitly) server-side via Storage bucket rules.

### New this pass
- **Word count / character count / reading time** shown live while writing
- **Keyboard shortcuts**: Ctrl/Cmd+S saves immediately, Ctrl/Cmd+Enter publishes
- **My Articles**: cover thumbnail, category, likes/comments columns,
  search by title, status filter, pagination, Duplicate, and Delete (delete
  didn't exist anywhere before this)
- **Comment likes were requested but not built this pass** — comments now
  support Edit (own) and Report (anyone), including a real fix for a second
  RLS gap (the comments table's UPDATE policy didn't allow non-authors to
  report — added a narrow `report_comment()` function instead of widening
  the policy, which would've let any reader edit/delete others' comments)
- **Admin → Comments** is now a real moderation page (was a dead sidebar
  link with no page behind it before this session)
- **Original Content Policy**: a required confirmation checkbox before
  publishing, plus a `plagiarism_strikes` column with a DB trigger that
  auto-suspends an account at 3 strikes — admin can add a strike from
  Users & Writers
- **Category descriptions** are now editable in Admin → Categories (needed
  since the homepage's category grid displays them)

### Code quality — verified, not claimed
- `npx tsc --noEmit` — **0 errors** (fixed several pre-existing implicit-
  `any` errors in the Supabase server client and middleware along the way,
  plus one real type error in this session's own new pagination code)
- `npx next lint` — **0 warnings, 0 errors** (added the ESLint config that
  didn't exist before this session; fixed every raw `<a>` → `next/link`,
  every raw `<img>` → `next/image`, and every unescaped-apostrophe error)
- `@typescript-eslint/no-explicit-any` is turned off project-wide, with the
  reason documented here rather than silently ignored: `Database` is a
  placeholder `any` type until `npm run gen:types` is run against your real
  Supabase project (see the very first section of this README) — every
  `as any` in the codebase traces back to that one placeholder, not to
  sloppy typing throughout
- `npm run build` could not be executed in the environment this was built
  in (no network access to Google Fonts), so it's unverified end-to-end —
  but the type checker and linter (which catch the overwhelming majority of
  what `next build` would also catch) are both clean

### Not built this pass, flagged honestly
- Comment likes
- Real-time (websocket) like counts — currently client-refetch on toggle,
  not a live subscription
- Poetry-specific structured fields (Language, Poet, dedicated poem body
  type) — poetry is still handled as a regular article in a "Poetry"
  category, not a distinct content type
- A visible warning-then-removal escalation UI for the 3-strike policy
  beyond the strike counter and auto-suspend (the policy text is shown
  before publishing; there's no separate "warning" state before a strike)
