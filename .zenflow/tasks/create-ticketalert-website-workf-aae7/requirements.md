# TicketAlert — Product Requirements Document

## 1. Overview

**Product:** TicketAlert (ticketalert.co)  
**Type:** Location-based concert announcement platform  
**Core Value Prop:** Surface newly announced concert inventory to music fans before they sell out, delivered via weekly email digest and real-time web experience.  
**Tagline:** "Never miss a drop"  
**Messaging:** Use "New concerts just announced in your city" and "Never be the last to know" — never "on-sale alerts" or "the moment tickets go on sale."

---

## 2. Goals

1. Let fans discover newly announced concerts in their city the moment they appear in inventory.
2. Collect opted-in email subscribers per city and send them a weekly digest of fresh shows.
3. Provide an admin-accessible dashboard to monitor ingest health and trigger manual runs.
4. Be production-ready and deployable to Vercel on day one — no mocks, no TODOs, no placeholders.

---

## 3. Users

| Role | Description |
|---|---|
| Fan (visitor) | Browses events, filters by city, subscribes to alerts |
| Subscriber | Confirmed fan receiving weekly email digests |
| Admin | Authenticated via HTTP Basic Auth; views stats and triggers manual operations |
| Cron (system) | Vercel cron jobs that trigger ingest and newsletter via Bearer token |

---

## 4. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Email | Resend |
| Event Data (primary) | SeatGeek API v2 |
| Event Data (secondary) | Bandsintown API |
| Hosting | Vercel |

---

## 5. Design System

### Colors
| Token | Value |
|---|---|
| Background | `#0B1120` |
| Card/Surface | `#0f1829` |
| Border | `#1e3a5f` |
| Accent Yellow | `#FFE500` |
| Accent Blue | `#3B82F6` |
| Electric Blue | `#60A5FA` |
| White | `#ffffff` |
| Dark | `#0a0a0a` |

### Typography
- **Display/Wordmark:** Barlow Condensed, weight 800, uppercase — loaded via Google Fonts
- **Body:** DM Sans, weight 300/400 — loaded via Google Fonts
- Never use Inter, Roboto, Arial, or system fonts

### Logo Component (`Logo.tsx`)
- Ticket stub icon with alarm clock face inside (yellow stub, dark clock)
- Wordmark: "Ticket" in white + "Alert" in yellow (`#FFE500`), Barlow Condensed 800
- Tagline: "Never miss a drop" in DM Sans 300, electric blue (`#60A5FA`), wide letter-spacing
- Used on every page and inside the email template

### Aesthetic
- Concert poster meets modern SaaS; dark navy throughout — no white backgrounds
- Event cards = mini concert posters: artist image as card background with dark gradient overlay
- Mobile-first: 1 col → 2 col (tablet) → 3 col (desktop)
- All empty states must have helpful copy — never blank

---

## 6. City Data

A single `/lib/cities.ts` file exports the `CITIES` constant (20 cities). This is the **single source of truth** for:
- DB seed (locations table)
- City filter dropdown
- `generateStaticParams()` in city SEO pages
- SeatGeek ingest loop

Cities: Boston MA, New York NY, Los Angeles CA, Chicago IL, Nashville TN, Austin TX, Philadelphia PA, Atlanta GA, Seattle WA, Denver CO, Miami FL, Washington DC, San Francisco CA, Portland OR, Minneapolis MN, Dallas TX, Houston TX, Phoenix AZ, Detroit MI, New Orleans LA.

---

## 7. Database Schema

### `locations`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| city | text | |
| state | text | |
| display_name | text | e.g. "Boston, MA" |
| slug | text UNIQUE | e.g. "boston", "new-york" |
| created_at | timestamptz | default now() |

Seeded from CITIES constant at migration time.

