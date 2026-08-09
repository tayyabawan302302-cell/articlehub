-- ============================================================================
-- ArticleHub — Content types, Poetry, Magazine foundation
-- Reuses existing view_count / like_count / comment_count / is_featured —
-- none of those are duplicated here, per the explicit "do not create
-- competing fields" requirement.
-- ============================================================================

create type content_type as enum ('article', 'poetry', 'story', 'essay', 'opinion', 'other');

create type poetry_type as enum (
  'ghazal', 'nazm', 'free_verse', 'sonnet', 'haiku',
  'romantic', 'emotional', 'spiritual', 'inspirational', 'nature',
  'social_political', 'friendship', 'philosophical', 'patriotic',
  'humorous_satirical', 'other'
);

alter table articles
  add column if not exists content_type content_type not null default 'article',
  add column if not exists poetry_type poetry_type;

-- Guard at the DB level: poetry_type only makes sense when content_type is
-- actually poetry — catches a bad write regardless of which UI path made it.
alter table articles drop constraint if exists poetry_type_requires_poetry_content;
alter table articles add constraint poetry_type_requires_poetry_content
  check (poetry_type is null or content_type = 'poetry');

create index if not exists articles_content_type_idx on articles (content_type) where status = 'published';

-- ----------------------------------------------------------------------------
-- Magazine foundation — deliberately separate from Trending (algorithmic,
-- reader-driven) and from is_featured/Editor's Picks (lightweight curation).
-- Magazine selection is editorial judgment, tied to a specific issue.
-- ----------------------------------------------------------------------------
create table magazine_issues (
  id uuid primary key default uuid_generate_v4(),
  issue_number int not null unique,
  title text not null,
  theme text,
  cover_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table articles
  add column if not exists magazine_issue_id uuid references magazine_issues(id) on delete set null;

create index if not exists articles_magazine_issue_idx on articles (magazine_issue_id) where magazine_issue_id is not null;

alter table magazine_issues enable row level security;

create policy "magazine issues public read" on magazine_issues for select
  using (is_published or is_staff());

create policy "staff manage magazine issues" on magazine_issues for all
  using (is_staff());
