'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface ConfirmPageProps {
  params: { token: string }
}

type Status = 'loading' | 'success' | 'already_confirmed' | 'error'

export default function ConfirmPage({ params }: ConfirmPageProps) {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    async function confirm() {
      try {
        const res = await fetch(`/api/confirm/${params.token}`)
        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          return
        }

        if (data.already_confirmed) {
          setStatus('already_confirmed')
        } else {
          setStatus('success')
        }
      } catch {
        setStatus('error')
      }
    }

    confirm()
  }, [params.token])

  return (
    <div className="flex flex-col items-center py-16 px-4">
      <div
        className="w-full max-w-lg rounded-xl border p-8 sm:p-12 text-center"
        style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
      >
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {status === 'loading' && (
          <>
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <svg
                className="animate-spin"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="#60A5FA"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="56 20"
                />
              </svg>
            </div>
            <h1
              className="font-display font-extrabold uppercase text-3xl mb-3 leading-none"
              style={{ color: '#ffffff' }}
            >
              Confirming...
            </h1>
            <p className="font-body font-light text-base" style={{ color: '#60A5FA' }}>
              Please wait while we confirm your subscription.
            </p>
          </>
        )}

        {(status === 'success' || status === 'already_confirmed') && (
          <>
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
              You&apos;re <span style={{ color: '#FFE500' }}>in!</span>
            </h1>
            <p
              className="font-body font-light text-base mb-8 leading-relaxed"
              style={{ color: '#60A5FA' }}
            >
              {status === 'already_confirmed'
                ? 'Your email is already confirmed. You\'ll keep receiving new concert announcements in your city every week.'
                : 'Your subscription is confirmed. You\'ll start receiving new concert announcements in your city every week.'}
            </p>
            <Link
              href="/"
              className="inline-block font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{
                backgroundColor: '#FFE500',
                color: '#0a0a0a',
                letterSpacing: '0.08em',
              }}
            >
              Browse Concerts
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ backgroundColor: '#1e3a5f' }}
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
                  d="M10 10L22 22M22 10L10 22"
                  stroke="#60A5FA"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1
              className="font-display font-extrabold uppercase text-4xl mb-3 leading-none"
              style={{ color: '#ffffff' }}
            >
              Invalid <span style={{ color: '#FFE500' }}>link</span>
            </h1>
            <p
              className="font-body font-light text-base mb-8 leading-relaxed"
              style={{ color: '#60A5FA' }}
            >
              This confirmation link is invalid or has already been used. Try subscribing again.
            </p>
            <Link
              href="/subscribe"
              className="inline-block font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{
                backgroundColor: '#FFE500',
                color: '#0a0a0a',
                letterSpacing: '0.08em',
              }}
            >
              Subscribe Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
