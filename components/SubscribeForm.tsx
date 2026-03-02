'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CITIES } from '@/lib/cities'

interface SubscribeFormProps {
  defaultCitySlug?: string
}

export default function SubscribeForm({ defaultCitySlug = '' }: SubscribeFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [citySlug, setCitySlug] = useState(defaultCitySlug)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!citySlug) {
      setError('Please select your city.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), citySlug }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('This email is already subscribed.')
        } else {
          setError(data.error ?? 'Something went wrong. Please try again.')
        }
        return
      }

      router.push('/subscribe/success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="subscribe-email"
          className="font-body font-light text-sm"
          style={{ color: '#60A5FA' }}
        >
          Email address
        </label>
        <input
          id="subscribe-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
          className="font-body font-light text-base rounded-lg px-4 py-3 border outline-none focus:ring-2 focus:ring-brand-yellow focus:ring-offset-0 transition-colors"
          style={{
            backgroundColor: '#0f1829',
            borderColor: '#1e3a5f',
            color: '#ffffff',
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="subscribe-city"
          className="font-body font-light text-sm"
          style={{ color: '#60A5FA' }}
        >
          Your city
        </label>
        <select
          id="subscribe-city"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          required
          disabled={loading}
          className="font-body font-light text-base rounded-lg px-4 py-3 border outline-none focus:ring-2 focus:ring-brand-yellow focus:ring-offset-0 transition-colors"
          style={{
            backgroundColor: '#0f1829',
            borderColor: '#1e3a5f',
            color: citySlug ? '#ffffff' : '#60A5FA',
          }}
        >
          <option value="" disabled style={{ color: '#60A5FA' }}>
            Select your city
          </option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug} style={{ color: '#ffffff' }}>
              {c.display_name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p
          className="font-body font-light text-sm rounded-lg px-4 py-3 border"
          style={{ color: '#FFE500', backgroundColor: '#0f1829', borderColor: '#FFE500' }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: '#FFE500',
          color: '#0a0a0a',
          letterSpacing: '0.08em',
        }}
      >
        {loading ? 'Signing up...' : 'Get Concert Alerts'}
      </button>

      <p className="font-body font-light text-xs text-center" style={{ color: '#60A5FA' }}>
        Weekly digest. No spam. Unsubscribe anytime.
      </p>
    </form>
  )
}
