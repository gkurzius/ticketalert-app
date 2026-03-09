import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getResend } from '@/lib/resend'
import { generateToken } from '@/lib/tokens'
import { CITIES } from '@/lib/cities'

export async function POST(req: NextRequest) {
  let body: { email?: string; citySlug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, citySlug } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (!citySlug || typeof citySlug !== 'string') {
    return NextResponse.json({ error: 'City is required' }, { status: 400 })
  }

  const normalizedSlug = citySlug.trim().toLowerCase()
  const cityEntry =
    CITIES.find((c) => c.slug === normalizedSlug) ??
    CITIES.find((c) => c.display_name.toLowerCase() === normalizedSlug) ??
    CITIES.find((c) => c.city.toLowerCase() === normalizedSlug)

  if (!cityEntry) {
    console.error('[subscribe] Unknown citySlug received:', JSON.stringify(citySlug))
    return NextResponse.json({ error: 'Invalid city selection' }, { status: 400 })
  }

  const confirm_token = generateToken()
  const unsubscribe_token = generateToken()

  const { error: insertError } = await supabase.from('subscribers').insert({
    email: email.toLowerCase().trim(),
    city: cityEntry.city,
    state: cityEntry.state,
    confirmed: false,
    confirm_token,
    unsubscribe_token,
    frequency: 'weekly',
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 409 })
    }
    console.error('[subscribe] Subscriber insert failed — code:', insertError.code, 'message:', insertError.message, 'details:', insertError.details, 'hint:', insertError.hint)
    return NextResponse.json({ error: `Subscriber insert failed: ${insertError.message}` }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const confirmUrl = `${siteUrl}/confirm/${confirm_token}`
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@ticketalert.co'

  try {
    const resend = getResend()
    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: `Confirm your TicketAlert subscription for ${cityEntry.display_name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background-color:#0B1120;font-family:sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                    <tr>
                      <td style="padding:32px 32px 24px;background-color:#0B1120;border-bottom:1px solid #1e3a5f;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-right:12px;vertical-align:middle;">
                              <svg width="44" height="36" viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                              </svg>
                            </td>
                            <td style="vertical-align:middle;">
                              <span style="font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;line-height:1;">
                                <span style="color:#ffffff;">Ticket</span><span style="color:#FFE500;">Alert</span>
                              </span>
                              <div style="color:#60A5FA;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:4px;">Never miss a drop</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 32px;background-color:#0f1829;border:1px solid #1e3a5f;border-top:none;">
                        <h1 style="color:#ffffff;font-size:28px;font-weight:800;text-transform:uppercase;margin:0 0 16px;letter-spacing:0.05em;">
                          Confirm your subscription
                        </h1>
                        <p style="color:#60A5FA;font-size:16px;font-weight:300;margin:0 0 24px;line-height:1.6;">
                          You signed up for new concert alerts in <strong style="color:#FFE500;">${cityEntry.display_name}</strong>. Click the button below to confirm your email address.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                          <tr>
                            <td style="border-radius:8px;background-color:#FFE500;">
                              <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;color:#0a0a0a;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">
                                Confirm My Subscription
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="color:#60A5FA;font-size:13px;font-weight:300;margin:0;line-height:1.6;">
                          If you didn't sign up for TicketAlert, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:24px 32px;background-color:#0B1120;border-top:1px solid #1e3a5f;">
                        <p style="color:#60A5FA;font-size:12px;font-weight:300;margin:0;text-align:center;">
                          &copy; ${new Date().getFullYear()} TicketAlert &mdash; Never miss a drop.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
  } catch (emailError) {
    console.error('[subscribe] Email send error:', emailError)
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
