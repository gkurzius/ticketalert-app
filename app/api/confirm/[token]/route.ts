import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    .select('id, confirmed')
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

  return NextResponse.json({ success: true })
}
