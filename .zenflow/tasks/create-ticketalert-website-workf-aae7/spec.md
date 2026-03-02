# TicketAlert — Technical Specification

## 1. Technical Context

### Language & Runtime
- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 18+ (Vercel Edge/Serverless compatible)
- **Framework:** Next.js 14 with App Router (`app/` directory)

### Core Dependencies
| Package | Version | Purpose |
|---|---|---|
| `next` | ^14 | Framework, routing, SSG |
| `react` / `react-dom` | ^18 | UI rendering |
| `typescript` | ^5 | Type safety |
| `tailwindcss` | ^3 | Utility-first CSS |
| `@supabase/supabase-js` | ^2 | DB client |
| `resend` | ^3 | Transactional email |
| `@react-email/components` | ^0.0.x | HTML email building blocks |
| `postcss` / `autoprefixer` | latest | Tailwind build pipeline |

### Dev Dependencies
| Package | Purpose |
|---|---|
| `eslint` + `eslint-config-next` | Linting |
| `@types/react` / `@types/node` | Type stubs |

### External APIs
- **SeatGeek API v2:** `https://api.seatgeek.com/2/events` — primary event source
- **Bandsintown API:** `https://rest.bandsintown.com/artists/{artist}/events` — secondary/supplemental
- **Resend:** `https://api.resend.com` — email delivery
- **Google Fonts:** Barlow Condensed 800, DM Sans 300/400 — loaded via `next/font/google`

---

## 2. Project Bootstrap

### `package.json` scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

### `tsconfig.json`
- `"strict": true`
- `"moduleResolution": "bundler"`
- Path alias: `"@/*": ["./*"]`

### `tailwind.config.ts`
Extend theme with all brand colors under `colors.brand.*`:
```ts
colors: {
  brand: {
    bg:       '#0B1120',
    surface:  '#0f1829',
    border:   '#1e3a5f',
    yellow:   '#FFE500',
    blue:     '#3B82F6',
    electric: '#60A5FA',
    dark:     '#0a0a0a',
  }
}
```
`content` array includes `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`.

### `.gitignore`
Include: `node_modules/`, `.next/`, `dist/`, `build/`, `.cache/`, `*.log`, `.env.local`, `.env.*.local`

---

## 3. Source Code Structure

```
/
├── app/
│   ├── layout.tsx                    # Root layout — fonts, global styles, <html> bg color
│   ├── page.tsx                      # Homepage — event grid + city filter
│   ├── events/
│   │   └── [id]/
│   │       └── page.tsx              # Event detail — countdown, calendar link, CTA
│   ├── subscribe/
│   │   ├── page.tsx                  # Subscribe form (client component)
│   │   └── success/
│   │       └── page.tsx              # Static success page
│   ├── confirm/
│   │   └── [token]/
│   │       └── page.tsx              # Calls API, shows success/error
│   ├── unsubscribe/
│   │   └── [token]/
│   │       └── page.tsx              # Calls API, shows confirmed page
│   ├── admin/
│   │   └── page.tsx                  # Admin dashboard (server component, Basic Auth)
│   └── [city]/
│       └── page.tsx                  # City SEO page — static params from CITIES
├── app/api/
│   ├── ingest/
│   │   └── route.ts                  # GET+POST, Bearer+Basic Auth
│   ├── newsletter/
│   │   └── route.ts                  # GET+POST, Bearer+Basic Auth
│   ├── subscribe/
│   │   └── route.ts                  # POST — create subscriber
│   ├── confirm/
│   │   └── [token]/
│   │       └── route.ts              # GET — set confirmed=true
│   └── unsubscribe/
│       └── [token]/
│           └── route.ts              # GET — set unsubscribed_at
├── components/
│   ├── Logo.tsx                      # Ticket stub + wordmark + tagline
│   ├── EventCard.tsx                 # Concert poster card
│   ├── CityFilter.tsx                # Dropdown — client component
│   ├── CountdownTimer.tsx            # Live countdown — client component, single interval
│   ├── SubscribeForm.tsx             # Email + city form — client component
│   └── EmailTemplate.tsx            # React Email template for newsletter
├── lib/
│   ├── cities.ts                     # CITIES constant — single source of truth
│   ├── supabase.ts                   # Typed Supabase client (server-side)
│   ├── resend.ts                     # Resend client instance
│   ├── tokens.ts                     # generateToken() utility
│   └── providers/
│       ├── normalize.ts              # NormalizedEvent type
│       ├── seatgeek.ts               # SeatGeek fetcher → NormalizedEvent[]
│       └── bandsintown.ts            # Bandsintown fetcher → NormalizedEvent[]
├── types/
│   └── index.ts                      # Supabase row types (Event, Subscriber, Location, Meta)
├── .env.local.example
├── vercel.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

---

## 4. Data Model & Types

### `types/index.ts`
TypeScript types matching DB schema exactly:

```ts
export type Location = {
  id: string
  city: string
  state: string
  display_name: string
  slug: string
  created_at: string
}

