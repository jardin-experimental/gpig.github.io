import type { Metadata } from 'next'
import { Fraunces, Public_Sans, IBM_Plex_Mono } from 'next/font/google'
import { SiteNav } from '@/components/site-nav'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'GPIG — Jardin expérimental',
    template: '%s · GPIG',
  },
  description:
    "Formations, défis et communauté pour apprendre en expérimentant — GPIG, le jardin expérimental.",
  openGraph: {
    type: 'website',
    siteName: 'GPIG',
    locale: 'fr_FR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body>
        <SiteNav />
        {children}
        <footer className="mt-20 border-t border-line">
          <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-ink-soft">
            © {new Date().getFullYear()} GPIG — jardin expérimental
          </div>
        </footer>
      </body>
    </html>
  )
}