### `events`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| provider | text | default 'seatgeek' |
| provider_event_id | text | |
| artist_name | text | |
| venue_name | text | |
| venue_city | text | |
| venue_state | text | |
| event_date | timestamptz | stored UTC |
| announce_date | timestamptz | nullable |
| onsale_datetime | timestamptz | nullable |
| onsale_tba | boolean | default false |
| ticketing_url | text | |
| genre | text | nullable |
| image_url | text | nullable |
| price_range_min | numeric | nullable |
| price_range_max | numeric | nullable |
| created_at | timestamptz | default now() — NEVER overwritten by upsert |
| UNIQUE | (provider, provider_event_id) | |

**No `is_new` column.** Freshness = `created_at >= now() - interval '7 days'` — computed at query/render time.

### `subscribers`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE | |
| location_id | uuid FK → locations(id) | |
| confirmed | boolean | default false |
| confirm_token | text UNIQUE | crypto.randomUUID() |
| unsubscribe_token | text UNIQUE | crypto.randomUUID() |
| unsubscribed_at | timestamptz | nullable |
| frequency | text | default 'weekly' |
| created_at | timestamptz | default now() |

### `meta`
| Column | Type | Notes |
|---|---|---|
| key | text PK | |
| value | text | |
| updated_at | timestamptz | |

Used to store `last_ingest` timestamp.

### Indexes
```sql
create index on events (venue_city, event_date);
create index on events (created_at);
create index on subscribers (location_id);
create index on subscribers (confirmed, unsubscribed_at);
```

---

## 8. Authentication

### Cron (Bearer Token)
- All cron requests send `Authorization: Bearer ${CRON_SECRET}`
- Routes verify header; return 401 if missing or wrong

### Admin (HTTP Basic Auth)
- Parse `Authorization` header, decode base64, extract password
- Compare to `ADMIN_PASSWORD` env var; return 401 if missing or wrong
- No cookies, no session, no login form

### `/api/ingest` and `/api/newsletter`
- Accept **GET** (cron trigger) and **POST** (admin manual trigger)
- Accept **either** valid Bearer (cron) **or** valid Basic Auth (admin)
- Return 401 if neither is present/valid

---

## 9. Feature Requirements

### 9.1 SeatGeek Ingest (`/api/ingest`)

**Purpose:** Populate the events table with real concert data for all 20 cities.

**Behavior:**
- Loop over all cities in CITIES constant
- For each city, paginate SeatGeek API: `GET /2/events?client_id=...&taxonomies.name=concert&venue.city={city}&datetime_local.gte={today}&datetime_local.lte={today+90d}&per_page=100&page={n}`
- Hard cap: 10 pages per city
- Exponential backoff, max 3 retries per request; handle 429 (rate limit) — wait and retry
- If a city fails after all retries: log failure, skip city, continue — **never stop entire job**
- Normalize raw API response via `/lib/providers/seatgeek.ts` → `NormalizedEvent`
- Upsert into events table: update price, url, image, genre, event_date on conflict; **never overwrite `created_at`**
- After all cities: upsert `meta` row `{key: 'last_ingest', value: now()}`
- Log: `"Ingest complete: X cities processed, Y events added, Z events updated, W cities failed"`

**Field Mapping (SeatGeek → NormalizedEvent):**
| SeatGeek field | NormalizedEvent field |
|---|---|
| `title` | `artist_name` |
| `datetime_local` → UTC | `event_date` |
| `announce_date` | `announce_date` |
| `venue.name` | `venue_name` |
| `venue.city` | `venue_city` |
| `venue.state` | `venue_state` |
| `url` | `ticketing_url` |
| `performers[0].image` | `image_url` |
| `performers[0].genres[0].name` | `genre` |
| `stats.lowest_price` | `price_range_min` |
| `stats.average_price` | `price_range_max` |
| `id` | `provider_event_id` |

### 9.2 Homepage (`/`)

**Purpose:** Browse all upcoming events with city filtering.

**Behavior:**
- Fetch upcoming events from DB, sorted by `event_date ASC`
- City filter dropdown populated from CITIES constant
- "New Drop" badge on events where `created_at >= now() - 7 days`
- Empty state: _"No concerts found for your city yet — check back soon"_
- Email signup CTA strip between grid sections

