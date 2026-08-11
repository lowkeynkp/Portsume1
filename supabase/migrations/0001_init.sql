-- ─────────────────────────────────────────────────────────────
-- Portsume — initial schema
-- Run once against your Supabase project (SQL editor or supabase db push)
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── Users ────────────────────────────────────────────────────
-- The server issues its own HMAC sessions (lib/session.ts) and generates user
-- ids with randomUUID, so profiles is standalone — it must NOT reference
-- auth.users, or every signup fails a foreign-key check. Switch this to
-- `references auth.users (id)` only if auth moves to Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  avatar_url text,
  provider text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Files ────────────────────────────────────────────────────
create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  size bigint not null,
  mime_type text not null,
  storage_path text not null,
  sha256 text not null,
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists uploaded_files_user_idx on public.uploaded_files (user_id, uploaded_at desc);

-- ── Parsed resumes ───────────────────────────────────────────
create table if not exists public.parsed_resumes (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.uploaded_files (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'parsing',
  raw_text text,
  structured jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) not null default 0,
  detected_missing text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (file_id)
);
create index if not exists parsed_resumes_user_idx on public.parsed_resumes (user_id);

-- ── Themes ───────────────────────────────────────────────────
create table if not exists public.themes (
  id text primary key,
  slug text not null unique,
  name text not null,
  blurb text not null default '',
  preview_colors text[] not null default '{}',
  version int not null default 1
);

-- ── Portfolios (theme-independent content model) ─────────────
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  theme_id text references public.themes (slug) on delete set null,
  content jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  accent text not null default '#F68D7A',
  versions int not null default 1,
  published_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (slug)
);
create index if not exists portfolios_user_idx on public.portfolios (user_id, updated_at desc);
create index if not exists portfolios_status_idx on public.portfolios (status);

-- ── Version history (autosave + undo/redo) ───────────────────
create table if not exists public.portfolio_versions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  version_number int not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_versions_pid_idx on public.portfolio_versions (portfolio_id, version_number desc);

-- ── Pipeline jobs ────────────────────────────────────────────
create table if not exists public.pipeline_jobs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_id uuid references public.uploaded_files (id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  current_stage text not null default 'uploaded',
  progress numeric(5,2) not null default 0,
  stages jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pipeline_jobs_user_idx on public.pipeline_jobs (user_id, created_at desc);

-- ── Analytics ────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  portfolio_id uuid references public.portfolios (id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_user_type_idx on public.analytics_events (user_id, type, created_at desc);
create index if not exists analytics_events_portfolio_idx on public.analytics_events (portfolio_id, created_at desc);

-- ── Seed themes ──────────────────────────────────────────────
-- Must stay in sync with server/src/modules/themes/themeCatalog.ts — portfolios
-- .theme_id is a foreign key onto themes.slug, so a theme missing here cannot
-- be selected in the editor.
insert into public.themes (id, slug, name, blurb, preview_colors, version) values
  ('t-editorial', 'editorial', 'Editorial', 'Magazine-grade serif typography, oversized pull quotes, numbered sections and a confident editorial grid.', array['#FFF8EF','#24305E','#F68D7A'], 2),
  ('t-developer', 'developer', 'Developer', 'A dark, terminal-inspired canvas with monospace accents and a project-first timeline.', array['#0F1512','#8ED8F8','#BFD8B8'], 2),
  ('t-professional', 'professional', 'Professional', 'Clean, minimal and elegant — a refined single-column layout with generous whitespace.', array['#FFFFFF','#1C2B4B','#4A7E8E'], 2),
  ('t-creative', 'creative', 'Creative', 'Bold gradients, playful cards, big imagery and lively motion.', array['#FDF3EC','#FF5C8A','#6C5CE7'], 2),
  ('t-studio', 'studio', 'Studio', 'A gallery-style canvas with oversized display type and asymmetric editorial project rows.', array['#FAF7F2','#FF4D2E','#1E2A5A'], 1),
  ('t-executive', 'executive', 'Executive', 'A recruiter-ready CV layout with a dedicated sidebar rail, stat summary and structured sections.', array['#FFFFFF','#0F5E7E','#16233B'], 1),
  ('t-magazine', 'magazine', 'Magazine', 'A magazine-inspired spread with a masthead, lead story, masonry stories and issue-style numbering.', array['#FAF6EF','#B3210E','#16130E'], 1)
on conflict (id) do nothing;

-- ── Row Level Security ───────────────────────────────────────
-- The server connects with the service role key, which bypasses RLS entirely;
-- these policies are the safety net for any anon-key client. They key off
-- auth.uid(), so they deny everything while auth is server-issued HMAC.
alter table public.profiles enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.parsed_resumes enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_versions enable row level security;
alter table public.pipeline_jobs enable row level security;
alter table public.analytics_events enable row level security;
alter table public.themes enable row level security;

-- Profiles: users manage their own row
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Files / parsed resumes / portfolios / versions / jobs / analytics:
-- owner-scoped, soft deletes respected
create policy "files_own" on public.uploaded_files
  for all using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

create policy "parsed_own" on public.parsed_resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "portfolios_own" on public.portfolios
  for all using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

-- Published portfolios are readable by the public (shared link)
create policy "portfolios_public_read" on public.portfolios
  for select using (status = 'published');

create policy "versions_own" on public.portfolio_versions
  for all using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

create policy "jobs_own" on public.pipeline_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "analytics_own" on public.analytics_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "themes_read" on public.themes
  for select using (true);

-- ── Helpers ──────────────────────────────────────────────────
create or replace function public.touch_profile() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_profile();
