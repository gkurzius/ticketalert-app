export type NormalizedEvent = {
  provider: string
  provider_event_id: string
  artist_name: string
  venue_name: string
  venue_city: string
  venue_state: string
  event_date: string
  announce_date?: string
  onsale_datetime?: string
  onsale_tba: boolean
  ticketing_url: string
  genre?: string
  image_url?: string
  price_range_min?: number
  price_range_max?: number
}
