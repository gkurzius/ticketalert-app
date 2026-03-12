import type { Event } from '@/types'

interface EmailTemplateProps {
  city: string
  citySlug: string
  onSaleEvents: Event[]
  upcomingEvents: Event[]
  unsubscribeToken: string
  siteUrl: string
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBA'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatOnSaleDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const dayPart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
  const timePart = date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    })
    .toLowerCase()
    .replace(':00', '')
  return `${dayPart} at ${timePart} ET`
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

function buildEventListRow(event: Event, siteUrl: string, showOnSaleDate: boolean): string {
  const eventUrl = `${siteUrl}/events/${event.id}`
  const ticketUrl = event.ticketing_url ?? eventUrl
  const dateStr = formatEventDate(event.event_date)
  const venue = [event.venue_name, event.venue_city, event.venue_state].filter(Boolean).join(', ')
  const onSaleLine =
    showOnSaleDate && event.onsale_datetime
      ? `<div style="color:#94a3b8;font-size:12px;font-weight:300;margin-bottom:10px;">On Sale ${formatOnSaleDate(event.onsale_datetime)}</div>`
      : ''

  return `
    <tr>
      <td style="padding:20px 0;border-bottom:1px solid #1e3a5f;">
        <div style="color:#ffffff;font-size:18px;font-weight:700;margin-bottom:4px;line-height:1.2;">${event.artist_name ?? 'Unknown Artist'}</div>
        <div style="color:#94a3b8;font-size:13px;font-weight:300;margin-bottom:10px;">${venue} &mdash; ${dateStr}</div>
        ${onSaleLine}
        <a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" style="color:#FFE500;font-size:13px;font-weight:500;text-decoration:none;">Get Tickets &rarr;</a>
      </td>
    </tr>
  `
}

function buildSection(
  label: string,
  events: Event[],
  seeAllUrl: string,
  seeAllLabel: string,
  siteUrl: string,
  showOnSaleDate: boolean,
): string {
  if (events.length === 0) return ''
  const rows = events.map(e => buildEventListRow(e, siteUrl, showOnSaleDate)).join('')
  return `
    <tr>
      <td style="padding:32px 0 0;">
        <div style="color:#FFE500;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">${label}</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
        <div style="padding-top:16px;">
          <a href="${seeAllUrl}" target="_blank" rel="noopener noreferrer" style="color:#60A5FA;font-size:13px;font-weight:400;text-decoration:none;">${seeAllLabel} &rarr;</a>
        </div>
      </td>
    </tr>
  `
}

interface WelcomeEmailProps {
  city: string
  citySlug: string
  unsubscribeToken: string
  siteUrl: string
}

