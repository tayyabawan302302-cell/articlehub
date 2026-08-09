-- ============================================================================
-- ArticleHub — Initial Schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor once)
-- Everything after this migration is manageable from the app UI —
-- no further manual SQL is required for day-to-day content management.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast text search

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('visitor', 'writer', 'editor', 'moderator', 'admin');
create type article_status as enum ('draft', 'pending', 'published', 'rejected', 'scheduled');
create type writer_status as enum ('pending', 'approved', 'suspended');
create type notification_type as enum (
  'article_approved', 'article_rejected', 'article_published',
  'new_comment', 'comment_reply', 'profile_update', 'system'
);
create type ad_placement as enum ('header', 'sidebar', 'between_articles', 'footer', 'inside_article');

-- ----------------------------------------------------------------------------
-- PROFILES (extends auth.users — never store secrets here)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_-]{3,30}$'),
  full_name text not null,
  avatar_url text,
  cover_url text,
  bio text,
  country text,
  website text,
  facebook_url text,
  linkedin_url text,
  x_url text,
  instagram_url text,
  skills text[] default '{}',
  occupation text,
  role user_role not null default 'visitor',
  writer_status writer_status, -- null unless role = 'writer'
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_username_idx on profiles using gin (username gin_trgm_ops);
create index profiles_role_idx on profiles (role);

-- ----------------------------------------------------------------------------
-- CATEGORIES & TAGS (admin-managed, unlimited)
-- ----------------------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  cover_image_url text,
  parent_id uuid references categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ARTICLES
