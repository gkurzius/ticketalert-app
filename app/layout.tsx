import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import './globals.css'
import Logo from '@/components/Logo'

const barlowCondensed = Barlow_Condensed({
  weight: '800',
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['300', '400'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TicketAlert — New Concerts Announced in Your City',
  description: 'Never be the last to know about concerts in your city. Get notified the moment new shows are announced.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ticketalert.co'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${dmSans.variable}`}>
      <body className="min-h-screen" style={{ backgroundColor: '#0B1120' }}>
        <header className="border-b" style={{ borderColor: '#1e3a5f', backgroundColor: '#0B1120' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Logo />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t mt-16" style={{ borderColor: '#1e3a5f' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Logo />
              <p className="font-body font-light text-sm" style={{ color: '#60A5FA' }}>
                &copy; {new Date().getFullYear()} TicketAlert. Never miss a drop.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
