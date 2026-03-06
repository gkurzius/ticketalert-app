import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'
import EventCard from '@/components/EventCard'
import CityFilter from '@/components/CityFilter'
import TabSwitcher from '@/components/TabSwitcher'
import type { Event } from '@/types'

interface HomePageProps {
  searchParams: { city?: string; tab?: string }
}

function formatOnsaleLabel(onsale: string): string {
  const date = new Date(onsale)
  return `On Sale ${date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
}

function formatOnsaleCountdown(onsale: string): string {
  const diff = new Date(onsale).getTime() - Date.now()
  if (diff <= 0) return 'On Sale Now'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'On Sale Soon'
  if (hours < 24) return `in ${hours}h`
  const days = Math.floor(hours / 24)
  return `in ${days} day${days === 1 ? '' : 's'}`
}

function SubscribeCTA() {
  return (
    <div
      className="rounded-xl border p-8 text-center my-8"
      style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
    >
      <h2
        className="font-display font-extrabold uppercase text-3xl mb-2"
        style={{ color: '#FFE500' }}
      >
        Never be the last to know
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
  )
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const citySlug = searchParams.city ?? null
  const activeTab = searchParams.tab === 'upcoming' ? 'upcoming' : 'onsale'
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const cityMatch = citySlug ? CITIES.find((c) => c.slug === citySlug) : null

  let events: Event[] = []

  if (activeTab === 'onsale') {
    let query = supabase
      .from('events')
      .select('*')
      .not('onsale_datetime', 'is', null)
      .gte('onsale_datetime', now)
      .lte('onsale_datetime', sevenDaysFromNow)
      .order('onsale_datetime', { ascending: true })

    if (cityMatch) {
      query = query.eq('venue_city', cityMatch.city)
    }

    const { data, error } = await query
    events = error ? [] : (data ?? [])
  } else {
    let query = supabase
      .from('events')
      .select('*')
      .gte('event_date', now)
      .order('event_date', { ascending: true })

    if (cityMatch) {
      query = query.eq('venue_city', cityMatch.city)
    }

    const { data, error } = await query
    events = error ? [] : (data ?? [])
  }

  const freshSet = new Set<string>()
  for (const e of events) {
    if (e.created_at >= sevenDaysAgo) freshSet.add(e.id)
  }

  const firstChunk = events.slice(0, 6)
  const restChunk = events.slice(6)

  const emptyMessage =
    activeTab === 'onsale'
      ? cityMatch
        ? `No ticket drops this week for ${cityMatch.display_name} — check back soon.`
        : 'No ticket drops this week — check back soon.'
      : cityMatch
        ? `No concerts found for ${cityMatch.display_name} yet — check back soon.`
        : 'No concerts found yet — check back soon.'

  return (
    <div className="space-y-6">
      <section className="text-center py-12">
        <h1
          className="font-display font-extrabold uppercase text-5xl sm:text-6xl lg:text-7xl mb-4 leading-none"
          style={{ color: '#ffffff' }}
        >
          New concerts just announced{' '}
          <span style={{ color: '#FFE500' }}>in your city</span>
        </h1>
        <p
          className="font-body font-light text-lg sm:text-xl max-w-2xl mx-auto"
          style={{ color: '#60A5FA' }}
        >
          Never be the last to know. TicketAlert surfaces newly announced shows the moment they appear.
        </p>
      </section>

      <Suspense fallback={null}>
        <TabSwitcher activeTab={activeTab} />
      </Suspense>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
          {events.length > 0
            ? `${events.length} ${activeTab === 'onsale' ? 'drop' : 'upcoming show'}${events.length === 1 ? '' : 's'}${cityMatch ? ` in ${cityMatch.display_name}` : ''}`
            : ''}
        </p>
        <Suspense fallback={null}>
          <CityFilter />
        </Suspense>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-xl border p-16 text-center"
          style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
        >
          <p
            className="font-display font-extrabold uppercase text-2xl mb-2"
            style={{ color: '#FFE500' }}
          >
            {activeTab === 'onsale' ? 'No Drops This Week' : 'No Concerts Found'}
          </p>
          <p className="font-body font-light text-base" style={{ color: '#60A5FA' }}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {firstChunk.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isNew={freshSet.has(event.id)}
                onSaleInfo={
                  activeTab === 'onsale' && event.onsale_datetime
                    ? {
                        label: formatOnsaleLabel(event.onsale_datetime),
                        countdown: formatOnsaleCountdown(event.onsale_datetime),
                      }
                    : undefined
                }
              />
            ))}
          </div>

          {restChunk.length > 0 && (
            <>
              <SubscribeCTA />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restChunk.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isNew={freshSet.has(event.id)}
                    onSaleInfo={
                      activeTab === 'onsale' && event.onsale_datetime
                        ? {
                            label: formatOnsaleLabel(event.onsale_datetime),
                            countdown: formatOnsaleCountdown(event.onsale_datetime),
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </>
          )}

          {restChunk.length === 0 && <SubscribeCTA />}
        </>
      )}
    </div>
  )
}
