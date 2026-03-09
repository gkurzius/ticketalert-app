'use client'

import { useState, useMemo } from 'react'
import EventCard from './EventCard'
import type { Event } from '@/types'

function SubscribeCTA({ cityName }: { cityName?: string }) {
  return (
    <div
      className="rounded-xl border p-8 text-center"
      style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
    >
      <h2 className="font-display font-extrabold uppercase text-3xl mb-2" style={{ color: '#FFE500' }}>
        Never be the last to know
      </h2>
      <p className="font-body font-light text-base mb-6" style={{ color: '#60A5FA' }}>
        {cityName
          ? `Get ${cityName} concert alerts in your inbox every week.`
          : 'Get new concert announcements delivered to your inbox every week.'}
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

interface EventsSectionProps {
  events: Event[]
  activeTab: string
  cityName?: string
  emptyMessage: string
}

export default function EventsSection({ events, activeTab, cityName, emptyMessage }: EventsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('')

  const genres = useMemo(() => {
    const set = new Set<string>()
    for (const e of events) {
      if (e.genre) set.add(e.genre)
    }
    return Array.from(set).sort()
  }, [events])

  const filtered = useMemo(() => {
    let result = events
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.artist_name?.toLowerCase().includes(q) ||
          e.venue_name?.toLowerCase().includes(q)
      )
    }
    if (genreFilter) {
      result = result.filter((e) => e.genre === genreFilter)
    }
    return result
  }, [events, searchQuery, genreFilter])

  const showOnSaleBox = activeTab === 'onsale'

  const chunks: Array<Event[] | 'cta'> = []
  for (let i = 0; i < filtered.length; i += 10) {
    chunks.push(filtered.slice(i, i + 10))
    if (i + 10 < filtered.length) chunks.push('cta')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search artists or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full font-body font-light text-sm rounded-lg px-4 py-2 border outline-none pl-9"
            style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f', color: '#ffffff' }}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#60A5FA' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {genres.length > 0 && (
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="font-body font-light text-sm rounded-lg px-3 py-2 border outline-none"
            style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f', color: '#ffffff' }}
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
      </div>

      {(searchQuery || genreFilter) && (
        <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
          {filtered.length} result{filtered.length === 1 ? '' : 's'}
          {searchQuery && ` for "${searchQuery}"`}
          {genreFilter && ` in ${genreFilter}`}
        </p>
      )}

      {filtered.length === 0 ? (
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
            {searchQuery || genreFilter
              ? 'No results — try adjusting your search or filters.'
              : emptyMessage}
          </p>
        </div>
      ) : (
        <>
          {chunks.map((chunk, i) =>
            chunk === 'cta' ? (
              <SubscribeCTA key={`cta-${i}`} cityName={cityName} />
            ) : (
              <div key={`grid-${i}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {chunk.map((event) => (
                  <EventCard key={event.id} event={event} showOnSaleBox={showOnSaleBox} />
                ))}
              </div>
            )
          )}
          <SubscribeCTA cityName={cityName} />
        </>
      )}
    </div>
  )
}