export type Event = {
  id: string
  provider: string
  provider_event_id: string
  artist_name: string | null
  venue_name: string | null
  venue_city: string | null
  venue_state: string | null
  event_date: string | null
  announce_date: string | null
  onsale_datetime: string | null
  onsale_tba: boolean
  ticketing_url: string | null
  genre: string | null
  image_url: string | null
  price_range_min: number | null
  price_range_max: number | null
  created_at: string
}

export type Subscriber = {
  id: string
  email: string
  location_id: string | null
  confirmed: boolean
  confirm_token: string | null
  unsubscribe_token: string | null
  unsubscribed_at: string | null
  frequency: string
  created_at: string
}

export type Meta = {
  key: string
  value: string | null
  updated_at: string
}
```

### `lib/providers/normalize.ts`
```ts
export type NormalizedEvent = {
  provider: string
  provider_event_id: string
  artist_name: string
  venue_name: string
  venue_city: string
  venue_state: string
  event_date: string          // ISO UTC string
  announce_date?: string
  onsale_datetime?: string
  onsale_tba: boolean
  ticketing_url: string
  genre?: string
  image_url?: string
  price_range_min?: number
  price_range_max?: number
}
```

---

## 5. Implementation Approach

### 5.1 Fonts & Global Layout (`app/layout.tsx`)
- Use `next/font/google` to load `Barlow_Condensed` (weight: ['800']) and `DM_Sans` (weight: ['300', '400'])
- Apply CSS variables (`--font-barlow`, `--font-dm-sans`) to `<html>` tag
- Set `className="bg-[#0B1120] text-white"` on `<body>` — dark background everywhere
- Extend `tailwind.config.ts` `fontFamily` to reference these CSS vars
- Include `<Logo />` in root layout header (rendered on every page automatically)

### 5.2 Logo Component (`components/Logo.tsx`)
- Pure SVG ticket stub with alarm clock face inside — no external image dependency
- Wordmark: `<span>Ticket</span><span className="text-[#FFE500]">Alert</span>` in Barlow Condensed 800 uppercase
- Tagline: `"Never miss a drop"` in DM Sans 300, `text-[#60A5FA]`, `tracking-widest`
- Exported as a named export for use in pages and `EmailTemplate.tsx`

### 5.3 Supabase Client (`lib/supabase.ts`)
- Single server-side client using `createClient` from `@supabase/supabase-js`
- Read `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `process.env`
- Do NOT use `@supabase/auth-helpers-nextjs` — this app has no user auth, only admin HTTP Basic Auth
- Export a single `supabase` instance (server-side only, not a hook)

### 5.4 Authentication Helpers
Implement shared auth check functions (used in `/api/ingest` and `/api/newsletter`):

```ts
// lib/auth.ts
export function verifyBearerAuth(req: Request): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

export function verifyBasicAuth(req: Request): boolean {
  const b64 = req.headers.get('authorization')?.replace('Basic ', '') ?? ''
  const [, password] = atob(b64).split(':')
  return password === process.env.ADMIN_PASSWORD
}

export function isAuthorized(req: Request): boolean {
  return verifyBearerAuth(req) || verifyBasicAuth(req)
}
```

Admin page (`/admin/page.tsx`) is a **server component** that reads `headers()` from `next/headers` and returns a 401 `NextResponse` if auth fails.

### 5.5 SeatGeek Provider (`lib/providers/seatgeek.ts`)

**Fetch function signature:**
```ts
export async function fetchSeatGeekEvents(city: string): Promise<NormalizedEvent[]>
```

**Pagination loop:**
- Start at `page=1`, increment until `events` array is empty or page > 10
- Build URL with params: `client_id`, `taxonomies.name=concert`, `venue.city`, `datetime_local.gte` (today UTC), `datetime_local.lte` (today+90d UTC), `per_page=100`, `page`
- If `SEATGEEK_AFFILIATE_ID` is set, append `?aid={SEATGEEK_AFFILIATE_ID}` to the `ticketing_url` during normalization

**Retry logic (per HTTP request):**
```ts
async function fetchWithRetry(url: string, attempt = 0): Promise<Response>
```
- On 429: wait `Math.pow(2, attempt) * 1000` ms, retry (max 3 attempts)
- On non-OK (non-429): throw after 3 attempts
- On network error: retry with backoff, max 3 attempts

**Field mapping:**
| SeatGeek field | NormalizedEvent field | Notes |
|---|---|---|
| `id.toString()` | `provider_event_id` | stringify |
| `'seatgeek'` | `provider` | hardcoded |
| `title` | `artist_name` | |
| `venue.name` | `venue_name` | |
| `venue.city` | `venue_city` | |
| `venue.state` | `venue_state` | |
| `datetime_local` | `event_date` | convert to UTC ISO via `new Date(datetime_local).toISOString()` |
| `announce_date` | `announce_date` | optional |
| `url` | `ticketing_url` | append affiliate ID if env set |
| `performers[0]?.image` | `image_url` | optional chain |
| `performers[0]?.genres[0]?.name` | `genre` | optional chain |
| `stats?.lowest_price` | `price_range_min` | optional |
| `stats?.average_price` | `price_range_max` | optional |
| `onsale_datetime` | `onsale_datetime` | optional |
| `false` | `onsale_tba` | SeatGeek doesn't expose this field directly |

### 5.6 Bandsintown Provider (`lib/providers/bandsintown.ts`)

**Purpose:** Supplemental data source. Called per-artist (not per-city like SeatGeek). In the initial ingest implementation, Bandsintown will be available but the ingest route will primarily use SeatGeek. Bandsintown can be wired up as an additive pass for artists discovered via SeatGeek or as a future enhancement.

```ts
export async function fetchBandsintownEvents(artist: string): Promise<NormalizedEvent[]>
```
- Endpoint: `GET https://rest.bandsintown.com/artists/{encodeURIComponent(artist)}/events?app_id={BANDSINTOWN_APP_ID}`
- Map fields: `venue.city`, `venue.region` (state), `venue.name`, `datetime`, `offers[0].url`, `lineup[0]`
- `provider = 'bandsintown'`

### 5.7 Ingest Route (`app/api/ingest/route.ts`)

**Handler (export `GET` and `POST`, same logic):**
1. Auth check via `isAuthorized(req)` → 401 if false
2. Loop `CITIES`:
   - Call `fetchSeatGeekEvents(city.city)` — catch errors, log, continue
   - Upsert results to `events` table:
     ```sql
     INSERT INTO events (provider, provider_event_id, artist_name, ...)
     VALUES (...)
     ON CONFLICT (provider, provider_event_id)
     DO UPDATE SET
       price_range_min = EXCLUDED.price_range_min,
       price_range_max = EXCLUDED.price_range_max,
       ticketing_url   = EXCLUDED.ticketing_url,
       image_url       = EXCLUDED.image_url,
       genre           = EXCLUDED.genre,
       event_date      = EXCLUDED.event_date
     ```
   - Track `added` / `updated` counts (use `data` array length + conflict detection)
3. Upsert `meta` row `{ key: 'last_ingest', value: new Date().toISOString() }`
4. Return `200` JSON with summary log string

**Counting added vs updated:** Use Supabase `upsert` with `{ onConflict: 'provider,provider_event_id', ignoreDuplicates: false }`. To distinguish inserts from updates, compare `created_at` on the returned rows — if `created_at` is within last few seconds, it was a new insert.

### 5.8 Newsletter Route (`app/api/newsletter/route.ts`)

**Handler (export `GET` and `POST`, same logic):**
1. Auth check → 401 if false
2. Single query: all events with `created_at >= now() - 7 days`, order by `event_date ASC`
3. Group by `venue_city` in memory (plain JS `reduce`)
4. Single query: all confirmed, non-unsubscribed subscribers with location join
5. Loop subscribers:
   - Get `location.city` from join
   - Look up events in `eventsByCity[city]`
   - If no events → increment `skipped`, continue
   - Render `EmailTemplate` with events and subscriber data
   - Send via Resend; catch per-subscriber errors, increment `failed`
   - Increment `sent`
6. Return 200 JSON with log summary

**Resend send call:**
```ts
await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL!,
  to: subscriber.email,
  subject: `New concerts just announced in ${locationCity} this week`,
  react: <EmailTemplate events={events} city={locationCity} unsubscribeToken={subscriber.unsubscribe_token} />,
})
```

### 5.9 Subscribe Route (`app/api/subscribe/route.ts`)

**POST handler:**
1. Parse `{ email, citySlug }` from request body
2. Query `locations` for `slug = citySlug` → get `location_id`
3. Generate tokens: `crypto.randomUUID()` for `confirm_token` and `unsubscribe_token`
4. Insert into `subscribers` (`confirmed=false`)
5. Send confirmation email via Resend: plain link to `${NEXT_PUBLIC_SITE_URL}/confirm/${confirmToken}`
6. Return `200` or `409` if email already exists

### 5.10 Confirm Route (`app/api/confirm/[token]/route.ts`)

**GET handler:**
1. Find subscriber by `confirm_token`
2. Set `confirmed = true`
3. Return `200` JSON `{ success: true }`

UI page (`app/confirm/[token]/page.tsx`) fetches this route client-side on mount, shows success or error state.

### 5.11 Unsubscribe Route (`app/api/unsubscribe/[token]/route.ts`)

**GET handler:**
1. Find subscriber by `unsubscribe_token`
2. Set `unsubscribed_at = new Date().toISOString()`
3. Return `200` JSON `{ success: true }`

UI page handles display.

### 5.12 Homepage (`app/page.tsx`)

- **Server component** — fetches all upcoming events (`event_date >= now()`) from Supabase, order by `event_date ASC`
- Renders `<CityFilter />` (client component) for dropdown interaction
- City filtering: pass `searchParams.city` (slug) to server-side query via `venue_city` lookup
- Renders event grid: `events.map(e => <EventCard key={e.id} event={e} />)`
- "New Drop" determination: `new Date(event.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)`
- Subscribe CTA strip rendered between grid chunks (after first 6 cards)
- Empty state component if no events match

### 5.13 City Page (`app/[city]/page.tsx`)

```ts
export async function generateStaticParams() {
  return CITIES.map(c => ({ city: c.slug }))
}

export async function generateMetadata({ params }: { params: { city: string } }) {
  const cityData = CITIES.find(c => c.slug === params.city)
  return {
    title: `New Concerts Announced in ${cityData?.display_name} | TicketAlert`,
    description: `Never be the last to know about concerts in ${cityData?.city}. Get notified the moment new shows are announced.`,
  }
}
```

- Fetch events filtered by `venue_city` matching the CITIES entry's `.city` field
- Reuse `<EventCard />` and `<SubscribeForm />` components

### 5.14 Event Detail (`app/events/[id]/page.tsx`)

- Server component: fetch single event by `id`
- Renders all event fields
- Renders `<CountdownTimer targetDate={event.event_date} />` — client component
- Google Calendar link:
  ```
  https://calendar.google.com/calendar/render?action=TEMPLATE
    &text={encodeURIComponent(artist_name)}
    &dates={gcalDateFormat(event_date)}/{gcalDateFormat(event_date + 2h)}
    &details={encodeURIComponent(`Tickets: ${ticketing_url}`)}
    &location={encodeURIComponent(venue_name)}
  ```
  Where `gcalDateFormat` produces `YYYYMMDDTHHMMSSZ`

### 5.15 CountdownTimer (`components/CountdownTimer.tsx`)

- `'use client'`
- Single `useEffect` with `setInterval(tick, 1000)`, cleared on unmount
- Displays: `Xd Xh Xm Xs` until event date
- Shows "Event has passed" if `now > targetDate`

### 5.16 EventCard (`components/EventCard.tsx`)

- Receives `event: Event` and `isNew: boolean` props
- Card container: `relative overflow-hidden rounded-xl` with `style={{ backgroundImage: \`url(${image_url})\`, backgroundSize: 'cover' }}`
- Dark gradient overlay: `absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent`
- Content positioned absolutely at bottom
- "New Drop" badge: `isNew && <span className="bg-[#FFE500] text-black text-xs font-bold px-2 py-0.5 rounded">New Drop</span>`
- Fallback image: solid `bg-brand-surface` if `image_url` is null
- "Get Tickets" button: `<a href={ticketing_url} target="_blank" rel="noopener noreferrer">`

### 5.17 CityFilter (`components/CityFilter.tsx`)

- `'use client'`
- Renders `<select>` populated from CITIES constant (imported directly)
- On change: uses `useRouter().push(\`/?city=${slug}\`)` (or city page route)
- Initial value set from `useSearchParams()`

### 5.18 EmailTemplate (`components/EmailTemplate.tsx`)

- Uses `@react-email/components` (`Html`, `Body`, `Container`, `Section`, `Text`, `Link`, `Hr`)
- Header: `<Logo />` on navy `#0B1120` background
- Headline: "New concerts just announced in {city} this week"
- Event list: for each event — Artist name, venue, formatted date, "Get Tickets →" link
- "New Drop" label next to each event
- Footer: unsubscribe link `{NEXT_PUBLIC_SITE_URL}/unsubscribe/{unsubscribeToken}`
- All inline styles (email clients don't support Tailwind)

### 5.19 Admin Dashboard (`app/admin/page.tsx`)

- Server component using `headers()` from `next/headers`
- Parse `Authorization` header, decode Basic Auth, verify against `ADMIN_PASSWORD`
- Return `new Response('Unauthorized', { status: 401 })` if invalid
- Stats queries (all parallel via `Promise.all`):
  - `SELECT COUNT(*) FROM subscribers`
  - `SELECT COUNT(*) FROM subscribers WHERE confirmed = true`
  - `SELECT COUNT(*) FROM subscribers WHERE unsubscribed_at IS NOT NULL`
  - `SELECT COUNT(*) FROM events`
  - `SELECT COUNT(*) FROM events WHERE created_at >= now() - interval '7 days'`
  - `SELECT value FROM meta WHERE key = 'last_ingest'`
- "Run Ingest" and "Send Newsletter" buttons: client components that POST to API routes with `Authorization: Basic {base64}` header (password stored in a hidden input or component prop from server)
- "Send Test Email" button: POSTs to a `/api/admin/test-email` route

---

## 6. API Contracts

### `POST /api/subscribe`
```
Request:  { email: string, citySlug: string }
Response: 200 { success: true }
          409 { error: 'Email already registered' }
          400 { error: 'Missing fields' }
          500 { error: string }
```

### `GET /api/confirm/[token]`
```
Response: 200 { success: true }
          404 { error: 'Token not found' }
          500 { error: string }
```

### `GET /api/unsubscribe/[token]`
```
Response: 200 { success: true }
          404 { error: 'Token not found' }
          500 { error: string }
```

### `GET|POST /api/ingest`
```
Auth:     Bearer {CRON_SECRET} OR Basic {base64(:{ADMIN_PASSWORD})}
Response: 200 { message: string, cities: number, added: number, updated: number, failed: number }
          401 { error: 'Unauthorized' }
          500 { error: string }
```

### `GET|POST /api/newsletter`
```
Auth:     Bearer {CRON_SECRET} OR Basic {base64(:{ADMIN_PASSWORD})}
Response: 200 { message: string, sent: number, skipped: number, failed: number }
          401 { error: 'Unauthorized' }
          500 { error: string }
```

---

## 7. Database Migration SQL

Run in Supabase SQL editor or migration file:

```sql
-- locations
create table if not exists locations (
  id uuid default gen_random_uuid() primary key,
  city text not null,
  state text not null,
  display_name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- events
create table if not exists events (
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

-- subscribers
create table if not exists subscribers (
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

-- meta
create table if not exists meta (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- indexes
create index if not exists idx_events_city_date on events (venue_city, event_date);
create index if not exists idx_events_created_at on events (created_at);
create index if not exists idx_subscribers_location on subscribers (location_id);
create index if not exists idx_subscribers_confirmed on subscribers (confirmed, unsubscribed_at);

-- seed locations
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
```

---

## 8. Environment Variables

### `.env.local.example`
```
SEATGEEK_CLIENT_ID=          # required — from SeatGeek developer portal
SEATGEEK_CLIENT_SECRET=      # optional
SEATGEEK_AFFILIATE_ID=       # optional — appended to ticket URLs as ?aid=
BANDSINTOWN_APP_ID=           # your app name string, free tier
SUPABASE_URL=                 # from Supabase project settings
SUPABASE_ANON_KEY=            # from Supabase project settings
RESEND_API_KEY=               # from Resend dashboard
RESEND_FROM_EMAIL=alerts@ticketalert.co
ADMIN_PASSWORD=               # choose a strong password
ADMIN_EMAIL=griffin@ticketalert.co
CRON_SECRET=                  # random secret, also set in Vercel dashboard
NEXT_PUBLIC_SITE_URL=https://ticketalert.co
```

---

## 9. Vercel Configuration

### `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/ingest",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/newsletter",
      "schedule": "0 23 * * 0"
    }
  ]
}
```

Vercel injects `Authorization: Bearer {CRON_SECRET}` automatically when the env var is set in the dashboard.

---

## 10. Delivery Phases

### Phase 1 — Scaffold + UI System
**Files:** `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `postcss.config.js`, `.gitignore`, `app/layout.tsx`, `lib/cities.ts`, `components/Logo.tsx`
**Gate:** `npm run build` succeeds, homepage shell renders with correct fonts and Logo

