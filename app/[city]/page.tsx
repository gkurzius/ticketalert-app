import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'
import TabSwitcher from '@/components/TabSwitcher'
import EventsSection from '@/components/EventsSection'
import type { Event } from '@/types'

interface CityPageProps {
  params: { city: string }
  searchParams: { tab?: string }
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

export default async function CityPage({ params, searchParams }: CityPageProps) {
  const cityData = CITIES.find((c) => c.slug === params.city)
  if (!cityData) notFound()

  const activeTab = searchParams.tab === 'upcoming' ? 'upcoming' : 'onsale'
  const now = new Date().toISOString()
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const cityNames: string[] = [cityData.city]
  if (cityData.city === 'New York') cityNames.push('New York City', 'NYC')

  let events: Event[] = []

  if (activeTab === 'onsale') {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('venue_city', cityNames)
      .not('onsale_datetime', 'is', null)
      .gte('onsale_datetime', now)
      .lte('onsale_datetime', sevenDaysFromNow)
      .order('onsale_datetime', { ascending: true })
    events = error ? [] : (data ?? [])
  } else {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('venue_city', cityNames)
      .gte('event_date', now)
      .lte('event_date', ninetyDaysFromNow)
      .order('event_date', { ascending: true })
    events = error ? [] : (data ?? [])
  }

  const emptyMessage =
    activeTab === 'onsale'
      ? `No ticket drops this week for ${cityData.display_name} — check back soon.`
      : `No concerts found for ${cityData.display_name} yet — check back soon.`

  const countLabel =
    events.length > 0
      ? `${events.length} ${activeTab === 'onsale' ? 'drop' : 'upcoming show'}${events.length === 1 ? '' : 's'} in ${cityData.display_name}`
      : ''

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

      <Suspense fallback={null}>
        <TabSwitcher activeTab={activeTab} basePath={`/${params.city}`} />
      </Suspense>

      <div className="flex items-center justify-between">
        <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
          {countLabel}
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
        events={events}
        activeTab={activeTab}
        cityName={cityData.city}
        emptyMessage={emptyMessage}
      />
    </div>
  )
}
