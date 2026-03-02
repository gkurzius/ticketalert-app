import Link from 'next/link'

interface LogoProps {
  className?: string
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex flex-col items-start gap-1 no-underline ${className}`}>
      <div className="flex items-center gap-3">
        <svg
          width="44"
          height="36"
          viewBox="0 0 44 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1" y="6" width="42" height="24" rx="3" fill="#FFE500" />
          <path
            d="M13 6 L13 30"
            stroke="#0B1120"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <path
            d="M31 6 L31 30"
            stroke="#0B1120"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <circle cx="22" cy="18" r="9" fill="#0B1120" />
          <circle cx="22" cy="18" r="7" fill="#0f1829" stroke="#FFE500" strokeWidth="1" />
          <line x1="22" y1="18" x2="22" y2="13" stroke="#FFE500" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="18" x2="26" y2="18" stroke="#FFE500" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="22" cy="18" r="1" fill="#FFE500" />
          <path d="M18 2 L18 6" stroke="#FFE500" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 2 L26 6" stroke="#FFE500" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 30 L18 34" stroke="#FFE500" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 30 L26 34" stroke="#FFE500" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span
          className="font-display font-extrabold uppercase text-2xl tracking-wide leading-none"
          style={{ letterSpacing: '0.05em' }}
        >
          <span className="text-white">Ticket</span>
          <span style={{ color: '#FFE500' }}>Alert</span>
        </span>
      </div>
      <span
        className="font-body font-light text-xs tracking-widest uppercase ml-[56px]"
        style={{ color: '#60A5FA', letterSpacing: '0.2em' }}
      >
        Never miss a drop
      </span>
    </Link>
  )
}
