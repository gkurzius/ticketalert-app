import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toSlug } from '@/lib/slugify'
import EventCard from '@/components/EventCard'
import ArtistFollowForm from '@/components/ArtistFollowForm'
import type { Event } from '@/types'

interface ArtistPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { data: events } = await supabase
    .from('events')
    .select('artist_name')
    .not('artist_name', 'is', null)
    .gte('event_date', new Date().toISOString())
    .limit(200)

  const match = (events ?? []).find(
    (e) => e.artist_name && toSlug(e.artist_name) === params.slug
  )

  const artistName = match?.artist_name ?? params.slug

  return {
    title: `${artistName} Tickets & Tour Dates — TicketAlert`,
    description: `Find upcoming ${artistName} concerts and tour dates. Get notified when ${artistName} announces new shows.`,
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const now = new Date().toISOString()
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .not('artist_name', 'is', null)
    .gte('event_date', now)
    .lte('event_date', ninetyDaysFromNow)
    .order('event_date', { ascending: true })
    .limit(500)

  const events: Event[] = (allEvents ?? []).filter(
    (e: Event) => e.artist_name && toSlug(e.artist_name) === params.slug
  )

  const artistName = events[0]?.artist_name ?? null

  if (!artistName && events.length === 0) {
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
          className="rounded-xl border p-16 text-center"
          style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
        >
          <p
            className="font-display font-extrabold uppercase text-3xl mb-4"
            style={{ color: '#FFE500' }}
          >
            No upcoming shows found
          </p>
          <p className="font-body font-light text-base mb-8" style={{ color: '#60A5FA' }}>
            We couldn&apos;t find any upcoming concerts for this artist. Check back soon — new shows get added every day.
          </p>
          <ArtistFollowForm artistName={params.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-body font-light text-sm transition-opacity hover:opacity-80"
          style={{ color: '#3B82F6' }}
        >
          ← Back to all concerts
        </Link>
      </div>

      <section className="text-center py-12">
        <h1
          className="font-display font-extrabold uppercase text-5xl sm:text-6xl lg:text-7xl mb-4 leading-none"
          style={{ color: '#ffffff' }}
        >
          {artistName}
        </h1>
        <p
          className="font-body font-light text-lg sm:text-xl max-w-2xl mx-auto"
          style={{ color: '#60A5FA' }}
        >
          {events.length} upcoming show{events.length === 1 ? '' : 's'} — never be the last to know.
        </p>
      </section>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} showOnSaleBox />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border p-16 text-center"
          style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
        >
          <p
            className="font-display font-extrabold uppercase text-2xl mb-2"
            style={{ color: '#FFE500' }}
          >
            No upcoming shows
          </p>
          <p className="font-body font-light text-base" style={{ color: '#60A5FA' }}>
            No upcoming concerts found for {artistName} — check back soon.
          </p>
        </div>
      )}

      {artistName && <ArtistFollowForm artistName={artistName} />}
    </div>
  )
}
