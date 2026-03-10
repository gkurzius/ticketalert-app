create table artist_follows (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  artist_name text not null,
  artist_slug text not null,
  created_at timestamptz default now(),
  unique(email, artist_slug)
);

create table venue_follows (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  venue_name text not null,
  venue_slug text not null,
  created_at timestamptz default now(),
  unique(email, venue_slug)
);

create index on artist_follows (artist_slug);
create index on venue_follows (venue_slug);
