import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? 'placeholder'
    _client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  },
})
