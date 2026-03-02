import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'
import CountdownTimer from '@/components/CountdownTimer'

interface EventDetailProps {
  params: { id: string }
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

  if (event.artist_name) {
    params.set('text', event.artist_name)
  }

  if (event.event_date) {
    const start = new Date(event.event_date)
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    params.set('dates', `${fmt(start)}/${fmt(end)}`)
  }

  const location = [event.venue_name, event.venue_city, event.venue_state]
    .filter(Boolean)
    .join(', ')
  if (location) params.set('location', location)

  const details = [
    event.artist_name ? `Concert: ${event.artist_name}` : '',
    event.ticketing_url ? `Get Tickets: ${event.ticketing_url}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  if (details) params.set('details', details)

  return `${base}?${params.toString()}`
}

export async function generateMetadata({ params }: EventDetailProps): Promise<Metadata> {
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) return {}

  const title = event.artist_name
    ? `${event.artist_name} — ${event.venue_city ?? ''} | TicketAlert`
    : 'Event Details | TicketAlert'

  return {
    title,
    description: `New concert announced: ${event.artist_name ?? 'Event'} at ${event.venue_name ?? 'TBA'} in ${event.venue_city ?? 'TBA'}. Never be the last to know.`,
  }
}

export default async function EventDetailPage({ params }: EventDetailProps) {
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !event) notFound()

  const typedEvent = event as Event

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const isNew = typedEvent.created_at >= sevenDaysAgo

  const calendarUrl = buildGoogleCalendarUrl(typedEvent)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-body font-light text-sm transition-opacity hover:opacity-80"
          style={{ color: '#3B82F6' }}
        >
          ← Back to all concerts
        </Link>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden border"
        style={{ borderColor: '#1e3a5f', backgroundColor: '#0f1829' }}
      >
        {typedEvent.image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${typedEvent.image_url})` }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: typedEvent.image_url
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
            {typedEvent.genre && (
              <span
                className="font-body font-light text-xs px-2 py-0.5 rounded border"
                style={{ borderColor: '#1e3a5f', color: '#60A5FA' }}
              >
                {typedEvent.genre}
              </span>
            )}
          </div>

          <h1
            className="font-display font-extrabold uppercase text-4xl sm:text-5xl lg:text-6xl leading-none"
            style={{ color: '#ffffff' }}
          >
            {typedEvent.artist_name ?? 'Unknown Artist'}
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
              {(typedEvent.venue_name || typedEvent.venue_city) && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-body font-light text-xs uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                    Venue
                  </span>
                  <span className="font-body font-light text-base" style={{ color: '#ffffff' }}>
                    {typedEvent.venue_name}
                    {typedEvent.venue_name && (typedEvent.venue_city || typedEvent.venue_state) ? ' · ' : ''}
                    {[typedEvent.venue_city, typedEvent.venue_state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {typedEvent.event_date && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-body font-light text-xs uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                    Date
                  </span>
                  <span className="font-body font-light text-base" style={{ color: '#ffffff' }}>
                    {formatEventDate(typedEvent.event_date)}
                  </span>
                  {formatEventTime(typedEvent.event_date) && (
                    <span className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
                      {formatEventTime(typedEvent.event_date)}
                    </span>
                  )}
                </div>
              )}

              {(typedEvent.price_range_min != null || typedEvent.price_range_max != null) && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-body font-light text-xs uppercase tracking-widest" style={{ color: '#60A5FA' }}>
                    Price
                  </span>
                  <span className="font-body font-light text-base" style={{ color: '#FFE500' }}>
                    {typedEvent.price_range_min != null
                      ? `From $${Math.round(typedEvent.price_range_min)}`
                      : ''}
                    {typedEvent.price_range_min != null && typedEvent.price_range_max != null
                      ? ` — up to $${Math.round(typedEvent.price_range_max)}`
                      : ''}
                    {typedEvent.price_range_min == null && typedEvent.price_range_max != null
                      ? `Up to $${Math.round(typedEvent.price_range_max)}`
                      : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {typedEvent.ticketing_url ? (
              <a
                href={typedEvent.ticketing_url}
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
          <CountdownTimer targetDate={typedEvent.event_date} />
          {!typedEvent.event_date && (
            <p className="font-body font-light text-sm text-center" style={{ color: '#60A5FA' }}>
              Date to be announced
            </p>
          )}
        </div>
      </div>

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
