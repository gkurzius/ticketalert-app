import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSlug } from '@/lib/slugify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email: string = (body.email ?? '').trim().toLowerCase()
    const artistName: string = (body.artist_name ?? '').trim()

    if (!email || !artistName) {
      return NextResponse.json({ error: 'email and artist_name are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const artistSlug = toSlug(artistName)

    const { error } = await supabase.from('artist_follows').upsert(
      { email, artist_name: artistName, artist_slug: artistSlug },
      { onConflict: 'email,artist_slug', ignoreDuplicates: true }
    )

    if (error) {
      console.error('[artist-follow] Supabase error:', error.message)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[artist-follow] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
