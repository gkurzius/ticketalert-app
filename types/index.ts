export type Location = {
  id: string
  city: string
  state: string
  display_name: string
  slug: string
  created_at: string
}

export type Event = {
  id: string
  provider: string
  provider_event_id: string
  artist_name: string | null
  venue_name: string | null
  venue_city: string | null
  venue_state: string | null
  event_date: string | null
  announce_date: string | null
  onsale_datetime: string | null
  onsale_tba: boolean
  ticketing_url: string | null
  genre: string | null
  image_url: string | null
  price_range_min: number | null
  price_range_max: number | null
  created_at: string
}

export type Subscriber = {
  id: string
  email: string
  location_id: string | null
  confirmed: boolean
  confirm_token: string | null
  unsubscribe_token: string | null
  unsubscribed_at: string | null
  frequency: string
  created_at: string
}

export type Meta = {
  key: string
  value: string | null
  updated_at: string
}
