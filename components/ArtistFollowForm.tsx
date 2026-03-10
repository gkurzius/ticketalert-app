'use client'

import { useState } from 'react'

interface ArtistFollowFormProps {
  artistName: string
}

export default function ArtistFollowForm({ artistName }: ArtistFollowFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/artist-follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), artist_name: artistName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Network error — please try again')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
      >
        <p className="font-display font-extrabold uppercase text-2xl mb-2" style={{ color: '#FFE500' }}>
          You&apos;re in! 🎟️
        </p>
        <p className="font-body font-light text-base" style={{ color: '#60A5FA' }}>
          We&apos;ll email you when {artistName} announces a new show.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border p-8"
      style={{ backgroundColor: '#0f1829', borderColor: '#1e3a5f' }}
    >
      <h2
        className="font-display font-extrabold uppercase text-2xl mb-2"
        style={{ color: '#FFE500' }}
      >
        Get notified
      </h2>
      <p className="font-body font-light text-base mb-6" style={{ color: '#60A5FA' }}>
        Get an email the moment {artistName} announces new shows.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 font-body font-light text-sm rounded-lg px-4 py-3 border outline-none"
          style={{ backgroundColor: '#0B1120', borderColor: '#1e3a5f', color: '#ffffff' }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="font-display font-extrabold uppercase text-sm px-6 py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#FFE500', color: '#0a0a0a', letterSpacing: '0.08em' }}
        >
          {status === 'loading' ? 'Saving...' : 'Get Alerts'}
        </button>
      </form>
      {status === 'error' && (
        <p className="font-body font-light text-sm mt-3" style={{ color: '#EF4444' }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
