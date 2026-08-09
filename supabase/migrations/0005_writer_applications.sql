-- ============================================================================
-- ArticleHub — Writer application system
-- Registering only creates a visitor account. To become a writer, a visitor
-- now submits an application with real context — bio, writing interests,
-- portfolio, socials, a sample piece — which staff review with that context
-- in front of them, instead of a bare "approve this username" toggle.
-- ============================================================================

create type application_status as enum ('pending', 'approved', 'rejected');

create table writer_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  bio text not null,
  writing_interests text[] not null default '{}',
  portfolio_url text,
  facebook_url text,
  linkedin_url text,
  x_url text,
  instagram_url text,
  sample_article text not null,
  status application_status not null default 'pending',
  review_note text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index writer_applications_status_idx on writer_applications (status);
create index writer_applications_user_idx on writer_applications (user_id);

-- Only one pending application per user at a time.
create unique index writer_applications_one_pending_per_user
  on writer_applications (user_id)
  where status = 'pending';

alter table writer_applications enable row level security;

create policy "users read own applications" on writer_applications for select
  using (user_id = auth.uid() or is_staff());

create policy "users submit own application" on writer_applications for insert
  with check (user_id = auth.uid());

create policy "staff review applications" on writer_applications for update
  using (is_staff());
