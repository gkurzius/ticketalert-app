import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { CITIES } from '@/lib/cities'
import { supabase } from '@/lib/supabase'
import { fetchTicketmasterEvents } from '@/lib/providers/ticketmaster'
import type { NormalizedEvent } from '@/lib/providers/normalize'

async function runIngest() {
  let totalAdded = 0
  let totalUpdated = 0
  let citiesFailed = 0
  const citiesProcessed: string[] = []

  for (const cityEntry of CITIES) {
    try {
      let events: NormalizedEvent[] = []
      try {
        events = await fetchTicketmasterEvents(cityEntry.city, cityEntry.state)
      } catch (err) {
        console.error(`[ingest] Ticketmaster fetch failed for ${cityEntry.city}:`, err)
        citiesFailed++
        continue
      }

      let added = 0
      let updated = 0

      for (const event of events) {
        const { error, data } = await supabase
          .from('events')
          .upsert(
            {
              provider: event.provider,
              provider_event_id: event.provider_event_id,
              artist_name: event.artist_name,
              venue_name: event.venue_name,
              venue_city: event.venue_city,
              venue_state: event.venue_state,
              event_date: event.event_date || null,
              announce_date: event.announce_date ?? null,
              onsale_datetime: event.onsale_datetime ?? null,
              onsale_tba: event.onsale_tba,
              ticketing_url: event.ticketing_url,
              genre: event.genre ?? null,
              image_url: event.image_url ?? null,
              price_range_min: event.price_range_min ?? null,
              price_range_max: event.price_range_max ?? null,
            },
            {
              onConflict: 'provider,provider_event_id',
              ignoreDuplicates: false,
            }
          )
          .select('id, created_at')
          .single()

        if (error) {
          console.error(`[ingest] Upsert error for event ${event.provider_event_id}:`, error.message)
          continue
        }

        if (data) {
          const createdAt = new Date(data.created_at)
          const now = new Date()
          const ageMs = now.getTime() - createdAt.getTime()
          if (ageMs < 60_000) {
            added++
          } else {
            updated++
          }
        }
      }

      totalAdded += added
      totalUpdated += updated
      citiesProcessed.push(cityEntry.city)
      console.log(`[ingest] ${cityEntry.city}: ${events.length} events (${added} added, ${updated} updated)`)
    } catch (err) {
      console.error(`[ingest] Unexpected error for ${cityEntry.city}:`, err)
      citiesFailed++
    }
  }

  await supabase.from('meta').upsert(
    { key: 'last_ingest', value: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  const summary = `Ingest complete: ${citiesProcessed.length} cities processed, ${totalAdded} events added, ${totalUpdated} events updated, ${citiesFailed} cities failed`
  console.log(`[ingest] ${summary}`)
  return { cities_processed: citiesProcessed.length, events_added: totalAdded, events_updated: totalUpdated, cities_failed: citiesFailed }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  try {
    const result = await runIngest()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[ingest] Fatal error:', err)
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  try {
    const result = await runIngest()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[ingest] Fatal error:', err)
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 })
  }
}
