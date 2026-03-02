export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-16">
        <h1
          className="font-display font-extrabold uppercase text-5xl sm:text-6xl lg:text-7xl mb-4"
          style={{ color: '#ffffff' }}
        >
          New concerts just announced{' '}
          <span style={{ color: '#FFE500' }}>in your city</span>
        </h1>
        <p
          className="font-body font-light text-lg sm:text-xl max-w-2xl mx-auto"
          style={{ color: '#60A5FA' }}
        >
          Never be the last to know. TicketAlert surfaces newly announced shows the moment they appear.
        </p>
      </section>

      <section className="text-center py-8">
        <div
          className="inline-block rounded-lg px-8 py-6 border"
          style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
        >
          <p className="font-body font-light" style={{ color: '#60A5FA' }}>
            Events loading soon — database coming in the next step.
          </p>
        </div>
      </section>
    </div>
  )
}
