create table locations (
  id uuid default gen_random_uuid() primary key,
  city text not null,
  state text not null,
  display_name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

insert into locations (city, state, display_name, slug) values
('Boston', 'MA', 'Boston, MA', 'boston'),
('New York', 'NY', 'New York, NY', 'new-york'),
('Los Angeles', 'CA', 'Los Angeles, CA', 'los-angeles'),
('Chicago', 'IL', 'Chicago, IL', 'chicago'),
('Nashville', 'TN', 'Nashville, TN', 'nashville'),
('Austin', 'TX', 'Austin, TX', 'austin'),
('Philadelphia', 'PA', 'Philadelphia, PA', 'philadelphia'),
('Atlanta', 'GA', 'Atlanta, GA', 'atlanta'),
('Seattle', 'WA', 'Seattle, WA', 'seattle'),
('Denver', 'CO', 'Denver, CO', 'denver'),
('Miami', 'FL', 'Miami, FL', 'miami'),
('Washington', 'DC', 'Washington, DC', 'washington'),
('San Francisco', 'CA', 'San Francisco, CA', 'san-francisco'),
('Portland', 'OR', 'Portland, OR', 'portland'),
('Minneapolis', 'MN', 'Minneapolis, MN', 'minneapolis'),
('Dallas', 'TX', 'Dallas, TX', 'dallas'),
('Houston', 'TX', 'Houston, TX', 'houston'),
('Phoenix', 'AZ', 'Phoenix, AZ', 'phoenix'),
('Detroit', 'MI', 'Detroit, MI', 'detroit'),
('New Orleans', 'LA', 'New Orleans, LA', 'new-orleans')
on conflict (slug) do nothing;

create table events (
  id uuid default gen_random_uuid() primary key,
  provider text not null default 'seatgeek',
  provider_event_id text not null,
  artist_name text,
  venue_name text,
  venue_city text,
  venue_state text,
  event_date timestamptz,
  announce_date timestamptz,
  onsale_datetime timestamptz,
  onsale_tba boolean default false,
  ticketing_url text,
  genre text,
  image_url text,
  price_range_min numeric,
  price_range_max numeric,
  created_at timestamptz default now(),
  unique(provider, provider_event_id)
);

create table subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  location_id uuid references locations(id),
  confirmed boolean default false,
  confirm_token text unique,
  unsubscribe_token text unique,
  unsubscribed_at timestamptz,
  frequency text default 'weekly',
  created_at timestamptz default now()
);

create table meta (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create index on events (venue_city, event_date);
create index on events (created_at);
create index on subscribers (location_id);
create index on subscribers (confirmed, unsubscribed_at);
