import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'
import EventCard from '@/components/EventCard'
import CityFilter from '@/components/CityFilter'
import type { Event } from '@/types'

interface HomePageProps {
  searchParams: { city?: string }
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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const cityMatch = citySlug ? CITIES.find((c) => c.slug === citySlug) : null

  let query = supabase
    .from('events')
    .select('*')
    .gte('event_date', now)
    .order('event_date', { ascending: true })

  if (cityMatch) {
    query = query.eq('venue_city', cityMatch.city)
  }

  const { data: events, error } = await query

  const safeEvents: Event[] = error ? [] : (events ?? [])

  const freshSet = new Set<string>()
  for (const e of safeEvents) {
    if (e.created_at >= sevenDaysAgo) freshSet.add(e.id)
  }

  const firstChunk = safeEvents.slice(0, 6)
  const restChunk = safeEvents.slice(6)

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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
          {safeEvents.length > 0
            ? `${safeEvents.length} upcoming show${safeEvents.length === 1 ? '' : 's'}${cityMatch ? ` in ${cityMatch.display_name}` : ''}`
            : ''}
        </p>
        <Suspense fallback={null}>
          <CityFilter />
        </Suspense>
      </div>

      {safeEvents.length === 0 ? (
        <div
          className="rounded-xl border p-16 text-center"
          style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
        >
          <p
            className="font-display font-extrabold uppercase text-2xl mb-2"
            style={{ color: '#FFE500' }}
          >
            No concerts found
          </p>
          <p className="font-body font-light text-base" style={{ color: '#60A5FA' }}>
            {cityMatch
              ? `No concerts found for ${cityMatch.display_name} yet — check back soon.`
              : 'No concerts found yet — check back soon.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {firstChunk.map((event) => (
              <EventCard key={event.id} event={event} isNew={freshSet.has(event.id)} />
            ))}
          </div>

          {restChunk.length > 0 && (
            <>
              <SubscribeCTA />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restChunk.map((event) => (
                  <EventCard key={event.id} event={event} isNew={freshSet.has(event.id)} />
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