**Event Card:**
- Artist image as card background with dark gradient overlay
- Artist name (Barlow Condensed 800, white)
- Venue + City, State (DM Sans)
- Date formatted: `Sat Apr 12, 2025`
- "New Drop" badge (yellow) if fresh
- Genre tag
- Price: `From $35` if `price_range_min` set
- "Get Tickets" button → `ticketing_url`, `target="_blank" rel="noopener noreferrer"`

### 9.3 City SEO Pages (`/[city]`)

**Purpose:** Per-city landing pages for SEO, one per slug.

**Behavior:**
- Routes: `/boston`, `/new-york`, `/los-angeles`, etc.
- `generateStaticParams()` reads from CITIES constant — **never queries Supabase**
- City-filtered event grid (same card component as homepage)
- City-specific subscribe CTA: _"Get [City] concert alerts in your inbox"_
- Meta tags per city:
  - Title: `New Concerts Announced in [City, State] | TicketAlert`
  - Description: `Never be the last to know about concerts in [City]. Get notified the moment new shows are announced.`

### 9.4 Event Detail (`/events/[id]`)

**Purpose:** Full detail view for a single event.

**Features:**
- All event fields displayed
- Live countdown to `event_date` — single shared `setInterval`, updates every second
- Add to Google Calendar link (constructed from event data)
- "Get Tickets" CTA with `rel="noopener noreferrer"`
- Back to homepage link

### 9.5 Subscribe (`/subscribe`)

**Purpose:** Collect opted-in email subscribers per city.

**Form:** Email field + city dropdown (from CITIES)

**On Submit:**
1. Look up `location_id` from locations table matching selected city slug
2. Generate `confirm_token` and `unsubscribe_token` via `crypto.randomUUID()`
3. Insert subscriber (`confirmed=false`, `location_id`, tokens)
4. Send confirmation email via Resend with link to `/confirm/[confirm_token]`
5. Redirect to `/subscribe/success`

**`/confirm/[token]`:** Set `confirmed=true`, show success page  
**`/unsubscribe/[token]`:** Set `unsubscribed_at=now()`, show confirmation page  
**`/subscribe/success`:** Static success page

### 9.6 Newsletter (`/api/newsletter`)

**Purpose:** Send weekly email digest to confirmed subscribers.

**Performance — no N+1 queries:**
1. Fetch all fresh events (created_at ≥ 7 days ago), order by event_date ASC — **single query**
2. Group events by `venue_city` in memory
3. Fetch all confirmed, non-unsubscribed subscribers with their location join — **single query**
4. Loop subscribers: match city, skip if no events for city, send email
5. Log: `"Newsletter complete: X sent, Y skipped (no events), Z failed"`

**Email Content (every email must include):**
- Logo component in header (navy background)
- Headline: _"New concerts just announced in [City] this week"_
- Event list: Artist | Venue | Date | "Get Tickets →" link
- "New Drop" label on each event
- Footer unsubscribe link: `{NEXT_PUBLIC_SITE_URL}/unsubscribe/[unsubscribe_token]`

### 9.7 Admin Dashboard (`/admin`)

**Auth:** HTTP Basic Auth — 401 if wrong/missing password

**Stats displayed:**
- Total subscribers
- Confirmed subscribers
- Unsubscribed count
- Total events in DB
- Events added in last 7 days
- Last ingest time (from `meta` table, key `last_ingest`)

**Actions:**
- "Run Ingest Now" → POST `/api/ingest` with Basic Auth header
- "Send Newsletter Now" → POST `/api/newsletter` with Basic Auth header
- "Send Test Email" → sends sample newsletter email to `ADMIN_EMAIL`

---

## 10. Provider Architecture

### `/lib/providers/normalize.ts`
Exports `NormalizedEvent` type. All providers return `NormalizedEvent[]`. The ingest route only works with normalized events — never raw API responses.

### `/lib/providers/seatgeek.ts`
Fetches from SeatGeek API, maps raw response to `NormalizedEvent[]`.

