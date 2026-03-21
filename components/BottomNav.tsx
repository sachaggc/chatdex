'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Grid2X2, BarChart2, Camera, Flame, Settings } from 'lucide-react'

const NAV = [
  { href: '/',        label: 'Galerie',  Icon: Grid2X2  },
  { href: '/stats',   label: 'Stats',    Icon: BarChart2 },
  { href: '/aura',    label: 'Aura',     Icon: Flame    },
  { href: '/settings',label: 'Réglages', Icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 h-16">

        {NAV.slice(0, 2).map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${active ? 'text-brand' : 'text-muted'}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-display font-semibold tracking-wide ${active ? 'text-brand' : 'text-muted'}`}>{label}</span>
            </Link>
          )
        })}

        {/* Bouton capture central */}
        <Link href="/capture" className="flex flex-col items-center gap-1 -mt-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/30 border-4 border-cream transition-transform active:scale-95">
            <Camera size={24} color="white" strokeWidth={2} />
          </span>
          <span className="text-[10px] font-display font-semibold tracking-wide text-brand">Photo</span>
        </Link>

        {NAV.slice(2).map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${active ? 'text-brand' : 'text-muted'}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-display font-semibold tracking-wide ${active ? 'text-brand' : 'text-muted'}`}>{label}</span>
            </Link>
          )
        })}

      </div>
    </nav>
  )
}
