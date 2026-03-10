import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'
import { toSlug } from '@/lib/slugify'
import CountdownTimer from '@/components/CountdownTimer'
import EventCard from '@/components/EventCard'
import type { Event } from '@/types'

interface EventSlugPageProps {
  params: { slug: string }
}

function parseEventSlug(slug: string): { artistSlug: string; citySlug: string; date: string } | null {
  const dateMatch = slug.match(/(\d{4}-\d{2}-\d{2})$/)
  if (!dateMatch) return null
  const date = dateMatch[1]
  const withoutDate = slug.slice(0, slug.length - date.length - 1)

  const sortedCities = [...CITIES].sort((a, b) => b.slug.length - a.slug.length)
  for (const city of sortedCities) {
    if (withoutDate.endsWith(`-${city.slug}`)) {
      const artistSlug = withoutDate.slice(0, withoutDate.length - city.slug.length - 1)
      if (artistSlug.length > 0) {
        return { artistSlug, citySlug: city.slug, date }
      }
    }
  }

  return null
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBA'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatEventTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function buildGoogleCalendarUrl(event: Event): string {
  const base = 'https://calendar.google.com/calendar/render'
  const params = new URLSearchParams({ action: 'TEMPLATE' })

  if (event.artist_name) params.set('text', event.artist_name)

  if (event.event_date) {
    const start = new Date(event.event_date)
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    params.set('dates', `${fmt(start)}/${fmt(end)}`)
  }

  const location = [event.venue_name, event.venue_city, event.venue_state].filter(Boolean).join(', ')
  if (location) params.set('location', location)

  const details = [
    event.artist_name ? `Concert: ${event.artist_name}` : '',
    event.ticketing_url ? `Get Tickets: ${event.ticketing_url}` : '',
  ].filter(Boolean).join('\n')
  if (details) params.set('details', details)

  return `${base}?${params.toString()}`
}

async function findEvent(slug: string): Promise<Event | null> {
  const parsed = parseEventSlug(slug)
  if (!parsed) return null

  const { artistSlug, citySlug, date } = parsed
  const cityData = CITIES.find((c) => c.slug === citySlug)
  if (!cityData) return null

  const cityNames: string[] = [cityData.city]
  if (cityData.city === 'New York') cityNames.push('New York City', 'NYC')

  const dateStart = `${date}T00:00:00Z`
  const dateEnd = `${date}T23:59:59Z`

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('venue_city', cityNames)
    .gte('event_date', dateStart)
    .lte('event_date', dateEnd)
    .limit(50)

  const matches = (events ?? []).filter(
    (e: Event) => e.artist_name && toSlug(e.artist_name) === artistSlug
  )

  return (matches[0] as Event) ?? null
}

export async function generateMetadata({ params }: EventSlugPageProps): Promise<Metadata> {
  const event = await findEvent(params.slug)
  if (!event) return {}

  const cityState = [event.venue_city, event.venue_state].filter(Boolean).join(', ')

  return {
    title: `${event.artist_name ?? 'Event'} in ${cityState} — Tickets & On-Sale Date — TicketAlert`,
    description: `${event.artist_name} is performing at ${event.venue_name ?? 'TBA'} in ${cityState}. ${event.onsale_datetime ? `Tickets on sale soon.` : ''} Get tickets now.`,
  }
}

