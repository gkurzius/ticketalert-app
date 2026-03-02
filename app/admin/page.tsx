import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import AdminActions from './AdminActions'

function parseBasicAuth(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Basic ')) return null
  try {
    const b64 = authHeader.replace('Basic ', '')
    const decoded = atob(b64)
    const [, password] = decoded.split(':')
    return password ?? null
  } catch {
    return null
  }
}

function buildBasicAuthHeader(authHeader: string): string {
  return authHeader
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  const password = parseBasicAuth(authHeader)
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || password !== adminPassword) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="TicketAlert Admin"' },
    }) as unknown as React.ReactElement
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalSubscribers },
    { count: confirmedSubscribers },
    { count: unsubscribedCount },
    { count: totalEvents },
    { count: recentEvents },
    { data: metaData },
  ] = await Promise.all([
    supabase.from('subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('confirmed', true).is('unsubscribed_at', null),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).not('unsubscribed_at', 'is', null),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('meta').select('value').eq('key', 'last_ingest').single(),
  ])

  const lastIngest: string | null = (metaData as { value: string | null } | null)?.value ?? null

  const stats = [
    { label: 'Total Subscribers', value: totalSubscribers ?? 0 },
    { label: 'Confirmed Subscribers', value: confirmedSubscribers ?? 0 },
    { label: 'Unsubscribed', value: unsubscribedCount ?? 0 },
    { label: 'Total Events', value: totalEvents ?? 0 },
    { label: 'Events (Last 7 Days)', value: recentEvents ?? 0 },
  ]

  const lastIngestDisplay = lastIngest
    ? new Date(lastIngest).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }) + ' UTC'
    : 'Never'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1120' }}>
      <header className="border-b" style={{ borderColor: '#1e3a5f', backgroundColor: '#0B1120' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />
          <span
            className="font-display text-sm font-extrabold uppercase tracking-widest px-3 py-1 rounded"
            style={{ backgroundColor: '#1e3a5f', color: '#FFE500' }}
          >
            Admin
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div>
          <h1
            className="font-display text-4xl font-extrabold uppercase tracking-wide mb-1"
            style={{ color: '#ffffff' }}
          >
            Dashboard
          </h1>
          <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
            Last ingest: {lastIngestDisplay}
          </p>
        </div>

        <section>
          <h2
            className="font-display text-2xl font-extrabold uppercase tracking-wide mb-4"
            style={{ color: '#FFE500' }}
          >
            Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-5 text-center"
                style={{ backgroundColor: '#0f1829', border: '1px solid #1e3a5f' }}
              >
                <div
                  className="font-display text-4xl font-extrabold"
                  style={{ color: '#FFE500' }}
                >
                  {stat.value.toLocaleString()}
                </div>
                <div
                  className="font-body font-light text-xs uppercase tracking-wider mt-1"
                  style={{ color: '#60A5FA' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2
            className="font-display text-2xl font-extrabold uppercase tracking-wide mb-4"
            style={{ color: '#FFE500' }}
          >
            Actions
          </h2>
          <AdminActions basicAuthHeader={authHeader ?? ''} />
        </section>
      </main>
    </div>
  )
}
