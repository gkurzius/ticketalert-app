'use client'

import type { Event } from '@/types'

interface EventCardProps {
  event: Event
  showOnSaleBox?: boolean
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBA'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatOnsaleLabel(onsale: string): string {
  const date = new Date(onsale)
  return `On Sale ${date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
}

type Badge = { emoji: string; bgColor: string; textColor: string }

function computeBadge(event: Event): Badge | null {
  const now = Date.now()
  const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000
  const fortyEightHoursFromNow = now + 48 * 60 * 60 * 1000

  const onsaleTs = event.onsale_datetime ? new Date(event.onsale_datetime).getTime() : null
  const eventTs = event.event_date ? new Date(event.event_date).getTime() : null
  const createdTs = new Date(event.created_at).getTime()

  const isLastChance = eventTs !== null && eventTs > now && eventTs <= fortyEightHoursFromNow
  const isNewDrop = createdTs >= fortyEightHoursAgo && onsaleTs !== null && onsaleTs > now
  const isOnSaleNow = onsaleTs !== null && onsaleTs <= now && eventTs !== null && eventTs > now
  const isHot = event.price_range_min !== null && event.price_range_min > 150

  if (isLastChance) return { emoji: '⏰', bgColor: '#EF4444', textColor: '#ffffff' }
  if (isNewDrop) return { emoji: '🆕', bgColor: '#FFE500', textColor: '#0a0a0a' }
  if (isOnSaleNow) return { emoji: '✅', bgColor: '#22C55E', textColor: '#ffffff' }
  if (isHot) return { emoji: '🔥', bgColor: '#F97316', textColor: '#ffffff' }
  return null
}

export default function EventCard({ event, showOnSaleBox = false }: EventCardProps) {
  const badge = computeBadge(event)
  const now = Date.now()
  const onsaleInFuture = event.onsale_datetime && new Date(event.onsale_datetime).getTime() > now

  const hasTopLine = badge || (showOnSaleBox && onsaleInFuture && event.onsale_datetime) || event.genre

  return (
    <div
      className="relative rounded-xl overflow-hidden flex flex-col min-h-[320px] border"
      style={{ borderColor: '#1e3a5f', backgroundColor: '#0f1829' }}
    >
      {event.image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${event.image_url})` }}
        />
      ) : null}

      <div
        className="absolute inset-0"
        style={{
          background: event.image_url
            ? 'linear-gradient(to top, rgba(11,17,32,0.98) 0%, rgba(11,17,32,0.8) 55%, rgba(11,17,32,0.45) 100%)'
            : 'none',
        }}
      />

      <div className="relative flex flex-col flex-1 p-5 justify-end gap-2">
        {hasTopLine && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {badge && (
              <span
                className="text-sm px-1.5 py-0.5 rounded"
                style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
              >
                {badge.emoji}
              </span>
            )}
            {showOnSaleBox && onsaleInFuture && event.onsale_datetime && (
              <span
                className="font-body font-light text-xs px-2 py-0.5 rounded border"
                style={{ borderColor: '#3B82F6', color: '#60A5FA' }}
              >
                {formatOnsaleLabel(event.onsale_datetime)}
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
        )}

        <h3 className="font-display font-extrabold text-2xl leading-tight" style={{ color: '#ffffff' }}>
          {event.artist_name ?? 'Unknown Artist'}
        </h3>

        <div className="flex flex-col gap-0.5">
          {(event.venue_name || event.venue_city) && (
            <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
              {[
                event.venue_name,
                event.venue_city && event.venue_state
                  ? `${event.venue_city}, ${event.venue_state}`
                  : event.venue_city ?? event.venue_state,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <p className="font-body font-light text-sm" style={{ color: '#ffffff', opacity: 0.75 }}>
            {formatEventDate(event.event_date)}
          </p>
          {event.price_range_min != null && (
            <p className="font-body text-sm font-light" style={{ color: '#FFE500' }}>
              From ${Math.round(event.price_range_min)}
            </p>
          )}
        </div>

        {event.ticketing_url ? (
          <a
            href={event.ticketing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-center font-display font-extrabold uppercase text-sm px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
          >
            Get Tickets
          </a>
        ) : (
          <span
            className="mt-1 inline-block text-center font-display font-extrabold uppercase text-sm px-4 py-2 rounded-lg opacity-50"
            style={{ backgroundColor: '#1e3a5f', color: '#ffffff', letterSpacing: '0.08em' }}
          >
            Tickets TBA
          </span>
        )}
      </div>
    </div>
  )
}
