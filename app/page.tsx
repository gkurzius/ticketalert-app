import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'
import CityFilter from '@/components/CityFilter'
import TabSwitcher from '@/components/TabSwitcher'
import EventsSection from '@/components/EventsSection'
import type { Event } from '@/types'

interface HomePageProps {
  searchParams: { city?: string; tab?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const citySlug = searchParams.city ?? null
  const activeTab = searchParams.tab === 'upcoming' ? 'upcoming' : 'onsale'
  const now = new Date().toISOString()
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

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
      const cityNames: string[] = [cityMatch.city]
      if (cityMatch.city === 'New York') cityNames.push('New York City', 'NYC')
      query = query.in('venue_city', cityNames)
    }

    const { data, error } = await query
    events = error ? [] : (data ?? [])
  } else {
    let query = supabase
      .from('events')
      .select('*')
      .gte('event_date', now)
      .lte('event_date', ninetyDaysFromNow)
      .order('event_date', { ascending: true })

    if (cityMatch) {
      const cityNames: string[] = [cityMatch.city]
      if (cityMatch.city === 'New York') cityNames.push('New York City', 'NYC')
      query = query.in('venue_city', cityNames)
    }

    const { data, error } = await query
    events = error ? [] : (data ?? [])
  }

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

      <EventsSection
        events={events}
        activeTab={activeTab}
        cityName={cityMatch?.city}
        emptyMessage={emptyMessage}
      />
    </div>
  )
}
