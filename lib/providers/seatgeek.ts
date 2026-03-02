import type { NormalizedEvent } from './normalize'

const BASE_URL = 'https://api.seatgeek.com/2/events'
const PAGE_CAP = 10

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url)
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5', 10)
        const waitMs = (retryAfter || 5) * 1000 * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, waitMs))
        continue
      }
      return res
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const waitMs = 1000 * Math.pow(2, attempt)
      await new Promise(r => setTimeout(r, waitMs))
    }
  }
  throw lastError ?? new Error('fetchWithRetry: max retries exceeded')
}

function buildTicketingUrl(url: string): string {
  const affiliateId = process.env.SEATGEEK_AFFILIATE_ID
  if (!affiliateId || !url) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}aid=${affiliateId}`
}

function toUtcString(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

type SeatGeekRaw = {
  id: number | string
  title?: string
  url?: string
  datetime_local?: string
  announce_date?: string
  datetime_onsale?: string
  onsale_tba?: boolean
  performers?: Array<{
    image?: string
    genres?: Array<{ name?: string }>
  }>
  venue?: {
    name?: string
    city?: string
    state?: string
  }
  stats?: {
    lowest_price?: number
    average_price?: number
  }
}

type SeatGeekResponse = {
  events: SeatGeekRaw[]
  meta: { total: number; per_page: number }
}

function mapEvent(raw: SeatGeekRaw): NormalizedEvent {
  const performer = raw.performers?.[0]
  const genre = performer?.genres?.[0]?.name

  return {
    provider: 'seatgeek',
    provider_event_id: String(raw.id),
    artist_name: raw.title ?? '',
    venue_name: raw.venue?.name ?? '',
    venue_city: raw.venue?.city ?? '',
    venue_state: raw.venue?.state ?? '',
    event_date: toUtcString(raw.datetime_local) ?? '',
    announce_date: toUtcString(raw.announce_date),
    onsale_datetime: toUtcString(raw.datetime_onsale),
    onsale_tba: raw.onsale_tba ?? false,
    ticketing_url: buildTicketingUrl(raw.url ?? ''),
    genre,
    image_url: performer?.image ?? undefined,
    price_range_min: raw.stats?.lowest_price ?? undefined,
    price_range_max: raw.stats?.average_price ?? undefined,
  }
}

export async function fetchSeatGeekEvents(city: string): Promise<NormalizedEvent[]> {
  const clientId = process.env.SEATGEEK_CLIENT_ID
  if (!clientId) throw new Error('SEATGEEK_CLIENT_ID is not set')

  const today = new Date()
  const ninetyDaysOut = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
  const dateGte = today.toISOString().split('T')[0]
  const dateLte = ninetyDaysOut.toISOString().split('T')[0]

  const events: NormalizedEvent[] = []

  for (let page = 1; page <= PAGE_CAP; page++) {
    const params = new URLSearchParams({
      client_id: clientId,
      'taxonomies.name': 'concert',
      'venue.city': city,
      'datetime_local.gte': dateGte,
      'datetime_local.lte': dateLte,
      per_page: '100',
      page: String(page),
    })

    const url = `${BASE_URL}?${params.toString()}`
    const res = await fetchWithRetry(url)

    if (!res.ok) {
      throw new Error(`SeatGeek API error ${res.status} for city "${city}" page ${page}`)
    }

    const data = (await res.json()) as SeatGeekResponse
    const rawEvents = data.events ?? []

    for (const raw of rawEvents) {
      events.push(mapEvent(raw))
    }

    const total = data.meta?.total ?? 0
    const perPage = data.meta?.per_page ?? 100
    const maxPages = Math.ceil(total / perPage)

    if (page >= maxPages) break
  }

  return events
}
