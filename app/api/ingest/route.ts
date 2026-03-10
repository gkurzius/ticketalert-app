import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/auth'
import { CITIES } from '@/lib/cities'
import { supabase } from '@/lib/supabase'
import { getResend } from '@/lib/resend'
import { fetchTicketmasterEvents } from '@/lib/providers/ticketmaster'
import { toSlug } from '@/lib/slugify'
import type { NormalizedEvent } from '@/lib/providers/normalize'

export const maxDuration = 60

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBA'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatEventTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const logoSvg = `<svg width="44" height="36" viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="6" width="42" height="24" rx="3" fill="#FFE500"/>
  <path d="M13 6 L13 30" stroke="#0B1120" stroke-width="2" stroke-dasharray="3 3"/>
  <path d="M31 6 L31 30" stroke="#0B1120" stroke-width="2" stroke-dasharray="3 3"/>
  <circle cx="22" cy="18" r="9" fill="#0B1120"/>
  <circle cx="22" cy="18" r="7" fill="#0f1829" stroke="#FFE500" stroke-width="1"/>
  <line x1="22" y1="18" x2="22" y2="13" stroke="#FFE500" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="22" y1="18" x2="26" y2="18" stroke="#FFE500" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="22" cy="18" r="1" fill="#FFE500"/>
  <path d="M18 2 L18 6" stroke="#FFE500" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M26 2 L26 6" stroke="#FFE500" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M18 30 L18 34" stroke="#FFE500" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M26 30 L26 34" stroke="#FFE500" stroke-width="2.5" stroke-linecap="round"/>
</svg>`

function buildNotificationHeader(): string {
  return `
    <tr>
      <td style="padding:32px 32px 24px;background-color:#0B1120;border-bottom:1px solid #1e3a5f;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:12px;vertical-align:middle;">${logoSvg}</td>
            <td style="vertical-align:middle;">
              <div style="font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;line-height:1;">
                <span style="color:#ffffff;">Ticket</span><span style="color:#FFE500;">Alert</span>
              </div>
              <div style="color:#60A5FA;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:4px;font-weight:300;">Never miss a drop</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

