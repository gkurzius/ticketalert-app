import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | TicketAlert',
  description:
    'Learn about TicketAlert — the concert announcement platform that never lets you miss a show.',
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-12">
      <section>
        <h1
          className="font-display font-extrabold uppercase text-5xl mb-4 leading-none"
          style={{ color: '#ffffff' }}
        >
          About <span style={{ color: '#FFE500' }}>TicketAlert</span>
        </h1>
      </section>

      <section className="space-y-10">
        <div>
          <h2
            className="font-display font-extrabold uppercase text-2xl mb-3"
            style={{ color: '#FFE500' }}
          >
            The Problem
          </h2>
          <p
            className="font-body font-light text-base leading-relaxed"
            style={{ color: '#60A5FA', lineHeight: '1.75' }}
          >
            Most music fans find out about concerts too late. You see the Instagram post the morning of
            the show — sold out, resale only, triple the face value. The best seats were gone before
            you even knew the show existed. Concert discovery has been broken for years: fragmented
            across ticket sites, social media, and word of mouth, with no centralized way to know
            what just dropped in your city.
          </p>
        </div>

        <div>
          <h2
            className="font-display font-extrabold uppercase text-2xl mb-3"
            style={{ color: '#FFE500' }}
          >
            The Solution
          </h2>
          <p
            className="font-body font-light text-base leading-relaxed"
            style={{ color: '#60A5FA', lineHeight: '1.75' }}
          >
            TicketAlert monitors live event inventory and surfaces newly announced concerts the moment
            they appear — organized by city, delivered to your inbox every week. No noise, no
            algorithm, just the shows you care about before everyone else finds out. Subscribe to your
            city and never be the last to know again.
          </p>
        </div>

        <div>
          <h2
            className="font-display font-extrabold uppercase text-2xl mb-3"
            style={{ color: '#FFE500' }}
          >
            The Founder
          </h2>
          <p
            className="font-body font-light text-base leading-relaxed"
            style={{ color: '#60A5FA', lineHeight: '1.75' }}
          >
            TicketAlert was built by Griffin Kurzius, a lifelong music fan who got tired of finding
            out about shows after the fact. With a background in software engineering and a genuine
            love for live music, Griffin built the platform he always wished existed — fast, local,
            and obsessively focused on getting fans to shows before the good seats are gone.
          </p>
        </div>
      </section>

      <section className="pt-4">
        <a
          href="/subscribe"
          className="inline-block font-display font-extrabold uppercase text-sm px-8 py-4 rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
        >
          Get Concert Alerts
        </a>
      </section>
    </div>
  )
}
