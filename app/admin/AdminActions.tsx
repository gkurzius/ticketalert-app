'use client'

import { useState } from 'react'

interface AdminActionsProps {
  basicAuthHeader: string
}

type ActionResult = {
  ok: boolean
  message: string
}

export default function AdminActions({ basicAuthHeader }: AdminActionsProps) {
  const [ingestResult, setIngestResult] = useState<ActionResult | null>(null)
  const [newsletterResult, setNewsletterResult] = useState<ActionResult | null>(null)
  const [testEmailResult, setTestEmailResult] = useState<ActionResult | null>(null)
  const [ingestLoading, setIngestLoading] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [testEmailLoading, setTestEmailLoading] = useState(false)

  async function runIngest() {
    setIngestLoading(true)
    setIngestResult(null)
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { Authorization: basicAuthHeader },
      })
      const data = await res.json()
      if (res.ok) {
        setIngestResult({
          ok: true,
          message: `Done — ${data.cities_processed} cities, ${data.events_added} added, ${data.events_updated} updated, ${data.cities_failed} failed`,
        })
      } else {
        setIngestResult({ ok: false, message: data.error ?? 'Ingest failed' })
      }
    } catch {
      setIngestResult({ ok: false, message: 'Network error' })
    } finally {
      setIngestLoading(false)
    }
  }

  async function runNewsletter() {
    setNewsletterLoading(true)
    setNewsletterResult(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { Authorization: basicAuthHeader },
      })
      const data = await res.json()
      if (res.ok) {
        setNewsletterResult({
          ok: true,
          message: `Done — ${data.sent} sent, ${data.skipped} skipped, ${data.failed} failed`,
        })
      } else {
        setNewsletterResult({ ok: false, message: data.error ?? 'Newsletter failed' })
      }
    } catch {
      setNewsletterResult({ ok: false, message: 'Network error' })
    } finally {
      setNewsletterLoading(false)
    }
  }

  async function sendTestEmail() {
    setTestEmailLoading(true)
    setTestEmailResult(null)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { Authorization: basicAuthHeader },
      })
      const data = await res.json()
      if (res.ok) {
        setTestEmailResult({ ok: true, message: `Sent to ${data.sent_to}` })
      } else {
        setTestEmailResult({ ok: false, message: data.error ?? 'Failed' })
      }
    } catch {
      setTestEmailResult({ ok: false, message: 'Network error' })
    } finally {
      setTestEmailLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-xl p-6" style={{ backgroundColor: '#0f1829', border: '1px solid #1e3a5f' }}>
        <h3 className="font-display text-xl font-extrabold uppercase text-white mb-2">Ingest</h3>
        <p className="font-body font-light text-sm mb-4" style={{ color: '#60A5FA' }}>
          Pull latest events from SeatGeek for all 20 cities.
        </p>
        <button
          onClick={runIngest}
          disabled={ingestLoading}
          className="w-full py-2 px-4 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#3B82F6', color: '#ffffff' }}
        >
          {ingestLoading ? 'Running…' : 'Run Ingest Now'}
        </button>
        {ingestResult && (
          <p
            className="mt-3 text-sm font-body font-light"
            style={{ color: ingestResult.ok ? '#FFE500' : '#f87171' }}
          >
            {ingestResult.message}
          </p>
        )}
      </div>

      <div className="rounded-xl p-6" style={{ backgroundColor: '#0f1829', border: '1px solid #1e3a5f' }}>
        <h3 className="font-display text-xl font-extrabold uppercase text-white mb-2">Newsletter</h3>
        <p className="font-body font-light text-sm mb-4" style={{ color: '#60A5FA' }}>
          Send weekly digest to all confirmed subscribers with fresh events.
        </p>
        <button
          onClick={runNewsletter}
          disabled={newsletterLoading}
          className="w-full py-2 px-4 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#3B82F6', color: '#ffffff' }}
        >
          {newsletterLoading ? 'Sending…' : 'Send Newsletter Now'}
        </button>
        {newsletterResult && (
          <p
            className="mt-3 text-sm font-body font-light"
            style={{ color: newsletterResult.ok ? '#FFE500' : '#f87171' }}
          >
            {newsletterResult.message}
          </p>
        )}
      </div>

      <div className="rounded-xl p-6" style={{ backgroundColor: '#0f1829', border: '1px solid #1e3a5f' }}>
        <h3 className="font-display text-xl font-extrabold uppercase text-white mb-2">Test Email</h3>
        <p className="font-body font-light text-sm mb-4" style={{ color: '#60A5FA' }}>
          Send a sample newsletter email to the admin address.
        </p>
        <button
          onClick={sendTestEmail}
          disabled={testEmailLoading}
          className="w-full py-2 px-4 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#1e3a5f', color: '#ffffff' }}
        >
          {testEmailLoading ? 'Sending…' : 'Send Test Email'}
        </button>
        {testEmailResult && (
          <p
            className="mt-3 text-sm font-body font-light"
            style={{ color: testEmailResult.ok ? '#FFE500' : '#f87171' }}
          >
            {testEmailResult.message}
          </p>
        )}
      </div>
    </div>
  )
}
