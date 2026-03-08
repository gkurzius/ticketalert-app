import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'
import EventsSection from '@/components/EventsSection'
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

export default async function CityPage({ params }: CityPageProps) {
  const cityData = CITIES.find((c) => c.slug === params.city)
  if (!cityData) notFound()

  const now = new Date().toISOString()
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const cityNames: string[] = [cityData.city]
  if (cityData.city === 'New York') cityNames.push('New York City', 'NYC')

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .in('venue_city', cityNames)
    .gte('event_date', now)
    .lte('event_date', ninetyDaysFromNow)
    .order('event_date', { ascending: true })

  const safeEvents: Event[] = error ? [] : (events ?? [])

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
          Never be the last to know. TicketAlert surfaces newly announced shows the moment they appear in{' '}
          {cityData.display_name}.
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

      <EventsSection
        events={safeEvents}
        activeTab="upcoming"
        cityName={cityData.city}
        emptyMessage={`No concerts found for ${cityData.display_name} yet — check back soon.`}
      />
    </div>
  )
}