### `/lib/providers/bandsintown.ts`
Fetches from Bandsintown API (secondary/supplemental), maps to `NormalizedEvent[]`.

---

## 11. Environment Variables

```
SEATGEEK_CLIENT_ID=          # required
SEATGEEK_CLIENT_SECRET=      # optional
SEATGEEK_AFFILIATE_ID=       # optional — append to ticket URLs when set
BANDSINTOWN_APP_ID=           # your app name string, free tier
SUPABASE_URL=
SUPABASE_ANON_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=alerts@ticketalert.co
ADMIN_PASSWORD=
ADMIN_EMAIL=griffin@ticketalert.co
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://ticketalert.co
```

---

## 12. Cron Schedule

| Job | Schedule (UTC) | Trigger |
|---|---|---|
| `/api/ingest` | Every 6 hours (`0 */6 * * *`) | Bearer token |
| `/api/newsletter` | Sundays 11pm (`0 23 * * 0`) | Bearer token |

Configured in `vercel.json`.

---

## 13. File Structure

```
/app
  /page.tsx                         # Homepage
  /events/[id]/page.tsx             # Event detail
  /subscribe/page.tsx               # Subscribe form
  /subscribe/success/page.tsx       # Success page
  /confirm/[token]/page.tsx         # Confirmation page (UI)
  /unsubscribe/[token]/page.tsx     # Unsubscribe page (UI)
  /admin/page.tsx                   # Admin dashboard
  /[city]/page.tsx                  # City SEO page
/app/api
  /ingest/route.ts                  # SeatGeek ingest
  /newsletter/route.ts              # Newsletter sender
  /subscribe/route.ts               # Subscriber creation
  /confirm/[token]/route.ts         # Confirm subscription
  /unsubscribe/[token]/route.ts     # Process unsubscribe
/components
  EventCard.tsx
  CityFilter.tsx
  CountdownTimer.tsx
  SubscribeForm.tsx
  EmailTemplate.tsx
  Logo.tsx
/lib
  cities.ts                         # CITIES constant (single source of truth)
  supabase.ts                       # Typed Supabase client
  resend.ts                         # Resend client
  tokens.ts                         # Token generation utilities
  /providers
    seatgeek.ts
    bandsintown.ts
    normalize.ts                    # NormalizedEvent type
/types
  index.ts
vercel.json
.env.local.example
.gitignore
```

---

## 14. Non-Functional Requirements

- No hardcoded values — all config via `process.env`
- Proper HTTP status codes for all API routes
- All DB queries handle empty results gracefully — app never crashes on empty DB
- All dates stored UTC in DB, formatted for display at render time
- All outbound links: `target="_blank" rel="noopener noreferrer"`
- Ingest: pagination (10-page cap), exponential backoff (max 3 retries), city-by-city failure isolation
- Newsletter: in-memory city grouping, no N+1 queries
- Upsert never overwrites `created_at`
- Logo component used on every page and in email template
- CITIES constant is the single source of truth — never duplicated

---

## 15. Assumptions & Decisions

1. **Bandsintown integration:** The spec lists Bandsintown as "secondary/supplemental." The ingest route will call both providers and upsert all results. Bandsintown data will use `provider='bandsintown'`.
2. **Affiliate ID appending:** When `SEATGEEK_AFFILIATE_ID` is set, it will be appended as a query param to ticket URLs during normalization.
3. **Email deduplication:** If a subscriber's city has no fresh events, they are silently skipped (not unsubscribed) — consistent with spec.
4. **Confirm page:** `/confirm/[token]` exists as both a UI page and an API route. The UI page will call the API route on load to perform the DB update, then display success.
5. **Admin "Send Test Email":** Sends a real newsletter-style email to `ADMIN_EMAIL` using the current week's fresh events for any city that has them. If no fresh events, sends a sample with placeholder copy.
6. **generateStaticParams:** Uses CITIES constant only — no Supabase call — so city pages build even with no DB connection at build time.
7. **CountdownTimer:** Only used on `/events/[id]` detail page. Event cards on grid pages show only the static "New Drop" badge, no live interval.
