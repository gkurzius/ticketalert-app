# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 01bdf517-da1d-4591-93c0-faa990b4c988 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: b2099596-8f30-44ef-9ce3-bf81d647d642 -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: 61d58dbb-48d0-4474-820b-fbd9464f0f8a -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint). Avoid steps that are too granular (single function) or too broad (entire feature).

Important: unit tests must be part of each implementation task, not separate tasks. Each task should implement the code and its tests together, if relevant.

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

### [x] Step 1: Scaffold + UI System
<!-- chat-id: 8a4fbdc6-62ae-42c7-a1f9-c2399de70caa -->

Bootstrap the Next.js 14 App Router project and establish the full design system.

Files to create:
- `package.json` — dependencies: next@14, react@18, typescript@5, tailwindcss@3, @supabase/supabase-js@2, resend@3, @react-email/components, postcss, autoprefixer; devDeps: eslint, eslint-config-next, @types/react, @types/node
- `tsconfig.json` — strict mode, moduleResolution: bundler, path alias `@/*`
- `tailwind.config.ts` — brand colors under `colors.brand.*`, fontFamily vars, content array
- `postcss.config.js`
- `next.config.js`
- `.gitignore` — node_modules/, .next/, dist/, build/, .cache/, *.log, .env.local, .env.*.local
- `app/layout.tsx` — load Barlow_Condensed (weight 800) + DM_Sans (weight 300, 400) via next/font/google; apply CSS vars; body bg `#0B1120`; include `<Logo />` in header
- `lib/cities.ts` — CITIES constant with all 20 cities (city, state, display_name, slug)
- `components/Logo.tsx` — SVG ticket stub with alarm clock face; wordmark "Ticket" white + "Alert" yellow (#FFE500) in Barlow Condensed 800 uppercase; tagline "Never miss a drop" in DM Sans 300, #60A5FA, tracking-widest
- `app/page.tsx` — stub homepage shell (placeholder content, no DB queries yet)

Verification:
- `npm run build` produces 0 errors
- Homepage shell renders with correct fonts and Logo component visible

### [x] Step 2: Types + Supabase Client + DB Migration SQL
<!-- chat-id: 481e0b1f-a419-4e39-b2ff-dbe70670f392 -->

Set up the data layer types and DB client. Produce the migration SQL file for manual execution.

Files to create/modify:
- `types/index.ts` — TypeScript types: Location, Event, Subscriber, Meta matching DB schema exactly
- `lib/supabase.ts` — single server-side Supabase client using `createClient` from `@supabase/supabase-js`; reads SUPABASE_URL + SUPABASE_ANON_KEY from process.env
- `supabase/migration.sql` — full migration SQL including all 4 tables, 4 indexes, and seed INSERT for all 20 locations from CITIES constant; uses `ON CONFLICT (slug) DO NOTHING` for idempotency

Verification:
- `npm run typecheck` passes
- Migration SQL file reviewed and confirmed correct (manual execution against Supabase)

### [x] Step 3: Provider Layer + Auth Helpers + Ingest Route
<!-- chat-id: 751c631c-55fa-4ae9-bdbd-3b1f97a7a098 -->

Implement the normalized event type, SeatGeek + Bandsintown providers, auth helpers, and the full ingest API route.

Files to create:
- `lib/providers/normalize.ts` — exports NormalizedEvent type
- `lib/providers/seatgeek.ts` — `fetchSeatGeekEvents(city: string): Promise<NormalizedEvent[]>`; pagination loop (page cap 10); `fetchWithRetry` with exponential backoff (max 3 retries), 429 handling; full field mapping per spec; affiliate ID appended to ticketing_url when SEATGEEK_AFFILIATE_ID is set
- `lib/providers/bandsintown.ts` — `fetchBandsintownEvents(artist: string): Promise<NormalizedEvent[]>`; maps Bandsintown fields to NormalizedEvent; provider = 'bandsintown'
- `lib/auth.ts` — `verifyBearerAuth(req)`, `verifyBasicAuth(req)`, `isAuthorized(req)`
- `app/api/ingest/route.ts` — export GET and POST (same handler); `isAuthorized` check → 401; CITIES loop with per-city error isolation; call `fetchSeatGeekEvents`; upsert to events table (never overwrite created_at); track added/updated counts; upsert meta `last_ingest`; return 200 JSON summary

Upsert SQL (via Supabase):
```
INSERT INTO events (...) ON CONFLICT (provider, provider_event_id)
DO UPDATE SET price_range_min, price_range_max, ticketing_url, image_url, genre, event_date
-- created_at is NOT in the update set
```

Verification:
- `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/ingest` returns 200 with summary
- Events table populated with real SeatGeek data
- Running ingest twice: `created_at` unchanged on second run

### [x] Step 4: Homepage + Event Grid Components
<!-- chat-id: 10c90781-c56c-4a01-aa71-dcf0411b65d7 -->

Build the full homepage with event grid, city filter, New Drop badges, subscribe CTA strip, and empty states.

Files to create/modify:
- `components/EventCard.tsx` — receives `event: Event` and `isNew: boolean`; artist image as bg with gradient overlay; Barlow Condensed artist name; DM Sans venue/city; formatted date (e.g. "Sat Apr 12, 2025"); New Drop badge (yellow) if isNew; genre tag; price "From $X" if price_range_min set; "Get Tickets" → `target="_blank" rel="noopener noreferrer"`; fallback bg-brand-surface if no image
- `components/CityFilter.tsx` — `'use client'`; `<select>` from CITIES; onChange uses `useRouter().push`; initial value from `useSearchParams()`
- `app/page.tsx` — server component; query events (`event_date >= now()`) from Supabase ordered by event_date ASC; filter by city if `searchParams.city` present (resolve slug → city name); render `<CityFilter />`; determine isNew per event (`created_at >= now() - 7 days`); render event grid (1/2/3 col); insert subscribe CTA strip after first 6 cards; empty state: "No concerts found for your city yet — check back soon"

Verification:
- Real events displayed from DB
- City filter dropdown changes URL and filters results
- New Drop badges appear on events created within last 7 days
- Empty state renders when no events match
- All "Get Tickets" links have `target="_blank" rel="noopener noreferrer"`

### [x] Step 5: City SEO Pages
<!-- chat-id: 654ed0ae-7ef8-4134-b3f0-b1e3d3d33b4d -->

Implement statically generated per-city landing pages.

Files to create:
- `app/[city]/page.tsx` — `generateStaticParams()` returns `CITIES.map(c => ({ city: c.slug }))` (NO Supabase query); `generateMetadata()` produces city-specific title and description; server component fetches events filtered by venue_city; renders same EventCard grid; city-specific subscribe CTA "Get [City] concert alerts in your inbox"; empty state if no events

Verification:
- `/boston`, `/new-york`, `/chicago` load with correct city-filtered events
- `<title>` tag matches format: "New Concerts Announced in Boston, MA | TicketAlert"
- Build output confirms pages are statically generated (not dynamically rendered)
- `generateStaticParams()` does not trigger any Supabase query at build time

### [ ] Step 6: Subscribe + Confirm + Unsubscribe Flows

Implement the full email subscription lifecycle.

Files to create:
- `lib/tokens.ts` — `generateToken(): string` wrapper around `crypto.randomUUID()`
- `lib/resend.ts` — Resend client instance using `RESEND_API_KEY`
- `app/api/subscribe/route.ts` — POST; parse `{ email, citySlug }`; query locations for slug → location_id; generate confirm_token + unsubscribe_token; insert subscriber (confirmed=false); send confirmation email via Resend (link to /confirm/[token]); 200/400/409/500 responses
- `app/api/confirm/[token]/route.ts` — GET; find subscriber by confirm_token; set confirmed=true; 200/404/500
- `app/api/unsubscribe/[token]/route.ts` — GET; find subscriber by unsubscribe_token; set unsubscribed_at=now(); 200/404/500
- `components/SubscribeForm.tsx` — `'use client'`; email input + city select (from CITIES); POST to `/api/subscribe`; handle loading/error states; redirect to /subscribe/success on success
- `app/subscribe/page.tsx` — renders `<SubscribeForm />`
- `app/subscribe/success/page.tsx` — static success page with confirmation message and Logo
- `app/confirm/[token]/page.tsx` — client component; calls GET `/api/confirm/[token]` on mount; shows success or error state with Logo
- `app/unsubscribe/[token]/page.tsx` — client component; calls GET `/api/unsubscribe/[token]` on mount; shows confirmation with Logo

Verification:
- Submit form → redirected to /subscribe/success
- Confirmation email received with working /confirm/[token] link
- After clicking confirm: `confirmed=true` in DB with correct `location_id`
- After clicking unsubscribe link: `unsubscribed_at` set in DB
- 409 returned if email already exists

### [ ] Step 7: Newsletter Route + Email Template

Implement the newsletter send route and React Email template.

Files to create/modify:
- `components/EmailTemplate.tsx` — React Email component using @react-email/components; inline styles only (no Tailwind); Logo header on #0B1120 bg; headline "New concerts just announced in {city} this week"; event list rows: artist name, venue, formatted date, "Get Tickets →" link, "New Drop" label per event; footer unsubscribe link using unsubscribeToken
- `app/api/newsletter/route.ts` — export GET and POST; `isAuthorized` → 401; single query for fresh events (created_at >= 7 days ago) ordered by event_date; group into `eventsByCity` Record in memory; single query for all confirmed non-unsubscribed subscribers with `locations(city, display_name)` join; loop subscribers: look up city events, skip if none (increment skipped), send via Resend with EmailTemplate (increment sent or failed on error); return 200 JSON summary

Verification:
- Route returns 200 with correct sent/skipped/failed counts
- Real emails delivered to confirmed subscribers
- Emails contain Logo, city headline, event list with "New Drop" labels
- Each email footer has working unsubscribe link (`/unsubscribe/[token]`)
- Only 2 DB queries total (no N+1)

### [ ] Step 8: Event Detail Page + Countdown Timer

Implement the full event detail page with live countdown.

Files to create:
- `components/CountdownTimer.tsx` — `'use client'`; single `useEffect` with `setInterval(tick, 1000)` cleared on unmount; displays "Xd Xh Xm Xs"; shows "Event has passed" if now > targetDate
- `app/events/[id]/page.tsx` — server component; fetch event by id from Supabase; 404 if not found; render all event fields; `<CountdownTimer targetDate={event.event_date} />`; Google Calendar link (constructed per spec: action=TEMPLATE, text, dates in YYYYMMDDTHHMMSSZ, details, location); "Get Tickets" CTA with `target="_blank" rel="noopener noreferrer"`; back to homepage link; Logo in header

Verification:
- `/events/[id]` loads for any valid event ID
- Countdown updates every second
- Google Calendar link is well-formed and opens correctly
- 404 page shown for unknown event ID

### [ ] Step 9: Admin Dashboard

Implement the admin dashboard with HTTP Basic Auth, stats display, and manual trigger buttons.

Files to create:
- `app/api/admin/test-email/route.ts` — POST; Basic Auth check; sends sample EmailTemplate to ADMIN_EMAIL via Resend; 200/401/500
- `app/admin/page.tsx` — server component; reads Authorization header via `headers()` from next/headers; parse Basic Auth, verify ADMIN_PASSWORD; return 401 Response if invalid; parallel stats queries via Promise.all (total subscribers, confirmed, unsubscribed, total events, events last 7 days, last_ingest from meta); render dashboard with stats; client-side buttons that POST to /api/ingest and /api/newsletter with Basic Auth header; "Send Test Email" button POSTs to /api/admin/test-email

Verification:
- GET /admin without auth header → 401
- GET /admin with wrong password → 401
- GET /admin with correct password → 200 with stats page
- "Run Ingest Now" button triggers ingest and shows result
- "Send Newsletter Now" button triggers newsletter and shows result
- "Send Test Email" sends to ADMIN_EMAIL
- All stats match actual DB counts

### [ ] Step 10: Deployment Config + Final Verification

Add deployment configuration and verify all integration points.

Files to create:
- `vercel.json` — crons: `/api/ingest` every 6h (`0 */6 * * *`), `/api/newsletter` Sundays 11pm UTC (`0 23 * * 0`)
- `.env.local.example` — all env vars with comments per spec

Final verification checklist:
- [ ] `npm run build` — 0 errors
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] No hardcoded values anywhere; all config via `process.env`
- [ ] CITIES constant is single source of truth (ingest loop, dropdown, generateStaticParams, DB seed)
- [ ] No `is_new` column; freshness uses `created_at >= now() - interval '7 days'` everywhere
- [ ] NormalizedEvent type used throughout; ingest never uses raw API responses directly
- [ ] Upsert never overwrites `created_at`
- [ ] Ingest handles pagination (10-page cap), exponential backoff, per-city failure isolation
- [ ] Newsletter uses in-memory city grouping (no N+1 queries)
- [ ] `/api/ingest` and `/api/newsletter` accept GET + POST, Bearer + Basic Auth
- [ ] City SEO pages use `generateStaticParams()` from CITIES (no Supabase at build time)
- [ ] Admin uses HTTP Basic Auth only (no cookies, no login form)
- [ ] Every subscriber email has unsubscribe link with unique token
- [ ] Subscribers table uses location_id FK (not raw city text)
- [ ] All 4 DB indexes exist
- [ ] App never crashes on empty database
- [ ] Logo component on every page and in email template
- [ ] All outbound ticket links use `target="_blank" rel="noopener noreferrer"`
