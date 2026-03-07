-- User profiles extending Supabase Auth.
-- Auto-created via trigger when a user signs up.
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null,
  display_name text,
  avatar_url  text,
  bio         text,
  reputation  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for profile lookups by username (used in profile pages).
create index idx_profiles_username on public.profiles (username);

-- RLS: anyone can read profiles, only the owner can update their own.
alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy for regular users — profiles are created by the trigger below.
-- No delete policy — users don't delete their own profiles (account deletion goes through auth).
