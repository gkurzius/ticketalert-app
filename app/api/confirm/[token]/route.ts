import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getResend } from '@/lib/resend'
import { buildWelcomeEmailHtml } from '@/components/EmailTemplate'
import { CITIES } from '@/lib/cities'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const { data: subscriber, error: findError } = await supabase
    .from('subscribers')
    .select('id, email, confirmed, unsubscribe_token, city')
    .eq('confirm_token', token)
    .single()

  if (findError || !subscriber) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  if (subscriber.confirmed) {
    return NextResponse.json({ success: true, already_confirmed: true })
  }

  const { error: updateError } = await supabase
    .from('subscribers')
    .update({ confirmed: true })
    .eq('id', subscriber.id)

  if (updateError) {
    console.error('[confirm] Update error:', updateError.message)
    return NextResponse.json({ error: 'Failed to confirm subscription' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'alerts@ticketalert.co'

  try {
    const cityName = subscriber.city ?? 'your city'
    const citySlug = CITIES.find((c) => c.city === cityName)?.slug ?? CITIES[0].slug

    const html = buildWelcomeEmailHtml({
      city: cityName,
      citySlug,
      unsubscribeToken: subscriber.unsubscribe_token ?? '',
      siteUrl,
    })

    const resend = getResend()
    await resend.emails.send({
      from: fromEmail,
      to: subscriber.email,
      subject: "You're in. 🎟️",
      html,
    })
  } catch (emailError) {
    console.error('[confirm] Welcome email failed:', emailError)
  }

  return NextResponse.json({ success: true })
}
