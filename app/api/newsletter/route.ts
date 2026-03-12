import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getResend } from '@/lib/resend'
import { buildEmailHtml } from '@/components/EmailTemplate'
import { CITIES } from '@/lib/cities'
import type { Event } from '@/types'

type LocationObj = {
  city: string
  display_name: string
  slug: string
}

type SubscriberRow = {
  id: string
  email: string
  unsubscribe_token: string | null
  locations: LocationObj | LocationObj[] | null
}

async function runNewsletter() {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const nowIso = now.toISOString()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@ticketalert.co'

  const [onSaleResult, upcomingResult, subscribersResult] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .gte('onsale_datetime', nowIso)
      .lte('onsale_datetime', sevenDaysFromNow)
      .gte('event_date', nowIso)
      .order('onsale_datetime', { ascending: true }),

    supabase
      .from('events')
      .select('*')
      .gte('event_date', nowIso)
      .order('event_date', { ascending: true }),

    supabase
      .from('subscribers')
      .select('id, email, unsubscribe_token, locations(city, display_name, slug)')
      .eq('confirmed', true)
      .is('unsubscribed_at', null),
  ])

  if (onSaleResult.error) {
    throw new Error(`Failed to fetch on-sale events: ${onSaleResult.error.message}`)
  }
  if (upcomingResult.error) {
    throw new Error(`Failed to fetch upcoming events: ${upcomingResult.error.message}`)
  }
  if (subscribersResult.error) {
    throw new Error(`Failed to fetch subscribers: ${subscribersResult.error.message}`)
  }

  const onSaleEvents: Event[] = onSaleResult.data ?? []
  const upcomingEvents: Event[] = upcomingResult.data ?? []

  const onSaleByCity: Record<string, Event[]> = {}
  for (const event of onSaleEvents) {
    const city = event.venue_city
    if (!city) continue
    if (!onSaleByCity[city]) onSaleByCity[city] = []
    onSaleByCity[city].push(event)
  }

  const upcomingByCity: Record<string, Event[]> = {}
  for (const event of upcomingEvents) {
    const city = event.venue_city
    if (!city) continue
    if (!upcomingByCity[city]) upcomingByCity[city] = []
    upcomingByCity[city].push(event)
  }

  const subscribers: SubscriberRow[] = (subscribersResult.data ?? []) as unknown as SubscriberRow[]

  let sent = 0
  let skipped = 0
  let failed = 0

  const resend = getResend()

  for (const subscriber of subscribers) {
    const rawLocation = subscriber.locations
    const location: LocationObj | null = Array.isArray(rawLocation)
      ? (rawLocation[0] ?? null)
      : rawLocation
    if (!location) {
      skipped++
      continue
    }

    if (!subscriber.unsubscribe_token) {
      skipped++
      continue
    }

    const cityName = location.city
    const cityDisplayName = location.display_name
    const citySlugEntry = CITIES.find(c => c.city === cityName || c.display_name === cityDisplayName)
    const citySlug = citySlugEntry?.slug ?? location.slug ?? cityName.toLowerCase().replace(/\s+/g, '-')

    const cityOnSale = onSaleByCity[cityName] ?? []
    const cityUpcoming = upcomingByCity[cityName] ?? []

    if (cityOnSale.length === 0 && cityUpcoming.length === 0) {
      skipped++
      continue
    }

    try {
      const html = buildEmailHtml({
        city: cityDisplayName,
        citySlug,
        onSaleEvents: cityOnSale,
        upcomingEvents: cityUpcoming.slice(0, 10),
        unsubscribeToken: subscriber.unsubscribe_token,
        siteUrl,
      })

      await resend.emails.send({
        from: fromEmail,
        to: subscriber.email,
        subject: `Your weekly concert drop — ${cityDisplayName}`,
        html,
      })

      sent++
    } catch (err) {
      console.error(`[newsletter] Failed to send to ${subscriber.email}:`, err)
      failed++
    }
  }

  const summary = `Newsletter complete: ${sent} sent, ${skipped} skipped (no events), ${failed} failed`
  console.log(`[newsletter] ${summary}`)
  return { sent, skipped, failed }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  try {
    const result = await runNewsletter()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[newsletter] Fatal error:', err)
    return NextResponse.json({ error: 'Newsletter failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  try {
    const result = await runNewsletter()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[newsletter] Fatal error:', err)
    return NextResponse.json({ error: 'Newsletter failed' }, { status: 500 })
  }
}
