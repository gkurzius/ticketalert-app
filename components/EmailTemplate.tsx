import type { Event } from '@/types'

interface EmailTemplateProps {
  city: string
  events: Event[]
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

function buildEventRow(event: Event, siteUrl: string): string {
  const eventUrl = `${siteUrl}/events/${event.id}`
  const ticketUrl = event.ticketing_url ?? eventUrl
  const dateStr = formatEventDate(event.event_date)
  const venue = [event.venue_name, event.venue_city, event.venue_state].filter(Boolean).join(', ')
  const price = event.price_range_min ? `From $${Math.round(event.price_range_min)}` : ''

  return `
    <tr>
      <td style="padding:20px 0;border-bottom:1px solid #1e3a5f;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
                <tr>
                  <td style="background-color:#FFE500;padding:2px 8px;border-radius:4px;">
                    <span style="color:#0a0a0a;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">New Drop</span>
                  </td>
                  ${event.genre ? `<td style="padding-left:8px;">
                    <span style="color:#60A5FA;font-size:11px;font-weight:300;text-transform:uppercase;letter-spacing:0.08em;">${event.genre}</span>
                  </td>` : ''}
                </tr>
              </table>
              <div style="color:#ffffff;font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:4px;">
                ${event.artist_name ?? 'Unknown Artist'}
              </div>
              <div style="color:#60A5FA;font-size:14px;font-weight:300;margin-bottom:4px;">${venue}</div>
              <div style="color:#94a3b8;font-size:13px;font-weight:300;margin-bottom:${price ? '4px' : '12px'}">${dateStr}</div>
              ${price ? `<div style="color:#FFE500;font-size:13px;font-weight:400;margin-bottom:12px;">${price}</div>` : ''}
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background-color:#3B82F6;">
                    <a href="${ticketUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 20px;color:#ffffff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">
                      Get Tickets &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

export function buildEmailHtml({ city, events, unsubscribeToken, siteUrl }: EmailTemplateProps): string {
  const year = new Date().getFullYear()
  const unsubscribeUrl = `${siteUrl}/unsubscribe/${unsubscribeToken}`
  const eventRows = events.map(e => buildEventRow(e, siteUrl)).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New concerts just announced in ${city}</title>
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

          <!-- Headline -->
          <tr>
            <td style="padding:32px 32px 0;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
              <h1 style="color:#ffffff;font-size:26px;font-weight:800;text-transform:uppercase;margin:0 0 8px;letter-spacing:0.03em;line-height:1.2;">
                New concerts just announced in ${city} this week
              </h1>
              <p style="color:#60A5FA;font-size:15px;font-weight:300;margin:0 0 8px;line-height:1.6;">
                Never be the last to know — here are the latest shows just added for your city.
              </p>
            </td>
          </tr>

          <!-- Events -->
          <tr>
            <td style="padding:0 32px 24px;background-color:#0f1829;border-left:1px solid #1e3a5f;border-right:1px solid #1e3a5f;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${eventRows}
              </table>
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
