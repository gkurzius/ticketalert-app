import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { slugMatchesArtist, artistPageSlugToSearchSlug, formatSlugAsTitle } from '@/lib/slugify'
import EventCard from '@/components/EventCard'
import ArtistFollowForm from '@/components/ArtistFollowForm'
import type { Event } from '@/types'

interface ArtistPageProps {
  params: { slug: string }
}

async function getArtistEvents(pageSlug: string): Promise<Event[]> {
  const searchSlug = artistPageSlugToSearchSlug(pageSlug)
  const nameHint = searchSlug.replace(/-/g, ' ')
  const now = new Date().toISOString()

  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .not('artist_name', 'is', null)
    .ilike('artist_name', `${nameHint}%`)
    .gte('event_date', now)
    .order('event_date', { ascending: true })

  return (allEvents ?? []).filter(
    (e: Event) => e.artist_name && slugMatchesArtist(searchSlug, e.artist_name)
  )
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const events = await getArtistEvents(params.slug)
  const fullName = events[0]?.artist_name ?? formatSlugAsTitle(params.slug.replace(/-tickets$/, ''))

  return {
    title: `${fullName} Tickets & Tour Dates — TicketAlert`,
    description: `Find upcoming ${fullName} concerts and tour dates. Get notified when ${fullName} announces new shows.`,
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const events = await getArtistEvents(params.slug)
  const artistName = events[0]?.artist_name ?? null
  const displayName = artistName ?? formatSlugAsTitle(params.slug.replace(/-tickets$/, ''))

  if (events.length === 0) {
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
          <ArtistFollowForm artistName={displayName} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} showOnSaleBox />
        ))}
      </div>

      <ArtistFollowForm artistName={artistName!} />
    </div>
  )
}
