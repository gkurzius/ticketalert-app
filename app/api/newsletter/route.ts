import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getResend } from '@/lib/resend'
import { buildEmailHtml } from '@/components/EmailTemplate'
import type { Event } from '@/types'

type SubscriberWithLocation = {
  id: string
  email: string
  unsubscribe_token: string | null
  locations: {
    city: string
    display_name: string
  } | null
}

async function runNewsletter() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@ticketalert.co'

  const { data: freshEventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .gte('created_at', sevenDaysAgo)
    .order('event_date', { ascending: true })

  if (eventsError) {
    throw new Error(`Failed to fetch fresh events: ${eventsError.message}`)
  }

  const freshEvents: Event[] = freshEventsData ?? []

  const eventsByCity: Record<string, Event[]> = {}
  for (const event of freshEvents) {
    const city = event.venue_city
    if (!city) continue
    if (!eventsByCity[city]) eventsByCity[city] = []
    eventsByCity[city].push(event)
  }

  const { data: subscribersData, error: subscribersError } = await supabase
    .from('subscribers')
    .select('id, email, unsubscribe_token, locations(city, display_name)')
    .eq('confirmed', true)
    .is('unsubscribed_at', null)

  if (subscribersError) {
    throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`)
  }

  const subscribers: SubscriberWithLocation[] = (subscribersData ?? []) as unknown as SubscriberWithLocation[]

  let sent = 0
  let skipped = 0
  let failed = 0

  const resend = getResend()

  for (const subscriber of subscribers) {
    const location = subscriber.locations
    if (!location) {
      skipped++
      continue
    }

    const cityEvents = eventsByCity[location.city]
    if (!cityEvents || cityEvents.length === 0) {
      skipped++
      continue
    }

    if (!subscriber.unsubscribe_token) {
      skipped++
      continue
    }

    try {
      const html = buildEmailHtml({
        city: location.display_name,
        events: cityEvents,
        unsubscribeToken: subscriber.unsubscribe_token,
        siteUrl,
      })

      await resend.emails.send({
        from: fromEmail,
        to: subscriber.email,
        subject: `New concerts just announced in ${location.display_name}`,
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
