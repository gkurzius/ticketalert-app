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

      <section className="space-y-6">
        <p
          className="font-body font-light text-base leading-relaxed"
          style={{ color: '#60A5FA', lineHeight: '1.75' }}
        >
          Earlier this year I tried to buy Bruce Springsteen tickets the day they went on sale.
        </p>
        <p
          className="font-body font-light text-base leading-relaxed"
          style={{ color: '#60A5FA', lineHeight: '1.75' }}
        >
          By the time I found out, even the nosebleeds were $500 on StubHub. Face value? $130. I
          missed it by a few hours — not because I didn&apos;t want to go, but because I just
          didn&apos;t know in time.
        </p>
        <p
          className="font-body font-light text-base leading-relaxed"
          style={{ color: '#60A5FA', lineHeight: '1.75' }}
        >
          There had to be a better way.
        </p>
        <p
          className="font-body font-light text-base leading-relaxed"
          style={{ color: '#60A5FA', lineHeight: '1.75' }}
        >
          So we built TicketAlert. We scan the internet for new concert announcements and on-sale
          dates in your city and deliver them straight to your inbox — before they sell out, before
          the resellers flip them, before you&apos;re stuck paying 4x face value.
        </p>
        <p
          className="font-body font-light text-base leading-relaxed"
          style={{ color: '#60A5FA', lineHeight: '1.75' }}
        >
          Live music should be for everyone. Not just the people who happened to check Ticketmaster
          at the right moment.
        </p>
        <p
          className="font-body font-light text-base leading-relaxed"
          style={{ color: '#60A5FA', lineHeight: '1.75' }}
        >
          No noise. No algorithm. Just the drops and shows that matter, every week.
        </p>
        <p
          className="font-body font-light text-base leading-relaxed"
          style={{ color: '#ffffff' }}
        >
          Never miss a drop again.
        </p>
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