### Phase 2 — Database Schema + Supabase Client
**Files:** Migration SQL (run manually), `lib/supabase.ts`, `types/index.ts`
**Gate:** `supabase.from('locations').select('*')` returns 20 cities

### Phase 3 — Provider Layer + Ingest Route
**Files:** `lib/providers/normalize.ts`, `lib/providers/seatgeek.ts`, `lib/providers/bandsintown.ts`, `lib/auth.ts`, `app/api/ingest/route.ts`
**Gate:** Ingest route populates events table; running twice does not change `created_at`

### Phase 4 — Homepage + Event Grid
**Files:** `app/page.tsx`, `components/EventCard.tsx`, `components/CityFilter.tsx`
**Gate:** Real events display, city filter works, New Drop badges appear, empty state renders

### Phase 5 — City SEO Pages
**Files:** `app/[city]/page.tsx`
**Gate:** `/boston`, `/new-york` load with correct events and meta tags; verified statically generated

### Phase 6 — Subscribe + Confirm + Unsubscribe
**Files:** `app/subscribe/page.tsx`, `app/subscribe/success/page.tsx`, `app/confirm/[token]/page.tsx`, `app/unsubscribe/[token]/page.tsx`, `app/api/subscribe/route.ts`, `app/api/confirm/[token]/route.ts`, `app/api/unsubscribe/[token]/route.ts`, `components/SubscribeForm.tsx`, `lib/tokens.ts`
**Gate:** Full flow works end-to-end; DB state correct at each step

