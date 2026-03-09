import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getResend } from '@/lib/resend'
import { generateToken } from '@/lib/tokens'
import { CITIES } from '@/lib/cities'
import { buildWelcomeEmailHtml } from '@/components/EmailTemplate'

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

  const { data: location } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', cityEntry.slug)
    .single()

  const unsubscribe_token = generateToken()

  const { error: insertError } = await supabase.from('subscribers').insert({
    email: email.toLowerCase().trim(),
    location_id: location?.id ?? null,
    confirmed: true,
    confirm_token: generateToken(),
    unsubscribe_token,
    frequency: 'weekly',
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 409 })
    }
    console.error('[subscribe] Insert failed — code:', insertError.code, 'message:', insertError.message)
    return NextResponse.json({ error: `Subscriber insert failed: ${insertError.message}` }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@ticketalert.co'

  try {
    const html = buildWelcomeEmailHtml({
      city: cityEntry.city,
      citySlug: cityEntry.slug,
      unsubscribeToken: unsubscribe_token,
      siteUrl,
    })

    const resend = getResend()
    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: "You're in. 🎟️",
      html,
    })
  } catch (emailError) {
    console.error('[subscribe] Welcome email send error:', emailError)
  }

  return NextResponse.json({ success: true })
}