function buildArtistNotificationHtml(artistName: string, event: { artist_name: string | null; venue_name: string | null; venue_city: string | null; venue_state: string | null; event_date: string | null; onsale_datetime: string | null; ticketing_url: string | null; price_range_min: number | null }, siteUrl: string): string {
  const venue = [event.venue_name, event.venue_city, event.venue_state].filter(Boolean).join(', ')
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>${artistName} just announced a show 🎟️</title></head>
<body style="margin:0;padding:0;background-color:#0B1120;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        ${buildNotificationHeader()}
        <tr>
          <td style="padding:32px 32px 0;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
            <h1 style="color:#ffffff;font-size:26px;font-weight:800;text-transform:uppercase;margin:0 0 8px;letter-spacing:0.03em;line-height:1.2;">
              ${artistName} just announced a show 🎟️
            </h1>
            <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 24px;line-height:1.7;">
              You asked us to let you know — here's the drop.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e3a5f;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:20px;">
                  <div style="color:#FFE500;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">New Show</div>
                  <div style="color:#ffffff;font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:6px;">${artistName}</div>
                  <div style="color:#60A5FA;font-size:14px;font-weight:300;margin-bottom:4px;">${venue}</div>
                  <div style="color:#94a3b8;font-size:13px;font-weight:300;margin-bottom:${event.onsale_datetime ? '4px' : '12px'}">${formatEventDate(event.event_date)}</div>
                  ${event.onsale_datetime ? `<div style="color:#FFE500;font-size:13px;font-weight:400;margin-bottom:12px;">On Sale ${formatEventDate(event.onsale_datetime)} at ${formatEventTime(event.onsale_datetime)}</div>` : ''}
                  ${event.price_range_min ? `<div style="color:#FFE500;font-size:13px;font-weight:400;margin-bottom:12px;">From $${Math.round(event.price_range_min)}</div>` : ''}
                  ${event.ticketing_url ? `<table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#FFE500;"><a href="${event.ticketing_url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 20px;color:#0a0a0a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">Get Tickets &rarr;</a></td></tr></table>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
            <p style="color:#60A5FA;font-size:13px;font-weight:300;margin:0;line-height:1.7;">
              See all upcoming shows at <a href="${siteUrl}" style="color:#FFE500;text-decoration:underline;">ticketalert.co</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;background-color:#0B1120;border:1px solid #1e3a5f;">
            <p style="color:#60A5FA;font-size:12px;font-weight:300;margin:0;text-align:center;">
              &copy; ${year} TicketAlert &mdash; Never miss a drop.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildVenueNotificationHtml(venueName: string, event: { artist_name: string | null; venue_name: string | null; venue_city: string | null; venue_state: string | null; event_date: string | null; onsale_datetime: string | null; ticketing_url: string | null; price_range_min: number | null }, siteUrl: string): string {
  const location = [event.venue_city, event.venue_state].filter(Boolean).join(', ')
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>New show announced at ${venueName} 🎟️</title></head>
<body style="margin:0;padding:0;background-color:#0B1120;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        ${buildNotificationHeader()}
        <tr>
          <td style="padding:32px 32px 0;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
            <h1 style="color:#ffffff;font-size:26px;font-weight:800;text-transform:uppercase;margin:0 0 8px;letter-spacing:0.03em;line-height:1.2;">
              New show announced at ${venueName} 🎟️
            </h1>
            <p style="color:#60A5FA;font-size:14px;font-weight:300;margin:0 0 24px;line-height:1.7;">${location}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e3a5f;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:20px;">
                  <div style="color:#FFE500;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">New Show</div>
                  <div style="color:#ffffff;font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:6px;">${event.artist_name ?? 'TBA'}</div>
                  <div style="color:#60A5FA;font-size:14px;font-weight:300;margin-bottom:4px;">${venueName}</div>
                  <div style="color:#94a3b8;font-size:13px;font-weight:300;margin-bottom:${event.onsale_datetime ? '4px' : '12px'}">${formatEventDate(event.event_date)}</div>
                  ${event.onsale_datetime ? `<div style="color:#FFE500;font-size:13px;font-weight:400;margin-bottom:12px;">On Sale ${formatEventDate(event.onsale_datetime)} at ${formatEventTime(event.onsale_datetime)}</div>` : ''}
                  ${event.price_range_min ? `<div style="color:#FFE500;font-size:13px;font-weight:400;margin-bottom:12px;">From $${Math.round(event.price_range_min)}</div>` : ''}
                  ${event.ticketing_url ? `<table cellpadding="0" cellspacing="0"><tr><td style="border-radius:6px;background-color:#FFE500;"><a href="${event.ticketing_url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 20px;color:#0a0a0a;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">Get Tickets &rarr;</a></td></tr></table>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
            <p style="color:#60A5FA;font-size:13px;font-weight:300;margin:0;line-height:1.7;">
              See all upcoming shows at <a href="${siteUrl}" style="color:#FFE500;text-decoration:underline;">ticketalert.co</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;background-color:#0B1120;border:1px solid #1e3a5f;">
            <p style="color:#60A5FA;font-size:12px;font-weight:300;margin:0;text-align:center;">
              &copy; ${year} TicketAlert &mdash; Never miss a drop.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

interface NewEventRecord {
  id: string
  artist_name: string | null
  venue_name: string | null
  venue_city: string | null
  venue_state: string | null
  event_date: string | null
  onsale_datetime: string | null
  ticketing_url: string | null
  price_range_min: number | null
}

async function sendFollowNotifications(newEvents: NewEventRecord[]) {
  if (newEvents.length === 0) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@ticketalert.co'

  let resend: ReturnType<typeof getResend>
  try {
    resend = getResend()
  } catch {
    console.warn('[ingest] Resend not configured — skipping follow notifications')
    return
  }

  const { data: artistFollows } = await supabase.from('artist_follows').select('*')
  const { data: venueFollows } = await supabase.from('venue_follows').select('*')

  if (!artistFollows && !venueFollows) return

  const artistFollowsBySlug: Record<string, string[]> = {}
  for (const f of artistFollows ?? []) {
    if (!artistFollowsBySlug[f.artist_slug]) artistFollowsBySlug[f.artist_slug] = []
    artistFollowsBySlug[f.artist_slug].push(f.email)
  }

  const venueFollowsBySlug: Record<string, string[]> = {}
  for (const f of venueFollows ?? []) {
    if (!venueFollowsBySlug[f.venue_slug]) venueFollowsBySlug[f.venue_slug] = []
    venueFollowsBySlug[f.venue_slug].push(f.email)
  }

  for (const event of newEvents) {
    if (event.artist_name) {
      const artistSlug = toSlug(event.artist_name)
      const emails = artistFollowsBySlug[artistSlug] ?? []
      for (const email of emails) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: `${event.artist_name} just announced a show 🎟️`,
            html: buildArtistNotificationHtml(event.artist_name, event, siteUrl),
          })
        } catch (err) {
          console.error(`[ingest] Failed to send artist notification to ${email}:`, err)
        }
      }
    }

    if (event.venue_name) {
      const venueSlug = toSlug(event.venue_name)
      const emails = venueFollowsBySlug[venueSlug] ?? []
      for (const email of emails) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: `New show announced at ${event.venue_name} 🎟️`,
            html: buildVenueNotificationHtml(event.venue_name, event, siteUrl),
          })
        } catch (err) {
          console.error(`[ingest] Failed to send venue notification to ${email}:`, err)
        }
      }
    }
  }
}

async function runIngest() {
  let totalAdded = 0
  let totalUpdated = 0
  let citiesFailed = 0
  const citiesProcessed: string[] = []
  const newEvents: NewEventRecord[] = []

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
          .select('id, created_at, artist_name, venue_name, venue_city, venue_state, event_date, onsale_datetime, ticketing_url, price_range_min')
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
            newEvents.push({
              id: data.id,
              artist_name: data.artist_name,
              venue_name: data.venue_name,
              venue_city: data.venue_city,
              venue_state: data.venue_state,
              event_date: data.event_date,
              onsale_datetime: data.onsale_datetime,
              ticketing_url: data.ticketing_url,
              price_range_min: data.price_range_min,
            })
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

  try {
    await sendFollowNotifications(newEvents)
  } catch (err) {
    console.error('[ingest] Error sending follow notifications:', err)
  }

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
