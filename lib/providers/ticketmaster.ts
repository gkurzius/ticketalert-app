import type { NormalizedEvent } from './normalize'

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'
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

function toUtcString(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

function getBestImage(images: Array<{ url?: string; width?: number; height?: number }> | undefined): string | undefined {
  if (!images || images.length === 0) return undefined
  const sorted = [...images].sort((a, b) => {
    const aPixels = (a.width ?? 0) * (a.height ?? 0)
    const bPixels = (b.width ?? 0) * (b.height ?? 0)
    return bPixels - aPixels
  })
  return sorted[0]?.url ?? undefined
}

type TicketmasterImage = {
  url?: string
  width?: number
  height?: number
}

type TicketmasterVenue = {
  name?: string
  city?: { name?: string }
  state?: { stateCode?: string }
}

type TicketmasterClassification = {
  genre?: { name?: string }
}

type TicketmasterPresale = {
  startDateTime?: string
  endDateTime?: string
}

type TicketmasterRaw = {
  id: string
  name?: string
  url?: string
  dates?: {
    start?: {
      dateTime?: string
    }
  }
  sales?: {
    public?: {
      startDateTime?: string
      startTBD?: boolean
    }
    presales?: TicketmasterPresale[]
  }
  _embedded?: {
    venues?: TicketmasterVenue[]
  }
  classifications?: TicketmasterClassification[]
  images?: TicketmasterImage[]
  priceRanges?: Array<{
    min?: number
    max?: number
  }>
}

type TicketmasterResponse = {
  _embedded?: {
    events?: TicketmasterRaw[]
  }
  page?: {
    totalPages?: number
    number?: number
  }
}

function mapEvent(raw: TicketmasterRaw): NormalizedEvent {
  const venue = raw._embedded?.venues?.[0]
  const genre = raw.classifications?.[0]?.genre?.name
  const bestImage = getBestImage(raw.images)
  const priceRange = raw.priceRanges?.[0]

  const publicSale = raw.sales?.public
  const presales = raw.sales?.presales ?? []
  const now = new Date()
  const upcomingPresale = presales
    .filter(p => p.startDateTime && new Date(p.startDateTime) > now)
    .sort((a, b) => new Date(a.startDateTime!).getTime() - new Date(b.startDateTime!).getTime())[0]

  const onsaleDatetime = toUtcString(publicSale?.startDateTime) ?? toUtcString(upcomingPresale?.startDateTime)

  return {
    provider: 'ticketmaster',
    provider_event_id: String(raw.id),
    artist_name: raw.name ?? '',
    venue_name: venue?.name ?? '',
    venue_city: venue?.city?.name ?? '',
    venue_state: venue?.state?.stateCode ?? '',
    event_date: toUtcString(raw.dates?.start?.dateTime) ?? '',
    onsale_datetime: onsaleDatetime,
    onsale_tba: publicSale?.startTBD ?? false,
    ticketing_url: raw.url ?? '',
    genre,
    image_url: bestImage,
    price_range_min: priceRange?.min ?? undefined,
    price_range_max: priceRange?.max ?? undefined,
  }
}

export async function fetchTicketmasterEvents(city: string, state: string): Promise<NormalizedEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) throw new Error('TICKETMASTER_API_KEY is not set')

  const now = new Date()
  const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const endDateTime = ninetyDaysOut.toISOString().replace(/\.\d{3}Z$/, 'Z')

  const events: NormalizedEvent[] = []

  for (let page = 0; page < PAGE_CAP; page++) {
    try {
      const params = new URLSearchParams({
        apikey: apiKey,
        classificationName: 'music',
        city,
        stateCode: state,
        startDateTime,
        endDateTime,
        size: '200',
        page: String(page),
      })

      const url = `${BASE_URL}?${params.toString()}`
      const res = await fetchWithRetry(url)

      if (!res.ok) {
        console.error(
          `Ticketmaster API error ${res.status} for city "${city}" page ${page} — stopping pagination`
        )
        break
      }

      const data = (await res.json()) as TicketmasterResponse
      const rawEvents = data._embedded?.events ?? []

      for (const raw of rawEvents) {
        events.push(mapEvent(raw))
      }

      const totalPages = data.page?.totalPages ?? 1
      if (page + 1 >= totalPages) break
    } catch (err) {
      console.error(`Error fetching Ticketmaster page ${page} for city "${city}":`, err)
      break
    }
  }

  return events
}
