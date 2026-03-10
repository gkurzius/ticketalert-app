import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import { isAuthorized } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { CITIES } from '@/lib/cities'

export const maxDuration = 60

const MAX_TWEETS_PER_DAY = 5
const TWEET_DELAY_MS = 2000

function getCitySlug(venueCity: string | null): string | null {
  if (!venueCity) return null
  const normalizedCity = venueCity.toLowerCase().trim()
  const match = CITIES.find(
    (c) =>
      c.city.toLowerCase() === normalizedCity ||
      c.slug === normalizedCity ||
      (normalizedCity === 'new york city' && c.slug === 'new-york')
  )
  return match?.slug ?? null
}

function formatOnSaleDateTime(dateStr: string | null): string {
  if (!dateStr) return 'soon'
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' })
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  })
  return `${day} at ${time} ET`
}

function buildTweetText(event: {
  artist_name: string | null
  venue_city: string | null
  onsale_datetime: string | null
  city_slug: string | null
}): string {
  const artist = event.artist_name ?? 'An artist'
  const citySlug = event.city_slug
  const onSale = formatOnSaleDateTime(event.onsale_datetime)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const cityUrl = citySlug ? `${siteUrl}/${citySlug}` : siteUrl

  const cityHashtag = event.venue_city
    ? event.venue_city.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
    : null

  let tweet = `${artist} just announced ${event.venue_city ?? 'a'} show 🔥\nTickets drop ${onSale} — don't sleep on this one\n→ ${cityUrl}`
  if (cityHashtag) {
    tweet += `\n#concerts #${cityHashtag}`
  } else {
    tweet += `\n#concerts`
  }

  return tweet
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runTwitterPost() {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return {
      error: 'Twitter API credentials not configured',
      tweeted: 0,
      skipped: 0,
      failed: 0,
    }
  }

  const twitterClient = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  })

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, artist_name, venue_city, venue_state, onsale_datetime, price_range_min, ticketing_url')
    .eq('twitter_posted', false)
    .not('onsale_datetime', 'is', null)
    .gte('onsale_datetime', now.toISOString())
    .lte('onsale_datetime', sevenDaysFromNow.toISOString())
    .order('price_range_min', { ascending: false })
    .limit(MAX_TWEETS_PER_DAY)

  if (eventsError) {
    console.error('[twitter-post] Failed to query events:', eventsError.message)
    return { error: eventsError.message, tweeted: 0, skipped: 0, failed: 0 }
  }

  if (!events || events.length === 0) {
    console.log('[twitter-post] No eligible events to tweet about')
    return { tweeted: 0, skipped: 0, failed: 0, message: 'No eligible events' }
  }

  let tweeted = 0
  let failed = 0

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const citySlug = getCitySlug(event.venue_city)

    const tweetText = buildTweetText({
      artist_name: event.artist_name,
      venue_city: event.venue_city,
      onsale_datetime: event.onsale_datetime,
      city_slug: citySlug,
    })

    try {
      const { data: tweet } = await twitterClient.v2.tweet(tweetText)
      console.log(`[twitter-post] Tweeted: ${tweet.id} — ${event.artist_name} in ${event.venue_city}`)

      const { error: updateError } = await supabase
        .from('events')
        .update({ twitter_posted: true })
        .eq('id', event.id)

      if (updateError) {
        console.error(`[twitter-post] Failed to mark event ${event.id} as posted:`, updateError.message)
      }

      tweeted++
    } catch (err) {
      console.error(`[twitter-post] Failed to tweet for event ${event.id} (${event.artist_name}):`, err)
      failed++
    }

    if (i < events.length - 1) {
      await sleep(TWEET_DELAY_MS)
    }
  }

  const message = `Twitter post complete: ${tweeted} tweeted, ${failed} failed`
  console.log(`[twitter-post] ${message}`)

  return { tweeted, failed, skipped: 0, message }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const result = await runTwitterPost()
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const result = await runTwitterPost()
  return NextResponse.json(result)
}
