import type { Event } from '@/types'

interface OnSaleInfo {
  label: string
  countdown: string
}

interface EventCardProps {
  event: Event
  isNew: boolean
  onSaleInfo?: OnSaleInfo
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

export default function EventCard({ event, isNew, onSaleInfo }: EventCardProps) {
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
            ? 'linear-gradient(to top, rgba(11,17,32,0.98) 0%, rgba(11,17,32,0.75) 50%, rgba(11,17,32,0.4) 100%)'
            : 'none',
        }}
      />

      <div className="relative flex flex-col flex-1 p-5 justify-end gap-3">
        {onSaleInfo && (
          <div
            className="rounded-lg px-3 py-2 flex items-center justify-between gap-2"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid #3B82F6' }}
          >
            <span className="font-body font-light text-xs" style={{ color: '#60A5FA' }}>
              {onSaleInfo.label}
            </span>
            <span
              className="font-display font-extrabold uppercase text-xs px-2 py-0.5 rounded whitespace-nowrap"
              style={{ backgroundColor: '#3B82F6', color: '#ffffff', letterSpacing: '0.06em' }}
            >
              {onSaleInfo.countdown}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
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
        </div>

        <h3
          className="font-display font-extrabold uppercase text-2xl leading-tight"
          style={{ color: '#ffffff' }}
        >
          {event.artist_name ?? 'Unknown Artist'}
        </h3>

        <div className="flex flex-col gap-1">
          {(event.venue_name || event.venue_city) && (
            <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
              {[event.venue_name, event.venue_city && event.venue_state
                ? `${event.venue_city}, ${event.venue_state}`
                : event.venue_city ?? event.venue_state
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <p className="font-body font-light text-sm" style={{ color: '#ffffff', opacity: 0.8 }}>
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
