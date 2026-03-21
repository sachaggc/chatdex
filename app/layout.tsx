import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import WeatherOverlay from '@/components/WeatherOverlay'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm',
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
  icons: { apple: '/icon-192.png' },
}

export const viewport: Viewport = {
  themeColor: '#C34B32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Detect time-of-day before hydration to prevent flash
const timeScript = `(function(){
  var h = new Date().getHours();
  var t = h >= 5 && h < 7  ? 'dawn'
        : h >= 7 && h < 17 ? 'day'
        : h >= 17 && h < 19 ? 'sunset'
        : h >= 19 && h < 21 ? 'evening'
        : 'night';
  document.documentElement.setAttribute('data-time', t);
})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: timeScript }} />
      </head>
      <body className="min-h-svh">
        <ThemeProvider />
        <ServiceWorkerRegistrar />
        <WeatherOverlay />
        {children}
      </body>
    </html>
  )
}
