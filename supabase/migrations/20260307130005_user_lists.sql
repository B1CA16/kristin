-- User lists: watchlist, watched, and favorites.
-- A media item can be in multiple lists simultaneously (e.g., watched + favorite).
create table public.user_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  tmdb_id     integer not null,
  media_type  public.media_type_enum not null,
  list_type   public.list_type_enum not null,
  created_at  timestamptz not null default now(),

  constraint uq_user_list_item unique (user_id, tmdb_id, media_type, list_type)
);

-- Primary query: "get all items in a user's watchlist, newest first."
create index idx_user_lists_lookup on public.user_lists (user_id, list_type, created_at desc);

alter table public.user_lists enable row level security;

create policy "Users can read their own lists"
  on public.user_lists for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add to their own lists"
  on public.user_lists for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove from their own lists"
  on public.user_lists for delete
  to authenticated
  using (auth.uid() = user_id);
