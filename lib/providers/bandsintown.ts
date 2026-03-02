import type { NormalizedEvent } from './normalize'

const BASE_URL = 'https://rest.bandsintown.com/artists'

type BandsintownOffer = {
  type?: string
  url?: string
  status?: string
}

type BandsintownRaw = {
  id: number | string
  datetime?: string
  announced_date?: string
  url?: string
  venue?: {
    name?: string
    city?: string
    region?: string
  }
  offers?: BandsintownOffer[]
  artist?: {
    image_url?: string
  }
}

function mapEvent(raw: BandsintownRaw, artistName: string): NormalizedEvent {
  const venue = raw.venue ?? {}
  return {
    provider: 'bandsintown',
    provider_event_id: String(raw.id),
    artist_name: artistName,
    venue_name: venue.name ?? '',
    venue_city: venue.city ?? '',
    venue_state: venue.region ?? '',
    event_date: raw.datetime ? new Date(raw.datetime).toISOString() : '',
    announce_date: raw.announced_date ? new Date(raw.announced_date).toISOString() : undefined,
    onsale_datetime: undefined,
    onsale_tba: false,
    ticketing_url: raw.offers?.[0]?.url ?? raw.url ?? '',
    genre: undefined,
    image_url: raw.artist?.image_url ?? undefined,
    price_range_min: undefined,
    price_range_max: undefined,
  }
}

export async function fetchBandsintownEvents(artist: string): Promise<NormalizedEvent[]> {
  const appId = process.env.BANDSINTOWN_APP_ID
  if (!appId) throw new Error('BANDSINTOWN_APP_ID is not set')

  const encodedArtist = encodeURIComponent(artist)
  const url = `${BASE_URL}/${encodedArtist}/events?app_id=${encodeURIComponent(appId)}&date=upcoming`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Bandsintown API error ${res.status} for artist "${artist}"`)
  }

  const data = (await res.json()) as BandsintownRaw[]

  if (!Array.isArray(data)) return []

  return data.map(raw => mapEvent(raw, artist))
}
