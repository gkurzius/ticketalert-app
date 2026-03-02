'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  targetDate: string | null
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!targetDate) return

    setMounted(true)
    setTimeLeft(calcTimeLeft(targetDate))

    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (!targetDate) return null

  if (!mounted) {
    return (
      <div className="flex gap-4">
        {['Days', 'Hours', 'Mins', 'Secs'].map((label) => (
          <div key={label} className="flex flex-col items-center">
            <span
              className="font-display font-extrabold uppercase text-3xl sm:text-4xl leading-none"
              style={{ color: '#FFE500' }}
            >
              --
            </span>
            <span className="font-body font-light text-xs mt-1" style={{ color: '#60A5FA' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (!timeLeft) {
    return (
      <p className="font-display font-extrabold uppercase text-xl" style={{ color: '#60A5FA' }}>
        Event has passed
      </p>
    )
  }

  const segments = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Mins' },
    { value: timeLeft.seconds, label: 'Secs' },
  ]

  return (
    <div className="flex gap-6">
      {segments.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span
            className="font-display font-extrabold uppercase text-3xl sm:text-4xl leading-none tabular-nums"
            style={{ color: '#FFE500' }}
          >
            {String(value).padStart(2, '0')}
          </span>
          <span className="font-body font-light text-xs mt-1" style={{ color: '#60A5FA' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
