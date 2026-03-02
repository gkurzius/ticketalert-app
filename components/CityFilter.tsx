'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CITIES } from '@/lib/cities'

export default function CityFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCity = searchParams.get('city') ?? ''

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value) {
      router.push(`/?city=${value}`)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="city-filter"
        className="font-body font-light text-sm whitespace-nowrap"
        style={{ color: '#60A5FA' }}
      >
        Filter by city:
      </label>
      <select
        id="city-filter"
        value={currentCity}
        onChange={handleChange}
        className="font-body font-light text-sm rounded-lg px-3 py-2 border outline-none focus:ring-2 focus:ring-offset-0"
        style={{
          backgroundColor: '#0f1829',
          borderColor: '#1e3a5f',
          color: '#ffffff',
        }}
      >
        <option value="">All Cities</option>
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.display_name}
          </option>
        ))}
      </select>
    </div>
  )
}
