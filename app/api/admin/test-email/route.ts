import { NextRequest, NextResponse } from 'next/server'
import { verifyBasicAuth } from '@/lib/auth'
import { getResend } from '@/lib/resend'
import { buildEmailHtml } from '@/components/EmailTemplate'

const SAMPLE_EVENTS = [
  {
    id: 'test-1',
    provider: 'seatgeek',
    provider_event_id: 'test-1',
    artist_name: 'Sample Artist',
    venue_name: 'Test Venue',
    venue_city: 'Boston',
    venue_state: 'MA',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    announce_date: null,
    onsale_datetime: null,
    onsale_tba: false,
    ticketing_url: 'https://seatgeek.com',
    genre: 'Rock',
    image_url: null,
    price_range_min: 35,
    price_range_max: 120,
    twitter_posted: false,
    created_at: new Date().toISOString(),
  },
]

export async function POST(req: NextRequest) {
  if (!verifyBasicAuth(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    return NextResponse.json({ error: 'ADMIN_EMAIL not configured' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@ticketalert.co'

  try {
    const resend = getResend()
    const html = buildEmailHtml({
      city: 'Boston, MA',
      events: SAMPLE_EVENTS,
      unsubscribeToken: 'test-unsubscribe-token',
      siteUrl,
    })

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: '[TEST] New concerts just announced in Boston, MA',
      html,
    })

    return NextResponse.json({ ok: true, sent_to: adminEmail })
  } catch (err) {
    console.error('[admin/test-email] Failed:', err)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}
