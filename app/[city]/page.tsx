import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'
import EventCard from '@/components/EventCard'
import type { Event } from '@/types'

interface CityPageProps {
  params: { city: string }
}

export async function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }))
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const cityData = CITIES.find((c) => c.slug === params.city)
  if (!cityData) return {}

  return {
    title: `New Concerts Announced in ${cityData.display_name} | TicketAlert`,
    description: `Never be the last to know about concerts in ${cityData.city}. Get notified the moment new shows are announced.`,
  }
}

function SubscribeCTA({ cityName }: { cityName: string }) {
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
        Get {cityName} concert alerts in your inbox every week.
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

export default async function CityPage({ params }: CityPageProps) {
  const cityData = CITIES.find((c) => c.slug === params.city)
  if (!cityData) notFound()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('venue_city', cityData.city)
    .gte('event_date', now)
    .order('event_date', { ascending: true })

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
          <span style={{ color: '#FFE500' }}>in {cityData.city}</span>
        </h1>
        <p
          className="font-body font-light text-lg sm:text-xl max-w-2xl mx-auto"
          style={{ color: '#60A5FA' }}
        >
          Never be the last to know. TicketAlert surfaces newly announced shows the moment they appear in {cityData.display_name}.
        </p>
      </section>

      <div className="flex items-center justify-between">
        <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
          {safeEvents.length > 0
            ? `${safeEvents.length} upcoming show${safeEvents.length === 1 ? '' : 's'} in ${cityData.display_name}`
            : ''}
        </p>
        <a
          href="/"
          className="font-body font-light text-sm transition-opacity hover:opacity-80"
          style={{ color: '#3B82F6' }}
        >
          ← All Cities
        </a>
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
            No concerts found for {cityData.display_name} yet — check back soon.
          </p>
          <a
            href="/subscribe"
            className="inline-block mt-6 font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
          >
            Get Notified When Shows Drop
          </a>
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
              <SubscribeCTA cityName={cityData.city} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restChunk.map((event) => (
                  <EventCard key={event.id} event={event} isNew={freshSet.has(event.id)} />
                ))}
              </div>
            </>
          )}

          {restChunk.length === 0 && <SubscribeCTA cityName={cityData.city} />}
        </>
      )}
    </div>
  )
}