### Phase 7 — Newsletter
**Files:** `app/api/newsletter/route.ts`, `components/EmailTemplate.tsx`, `lib/resend.ts`
**Gate:** Emails delivered with correct content and working unsubscribe links

### Phase 8 — Event Detail
**Files:** `app/events/[id]/page.tsx`, `components/CountdownTimer.tsx`
**Gate:** Detail page loads, countdown ticks live every second

### Phase 9 — Admin Dashboard
**Files:** `app/admin/page.tsx`, `app/api/admin/test-email/route.ts`
**Gate:** 401 without auth; all stats correct; manual triggers work

### Phase 10 — Deployment Checklist
**Files:** `vercel.json`, `.env.local.example`
**Gate:** Deploys to Vercel; cron jobs visible; `/boston` loads with real data

---

## 11. Verification Approach

### Build & Type Check
```bash
npm run build        # must produce 0 errors
npm run typecheck    # tsc --noEmit, must produce 0 errors
npm run lint         # eslint, must produce 0 errors
```

### Manual Smoke Tests (per phase)
- **Phase 3:** `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/ingest`
- **Phase 4:** Open `http://localhost:3000`, select a city from dropdown, verify filtered results
- **Phase 5:** `curl -I http://localhost:3000/boston` — check `<title>` tag
- **Phase 6:** Submit subscribe form → check email → click confirm → verify DB row
- **Phase 7:** `curl -X POST -H "Authorization: Basic ..." http://localhost:3000/api/newsletter`
- **Phase 8:** Open `http://localhost:3000/events/{id}` — verify countdown ticking
- **Phase 9:** Open `http://localhost:3000/admin` with Basic Auth header — verify stats

### Key Invariants to Verify
1. `created_at` unchanged after second ingest run (query DB before/after)
2. `generateStaticParams()` does not trigger Supabase queries (check build output)
3. Newsletter sends exactly one email per subscriber with fresh events (check Resend logs)
4. Admin returns 401 with wrong password, 200 with correct
5. All outbound event links contain `target="_blank" rel="noopener noreferrer"`
