-- Media type enum: distinguishes movies from TV shows.
-- Needed because TMDB uses the same numeric ID space for both.
create type public.media_type_enum as enum ('movie', 'tv');

-- List type enum: the three kinds of user lists.
create type public.list_type_enum as enum ('watchlist', 'watched', 'favorite');
