-- Add public favorites toggle and username change tracking to profiles.
alter table public.profiles
  add column public_favorites boolean not null default false,
  add column username_changed_at timestamptz;

-- Allow public reading of favorites when the profile owner has opted in.
-- The existing owner-only select policy continues to work for private lists.
create policy "Public favorites are readable by anyone"
  on public.user_lists for select
  using (
    list_type = 'favorite'
    and exists (
      select 1 from public.profiles p
      where p.id = user_lists.user_id
      and p.public_favorites = true
    )
  );