-- ----------------------------------------------------------------------------
create table articles (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  subtitle text,
  slug text unique not null,
  content jsonb not null,           -- TipTap JSON document
  content_html text,                -- rendered cache for search/SEO
  featured_image_url text,
  gallery_urls text[] default '{}',
  reading_time_minutes int,
  meta_title text,
  meta_description text,
  canonical_url text,
  status article_status not null default 'draft',
  is_featured boolean not null default false,
  rejection_reason text,
  published_at timestamptz,
  scheduled_for timestamptz,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  share_count bigint not null default 0,
  bookmark_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index articles_status_idx on articles (status);
create index articles_author_idx on articles (author_id);
create index articles_category_idx on articles (category_id);
create index articles_published_idx on articles (published_at desc) where status = 'published';
create index articles_search_idx on articles using gin (
  (setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
   setweight(to_tsvector('english', coalesce(subtitle,'')), 'B') ||
   setweight(to_tsvector('english', coalesce(content_html,'')), 'C'))
);

create table article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ----------------------------------------------------------------------------
-- ENGAGEMENT: likes, bookmarks, views, comments
-- ----------------------------------------------------------------------------
create table likes (
  user_id uuid references profiles(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

create table bookmarks (
  user_id uuid references profiles(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

create table article_views (
  id bigint generated always as identity primary key,
  article_id uuid references articles(id) on delete cascade,
  viewer_id uuid references profiles(id) on delete set null, -- null = anonymous
  viewed_at timestamptz not null default now(),
  ip_hash text -- store a hash, never raw IP
);
create index article_views_article_idx on article_views (article_id);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid not null references articles(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade, -- nested replies
  content text not null,
  is_reported boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_article_idx on comments (article_id);
create index comments_parent_idx on comments (parent_id);

-- following (future-ready, referenced by spec)
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on notifications (recipient_id, is_read);

-- ----------------------------------------------------------------------------
-- MEDIA LIBRARY
-- ----------------------------------------------------------------------------
create table media (
  id uuid primary key default uuid_generate_v4(),
  uploader_id uuid references profiles(id) on delete set null,
  storage_path text not null,       -- path within the Supabase Storage bucket
  public_url text not null,
  file_name text not null,
  folder text default 'uncategorized',
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  alt_text text,
  created_at timestamptz not null default now()
);
create index media_folder_idx on media (folder);

-- ----------------------------------------------------------------------------
-- SITE SETTINGS (single-row config table, editable from Admin > Settings)
-- ----------------------------------------------------------------------------
create table site_settings (
  id int primary key default 1 check (id = 1), -- enforce single row
  site_name text not null default 'ArticleHub',
  logo_url text,
  favicon_url text,
  description text,
  keywords text[],
  contact_email text,
  contact_phone text,
  address text,
  facebook_url text,
  linkedin_url text,
  x_url text,
  instagram_url text,
  google_analytics_id text,
  google_search_console_code text,
  google_adsense_code text,
  theme_color text default '#2451B0',
  footer_text text,
  updated_at timestamptz not null default now()
);
insert into site_settings (id) values (1);

-- Navigation menu — admin-editable ordered list
create table nav_items (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  href text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

-- Static pages (About, Privacy, Terms, FAQ, Contact copy, etc.)
create table pages (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  content jsonb not null,
  meta_title text,
  meta_description text,
  updated_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_replied boolean not null default false,
  admin_reply text,
  created_at timestamptz not null default now()
);

create table newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  is_confirmed boolean not null default false,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table advertisements (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  placement ad_placement not null,
  adsense_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_articles_updated before update on articles
  for each row execute function set_updated_at();
create trigger trg_comments_updated before update on comments
  for each row execute function set_updated_at();
create trigger trg_pages_updated before update on pages
  for each row execute function set_updated_at();
create trigger trg_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    'visitor'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Atomic view-count increment, callable from the client via supabase.rpc('increment', ...)
create or replace function increment(row_id uuid)
returns void as $$
  update articles set view_count = view_count + 1 where id = row_id;
$$ language sql security definer;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public read for published content; writers manage only their own rows;
-- admins/editors/moderators manage everything. This is what lets every
-- action happen safely straight from the browser with no server-side
-- service-role calls needed for normal CRUD.
-- ============================================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table articles enable row level security;
alter table article_tags enable row level security;
alter table likes enable row level security;
alter table bookmarks enable row level security;
alter table article_views enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table notifications enable row level security;
alter table media enable row level security;
alter table site_settings enable row level security;
alter table nav_items enable row level security;
alter table pages enable row level security;
alter table contact_messages enable row level security;
alter table newsletter_subscribers enable row level security;
alter table advertisements enable row level security;

-- helper: is the current user staff (editor/moderator/admin)?
create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('editor', 'moderator', 'admin')
  );
$$ language sql stable security definer;

create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql stable security definer;

-- PROFILES
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "staff manage all profiles" on profiles for all using (is_staff());

-- CATEGORIES / TAGS — public read, staff write
create policy "categories public read" on categories for select using (true);
create policy "staff manage categories" on categories for all using (is_staff());
create policy "tags public read" on tags for select using (true);
create policy "staff manage tags" on tags for all using (is_staff());

-- ARTICLES
create policy "published articles public read" on articles for select
  using (status = 'published' or author_id = auth.uid() or is_staff());
create policy "writers insert own articles" on articles for insert
  with check (author_id = auth.uid());
create policy "writers update own drafts" on articles for update
  using (author_id = auth.uid() or is_staff());
create policy "writers delete own drafts" on articles for delete
  using ((author_id = auth.uid() and status in ('draft','rejected')) or is_staff());

create policy "article_tags follow article visibility" on article_tags for select using (true);
create policy "writers manage own article_tags" on article_tags for all
  using (exists (select 1 from articles a where a.id = article_id and (a.author_id = auth.uid() or is_staff())));

-- ENGAGEMENT
create policy "likes public read" on likes for select using (true);
create policy "users manage own likes" on likes for all using (user_id = auth.uid());
create policy "bookmarks owner only" on bookmarks for all using (user_id = auth.uid());
create policy "views insertable by anyone" on article_views for insert with check (true);
create policy "views readable by staff" on article_views for select using (is_staff());

create policy "comments public read" on comments for select using (not is_deleted or is_staff());
create policy "authenticated users insert comments" on comments for insert
  with check (author_id = auth.uid());
create policy "authors delete own comments" on comments for update
  using (author_id = auth.uid() or is_staff());

create policy "follows public read" on follows for select using (true);
create policy "users manage own follows" on follows for all using (follower_id = auth.uid());

-- NOTIFICATIONS — recipient only
create policy "users read own notifications" on notifications for select using (recipient_id = auth.uid());
create policy "system/staff insert notifications" on notifications for insert with check (true);
create policy "users update own notifications" on notifications for update using (recipient_id = auth.uid());

-- MEDIA
create policy "media readable by uploader and staff" on media for select
  using (uploader_id = auth.uid() or is_staff());
create policy "writers upload media" on media for insert with check (uploader_id = auth.uid());
create policy "owner or staff manage media" on media for all
  using (uploader_id = auth.uid() or is_staff());

-- SITE CONFIG — public read, admin write
create policy "settings public read" on site_settings for select using (true);
create policy "admin manage settings" on site_settings for all using (is_admin());
create policy "nav public read" on nav_items for select using (true);
create policy "admin manage nav" on nav_items for all using (is_admin());
create policy "pages public read" on pages for select using (true);
create policy "staff manage pages" on pages for all using (is_staff());
create policy "ads public read active" on advertisements for select using (is_active or is_staff());
create policy "admin manage ads" on advertisements for all using (is_admin());

-- CONTACT / NEWSLETTER — public insert, staff read
create policy "anyone submits contact form" on contact_messages for insert with check (true);
create policy "staff read contact messages" on contact_messages for select using (is_staff());
create policy "staff manage contact messages" on contact_messages for update using (is_staff());
create policy "anyone subscribes to newsletter" on newsletter_subscribers for insert with check (true);
create policy "staff read subscribers" on newsletter_subscribers for select using (is_staff());
