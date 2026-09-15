import type { Metadata } from 'next'
import { defaultLocale, t } from '@/i18n/messages'
import './globals.css'

// Imported for its side effect: a missing environment variable must fail at
// startup, naming what is absent, rather than becoming an undefined later.
import '@/lib/env'

export const metadata: Metadata = {
  title: t('app.name'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  )
}
