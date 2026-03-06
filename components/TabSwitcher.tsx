'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface TabSwitcherProps {
  activeTab: string
}

const TABS = [
  { id: 'onsale', label: 'On Sale Soon' },
  { id: 'upcoming', label: 'Upcoming Shows' },
]

export default function TabSwitcher({ activeTab }: TabSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div
      className="flex gap-1 rounded-xl p-1"
      style={{ backgroundColor: '#0f1829', border: '1px solid #1e3a5f' }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className="flex-1 px-6 py-2.5 rounded-lg font-display font-extrabold uppercase text-sm transition-all"
            style={{
              backgroundColor: isActive ? '#FFE500' : 'transparent',
              color: isActive ? '#0a0a0a' : '#60A5FA',
              letterSpacing: '0.08em',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
