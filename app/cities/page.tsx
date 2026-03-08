import type { Metadata } from 'next'
import { CITIES } from '@/lib/cities'

export const metadata: Metadata = {
  title: 'Browse by City | TicketAlert',
  description:
    'Find new concerts announced in your city. TicketAlert covers 20 major cities across the US.',
}

export default function CitiesPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1
          className="font-display font-extrabold uppercase text-5xl sm:text-6xl mb-4 leading-none"
          style={{ color: '#ffffff' }}
        >
          Browse by <span style={{ color: '#FFE500' }}>City</span>
        </h1>
        <p
          className="font-body font-light text-lg max-w-2xl mx-auto"
          style={{ color: '#60A5FA' }}
        >
          TicketAlert covers 20 major cities across the US. Click your city to see new concerts just
          announced.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CITIES.map((city) => (
          <a
            key={city.slug}
            href={`/${city.slug}`}
            className="flex items-center justify-between rounded-xl border p-5 transition-colors group"
            style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
          >
            <div>
              <p
                className="font-display font-extrabold uppercase text-lg leading-tight"
                style={{ color: '#ffffff' }}
              >
                {city.city}
              </p>
              <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
                {city.state}
              </p>
            </div>
            <span
              className="font-body font-light text-lg transition-transform group-hover:translate-x-1"
              style={{ color: '#FFE500' }}
            >
              →
            </span>
          </a>
        ))}
      </div>

      <div className="text-center pt-8">
        <p className="font-body font-light text-sm mb-4" style={{ color: '#60A5FA' }}>
          Don&apos;t see your city? More cities coming soon.
        </p>
        <a
          href="/subscribe"
          className="inline-block font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
        >
          Get Alerts When We Add Your City
        </a>
      </div>
    </div>
  )
}
