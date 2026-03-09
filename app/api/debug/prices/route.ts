import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: withPrice, error: e1 } = await supabase
    .from('events')
    .select('id, artist_name, venue_city, price_range_min, price_range_max')
    .not('price_range_min', 'is', null)
    .order('price_range_min', { ascending: false })
    .limit(20)

  const { data: total, error: e2 } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })

  const { data: hasPrice, error: e3 } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .not('price_range_min', 'is', null)

  const { data: above150, error: e4 } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .gt('price_range_min', 150)

  return NextResponse.json({
    total_events: (total as unknown as { count: number } | null)?.count ?? 'error',
    events_with_price: (hasPrice as unknown as { count: number } | null)?.count ?? 'error',
    events_above_150: (above150 as unknown as { count: number } | null)?.count ?? 'error',
    top_20_by_price: withPrice ?? [],
    errors: [e1?.message, e2?.message, e3?.message, e4?.message].filter(Boolean),
    type_sample: withPrice?.[0]
      ? {
          price_range_min_value: withPrice[0].price_range_min,
          price_range_min_typeof: typeof withPrice[0].price_range_min,
          parsed: parseFloat(String(withPrice[0].price_range_min)),
          above_150: parseFloat(String(withPrice[0].price_range_min)) > 150,
        }
      : null,
  })
}