export default async function EventSlugPage({ params }: EventSlugPageProps) {
  const event = await findEvent(params.slug)
  if (!event) notFound()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const isNew = event.created_at >= sevenDaysAgo
  const calendarUrl = buildGoogleCalendarUrl(event)

  const now = new Date().toISOString()
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  const cityData = CITIES.find((c) => event.venue_city === c.city || event.venue_city === 'New York City' && c.city === 'New York')
  const citySlug = cityData?.slug

  const { data: relatedEvents } = await supabase
    .from('events')
    .select('*')
    .in('venue_city', event.venue_city ? [event.venue_city, ...(event.venue_city === 'New York' ? ['New York City', 'NYC'] : [])] : [])
    .gte('event_date', now)
    .lte('event_date', ninetyDaysFromNow)
    .neq('id', event.id)
    .order('event_date', { ascending: true })
    .limit(3)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href={citySlug ? `/${citySlug}` : '/'}
          className="inline-flex items-center gap-1 font-body font-light text-sm transition-opacity hover:opacity-80"
          style={{ color: '#3B82F6' }}
        >
          ← {citySlug ? `Back to ${cityData?.display_name}` : 'Back to all concerts'}
        </Link>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden border"
        style={{ borderColor: '#1e3a5f', backgroundColor: '#0f1829' }}
      >
        {event.image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: event.image_url
              ? 'linear-gradient(to top, rgba(11,17,32,1) 0%, rgba(11,17,32,0.85) 60%, rgba(11,17,32,0.5) 100%)'
              : 'none',
          }}
        />

        <div className="relative p-8 sm:p-12 flex flex-col gap-4 min-h-[280px] justify-end">
          <div className="flex flex-wrap items-center gap-2">
            {isNew && (
              <span
                className="font-display font-extrabold uppercase text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
              >
                New Drop
              </span>
            )}
            {event.genre && (
              <span
                className="font-body font-light text-xs px-2 py-0.5 rounded border"
                style={{ borderColor: '#1e3a5f', color: '#60A5FA' }}
              >
                {event.genre}
              </span>
            )}
          </div>

          <h1
            className="font-display font-extrabold uppercase text-4xl sm:text-5xl lg:text-6xl leading-none"
            style={{ color: '#ffffff' }}
          >
            {event.artist_name ?? 'Unknown Artist'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-xl border p-6 space-y-4"
            style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
          >
            <h2
              className="font-display font-extrabold uppercase text-xl"
              style={{ color: '#FFE500' }}
            >
              Event Details
            </h2>

            <div className="space-y-3">
              {(event.venue_name || event.venue_city) && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-body font-light text-xs uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                    Venue
                  </span>
                  <span className="font-body font-light text-base" style={{ color: '#ffffff' }}>
                    {event.venue_name}
                    {event.venue_name && (event.venue_city || event.venue_state) ? ' · ' : ''}
                    {[event.venue_city, event.venue_state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {event.event_date && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-body font-light text-xs uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                    Date
                  </span>
                  <span className="font-body font-light text-base" style={{ color: '#ffffff' }}>
                    {formatEventDate(event.event_date)}
                  </span>
                  {formatEventTime(event.event_date) && (
                    <span className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
                      {formatEventTime(event.event_date)}
                    </span>
                  )}
                </div>
              )}

              {event.onsale_datetime && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-body font-light text-xs uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                    On Sale
                  </span>
                  <span className="font-body font-light text-base" style={{ color: '#FFE500' }}>
                    {formatEventDate(event.onsale_datetime)} at {formatEventTime(event.onsale_datetime)}
                  </span>
                </div>
              )}

              {(event.price_range_min != null || event.price_range_max != null) && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-body font-light text-xs uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                    Price
                  </span>
                  <span className="font-body font-light text-base" style={{ color: '#FFE500' }}>
                    {event.price_range_min != null ? `From $${Math.round(event.price_range_min)}` : ''}
                    {event.price_range_min != null && event.price_range_max != null
                      ? ` — up to $${Math.round(event.price_range_max)}`
                      : ''}
                    {event.price_range_min == null && event.price_range_max != null
                      ? `Up to $${Math.round(event.price_range_max)}`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {event.ticketing_url ? (
              <a
                href={event.ticketing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center font-display font-extrabold uppercase text-base px-6 py-4 rounded-xl transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
              >
                Get Tickets
              </a>
            ) : (
              <span
                className="flex-1 text-center font-display font-extrabold uppercase text-base px-6 py-4 rounded-xl opacity-50"
                style={{ backgroundColor: '#1e3a5f', color: '#ffffff', letterSpacing: '0.08em' }}
              >
                Tickets TBA
              </span>
            )}

            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center font-display font-extrabold uppercase text-base px-6 py-4 rounded-xl border transition-opacity hover:opacity-80"
              style={{ borderColor: '#1e3a5f', color: '#60A5FA', letterSpacing: '0.08em', backgroundColor: '#0f1829' }}
            >
              Add to Calendar
            </a>
          </div>
        </div>

        <div
          className="rounded-xl border p-6 flex flex-col items-center justify-center gap-4"
          style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
        >
          <h2
            className="font-display font-extrabold uppercase text-lg text-center"
            style={{ color: '#ffffff' }}
          >
            Event Countdown
          </h2>
          <CountdownTimer targetDate={event.event_date} />
          {!event.event_date && (
            <p className="font-body font-light text-sm text-center" style={{ color: '#60A5FA' }}>
              Date to be announced
            </p>
          )}
        </div>
      </div>

      {relatedEvents && relatedEvents.length > 0 && (
        <div className="space-y-4">
          <h2
            className="font-display font-extrabold uppercase text-2xl"
            style={{ color: '#ffffff' }}
          >
            More Shows in {event.venue_city}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(relatedEvents as Event[]).map((e) => (
              <EventCard key={e.id} event={e} showOnSaleBox />
            ))}
          </div>
        </div>
      )}

      <div
        className="rounded-xl border p-8 text-center"
        style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
      >
        <h2
          className="font-display font-extrabold uppercase text-2xl mb-2"
          style={{ color: '#FFE500' }}
        >
          Never miss a drop
        </h2>
        <p className="font-body font-light text-base mb-6" style={{ color: '#60A5FA' }}>
          Get new concert announcements delivered to your inbox every week.
        </p>
        <a
          href="/subscribe"
          className="inline-block font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
        >
          Get Concert Alerts
        </a>
      </div>
    </div>
  )
}
