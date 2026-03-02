import type { Metadata } from 'next'
import SubscribeForm from '@/components/SubscribeForm'

export const metadata: Metadata = {
  title: 'Get Concert Alerts | TicketAlert',
  description: 'Sign up for weekly new concert announcements in your city. Never be the last to know.',
}

export default function SubscribePage() {
  return (
    <div className="flex flex-col items-center py-16 px-4">
      <div
        className="w-full max-w-lg rounded-xl border p-8 sm:p-12"
        style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
      >
        <h1
          className="font-display font-extrabold uppercase text-4xl sm:text-5xl text-center mb-2 leading-none"
          style={{ color: '#ffffff' }}
        >
          Never miss a <span style={{ color: '#FFE500' }}>drop</span>
        </h1>
        <p
          className="font-body font-light text-base text-center mb-8"
          style={{ color: '#60A5FA' }}
        >
          Get new concerts just announced in your city — delivered every week.
        </p>
        <SubscribeForm />
      </div>
    </div>
  )
}
