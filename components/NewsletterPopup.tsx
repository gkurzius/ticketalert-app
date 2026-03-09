'use client'

import { useState, useEffect } from 'react'
import { CITIES } from '@/lib/cities'

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [citySlug, setCitySlug] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const dismissed = sessionStorage.getItem('newsletter_popup_dismissed')
    if (dismissed) return
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    sessionStorage.setItem('newsletter_popup_dismissed', '1')
    setVisible(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const resolvedCity =
        CITIES.find((c) => c.slug === citySlug) ??
        CITIES.find((c) => c.display_name === citySlug) ??
        CITIES.find((c) => c.city === citySlug)

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, citySlug: resolvedCity?.slug ?? citySlug }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('success')
        sessionStorage.setItem('newsletter_popup_dismissed', '1')
      } else if (res.status === 409) {
        setErrorMsg("You're already subscribed!")
        setStatus('error')
      } else {
        setErrorMsg(data?.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-8"
        style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 font-body font-light text-lg leading-none transition-opacity hover:opacity-70"
          style={{ color: '#60A5FA' }}
          aria-label="Dismiss"
        >
          ✕
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <p className="font-display font-extrabold uppercase text-3xl mb-3" style={{ color: '#FFE500' }}>
              You&apos;re in! 🎉
            </p>
            <p className="font-body font-light text-base" style={{ color: '#60A5FA' }}>
              Check your inbox to confirm your subscription.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-extrabold uppercase text-3xl mb-2" style={{ color: '#FFE500' }}>
              Never miss a drop
            </h2>
            <p className="font-body font-light text-sm mb-6" style={{ color: '#60A5FA' }}>
              New concerts just announced in your city — delivered to your inbox every week.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full font-body font-light text-sm rounded-lg px-4 py-2.5 border outline-none"
                style={{ backgroundColor: '#0B1120', borderColor: '#1e3a5f', color: '#ffffff' }}
              />
              <select
                required
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
                className="w-full font-body font-light text-sm rounded-lg px-4 py-2.5 border outline-none"
                style={{
                  backgroundColor: '#0B1120',
                  borderColor: '#1e3a5f',
                  color: citySlug ? '#ffffff' : '#60A5FA',
                }}
              >
                <option value="">Select your city</option>
                {CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.display_name}
                  </option>
                ))}
              </select>
              {errorMsg && (
                <p className="font-body font-light text-sm" style={{ color: '#EF4444' }}>
                  {errorMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
              >
                {status === 'loading' ? 'Subscribing...' : 'Get Concert Alerts'}
              </button>
            </form>
            <button
              onClick={dismiss}
              className="mt-4 w-full font-body font-light text-xs text-center transition-opacity hover:opacity-70"
              style={{ color: '#60A5FA' }}
            >
              No thanks, I&apos;ll miss out
            </button>
          </>
        )}
      </div>
    </div>
  )
}
