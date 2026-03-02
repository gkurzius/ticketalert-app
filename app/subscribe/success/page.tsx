import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Check Your Inbox | TicketAlert',
  description: 'Almost there! Check your email to confirm your TicketAlert subscription.',
}

export default function SubscribeSuccessPage() {
  return (
    <div className="flex flex-col items-center py-16 px-4">
      <div
        className="w-full max-w-lg rounded-xl border p-8 sm:p-12 text-center"
        style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
      >
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ backgroundColor: '#FFE500' }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 16L13 23L26 9"
              stroke="#0a0a0a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          className="font-display font-extrabold uppercase text-4xl mb-3 leading-none"
          style={{ color: '#ffffff' }}
        >
          Check your <span style={{ color: '#FFE500' }}>inbox</span>
        </h1>
        <p
          className="font-body font-light text-base mb-8 leading-relaxed"
          style={{ color: '#60A5FA' }}
        >
          We sent you a confirmation email. Click the link inside to start receiving new concert
          announcements in your city.
        </p>

        <p className="font-body font-light text-sm mb-6" style={{ color: '#60A5FA' }}>
          Didn&apos;t get it? Check your spam folder.
        </p>

        <Link
          href="/"
          className="inline-block font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg border transition-opacity hover:opacity-80"
          style={{
            borderColor: '#1e3a5f',
            color: '#60A5FA',
            letterSpacing: '0.08em',
          }}
        >
          Browse Concerts
        </Link>
      </div>
    </div>
  )
}
