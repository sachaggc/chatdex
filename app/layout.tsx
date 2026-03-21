import type { Metadata, Viewport } from 'next'
import { Tajawal } from 'next/font/google'
import './globals.css'

const tajawal = Tajawal({
  subsets: ['latin', 'arabic'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Chatdex — Les chats de Rabat',
  description: 'Le Pokédex des chats du quartier',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chatdex',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#C65D3C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={tajawal.variable}>
      <body className="min-h-svh bg-cream">
        {children}
      </body>
    </html>
  )
}