export function buildWelcomeEmailHtml({ city, citySlug, unsubscribeToken, siteUrl }: WelcomeEmailProps): string {
  const year = new Date().getFullYear()
  const unsubscribeUrl = `${siteUrl}/unsubscribe/${unsubscribeToken}`
  const cityUrl = `${siteUrl}/${citySlug}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're in. 🎟️</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td style="padding:32px 32px 24px;background-color:#0B1120;border-bottom:1px solid #1e3a5f;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    ${logoSvg}
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;line-height:1;">
                      <span style="color:#ffffff;">Ticket</span><span style="color:#FFE500;">Alert</span>
                    </div>
                    <div style="color:#60A5FA;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:4px;font-weight:300;">Never miss a drop</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 0;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
              <h1 style="color:#ffffff;font-size:26px;font-weight:800;text-transform:uppercase;margin:0 0 24px;letter-spacing:0.03em;line-height:1.2;">
                You're in. 🎟️
              </h1>
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 16px;line-height:1.7;">
                Hey,
              </p>
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 16px;line-height:1.7;">
                You're on the list. From now on you'll be the first to know when tickets drop for concerts in ${city}.
              </p>
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 8px;line-height:1.7;">
                Here's what you'll get every Thursday morning:
              </p>
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 8px;line-height:1.7;">
                🆕 <strong style="color:#ffffff;">New on-sales</strong> — concerts just announced and going on sale soon in your city, so you can buy before they sell out
              </p>
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 24px;line-height:1.7;">
                🎵 <strong style="color:#ffffff;">Coming up this week</strong> — shows happening soon in case something catches your eye last minute
              </p>
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 32px;line-height:1.7;">
                Every week we scan the internet for new events going on-sale in your city. You get the drop before everyone else.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 32px;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background-color:#FFE500;">
                    <a href="${cityUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;color:#0a0a0a;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;text-decoration:none;">
                      View Concerts in ${city} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:0 32px 32px;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 8px;line-height:1.7;">
                No spam. No filler. No BS. Never miss a drop again.
              </p>
              <p style="color:#94a3b8;font-size:15px;font-weight:300;margin:0 0 8px;line-height:1.7;">
                Talk soon,<br />
                <strong style="color:#ffffff;">Griffin</strong><br />
                <span style="color:#60A5FA;">Founder @ TicketAlert</span>
              </p>
              <p style="color:#60A5FA;font-size:13px;font-weight:300;margin:24px 0 0;line-height:1.7;border-top:1px solid #1e3a5f;padding-top:16px;">
                P.S. Already 1,000+ music fans across the country never miss a drop. Forward this to a friend who needs it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#0B1120;border:1px solid #1e3a5f;border-top:1px solid #1e3a5f;">
              <p style="color:#60A5FA;font-size:12px;font-weight:300;margin:0 0 8px;text-align:center;line-height:1.6;">
                You're receiving this because you subscribed to TicketAlert alerts for ${city}.
              </p>
              <p style="color:#60A5FA;font-size:12px;font-weight:300;margin:0;text-align:center;">
                <a href="${unsubscribeUrl}" style="color:#60A5FA;text-decoration:underline;">Unsubscribe</a>
                &nbsp;&mdash;&nbsp;
                &copy; ${year} TicketAlert
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildEmailHtml({ city, citySlug, onSaleEvents, upcomingEvents, unsubscribeToken, siteUrl }: EmailTemplateProps): string {
  const year = new Date().getFullYear()
  const unsubscribeUrl = `${siteUrl}/unsubscribe/${unsubscribeToken}`
  const cityPageUrl = `${siteUrl}/${citySlug}`

  const onSaleSection = buildSection(
    '🎟️ ON SALE THIS WEEK',
    onSaleEvents,
    cityPageUrl,
    'See all on-sales',
    siteUrl,
    true,
  )
  const upcomingSection = buildSection(
    '🎵 UPCOMING SHOWS',
    upcomingEvents,
    cityPageUrl,
    'See all shows',
    siteUrl,
    false,
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your weekly concert drop — ${city}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td style="padding:32px 32px 20px;background-color:#0B1120;text-align:center;border-bottom:1px solid #1e3a5f;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    ${logoSvg}
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;line-height:1;">
                      <span style="color:#ffffff;">Ticket</span><span style="color:#FFE500;">Alert</span>
                    </div>
                    <div style="color:#60A5FA;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:4px;font-weight:300;">Never miss a drop</div>
                  </td>
                </tr>
              </table>
              <div style="color:#94a3b8;font-size:12px;font-weight:300;letter-spacing:0.05em;margin-top:12px;">Your weekly concert drop &mdash; ${city}</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 32px 32px;background-color:#0B1120;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${onSaleSection}
                ${upcomingSection}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#0B1120;border:1px solid #1e3a5f;border-top:1px solid #1e3a5f;text-align:center;">
              <p style="color:#ffffff;font-size:13px;font-weight:300;margin:0 0 12px;line-height:1.6;">
                Never miss a drop again.
              </p>
              <p style="color:#64748b;font-size:12px;font-weight:300;margin:0;line-height:1.6;">
                You're receiving this because you subscribed to TicketAlert alerts for ${city}.<br />
                <a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
                &nbsp;&mdash;&nbsp;
                &copy; ${year} TicketAlert
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
