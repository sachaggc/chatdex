'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Grid2X2, BarChart2, Flame, Settings, Eye, Camera, Vote } from 'lucide-react'
import { motion } from 'framer-motion'
import QuickVuModal from './QuickVuModal'

const NAV = [
  { href: '/',          label: 'Galerie',  Icon: Grid2X2  },
  { href: '/stats',     label: 'Stats',    Icon: BarChart2 },
  { href: '/politique', label: 'Félitics', Icon: Vote     },
  { href: '/aura',      label: 'Aura',     Icon: Flame    },
  { href: '/settings',  label: 'Réglages', Icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [mode, setMode]           = useState<'photo' | 'vue'>('photo')
  const [showQuickVu, setShowQuickVu] = useState(false)

  function handleCentralPress() {
    if (mode === 'photo') {
      router.push('/capture')
    } else {
      setShowQuickVu(true)
    }
  }

  return (
    <>
      <nav className="bottom-nav">
        <div className="flex items-center justify-around px-2 h-16">

          {NAV.slice(0, 2).map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 px-1.5 py-1 transition-colors ${active ? 'text-brand' : 'text-muted'}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-display font-semibold tracking-wide ${active ? 'text-brand' : 'text-muted'}`}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Bouton central avec switch Photo / Vue */}
          <div className="flex flex-col items-center gap-0 -mt-5">

            {/* Switch Photo / Vue */}
            <div className="flex rounded-full bg-surface border border-border shadow-sm mb-1.5 p-0.5 text-[10px] font-display font-bold">
              <button
                onClick={() => setMode('photo')}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-all ${
                  mode === 'photo' ? 'bg-brand text-white shadow-sm' : 'text-muted'
                }`}
              >
                <Camera size={10} />
                Photo
              </button>
              <button
                onClick={() => setMode('vue')}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-all ${
                  mode === 'vue' ? 'bg-teal text-white shadow-sm' : 'text-muted'
                }`}
              >
                <Eye size={10} />
                Vue
              </button>
            </div>

            {/* Bouton principal */}
            <motion.button
              onClick={handleCentralPress}
              whileTap={{ scale: 0.92 }}
              className={`flex h-13 w-13 items-center justify-center rounded-full border-4 border-cream shadow-lg transition-colors ${
                mode === 'photo'
                  ? 'bg-brand shadow-brand/30'
                  : 'bg-teal shadow-teal/30'
              }`}
              style={{ height: 52, width: 52 }}
            >
              {mode === 'photo'
                ? <Camera size={22} color="white" strokeWidth={2} />
                : <Eye    size={22} color="white" strokeWidth={2} />
              }
            </motion.button>

            <span className={`text-[10px] font-display font-semibold tracking-wide mt-0.5 ${
              mode === 'photo' ? 'text-brand' : 'text-teal'
            }`}>
              {mode === 'photo' ? 'Photo' : 'Vu rapide'}
            </span>
          </div>

          {NAV.slice(2).map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 px-1.5 py-1 transition-colors ${active ? 'text-brand' : 'text-muted'}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-display font-semibold tracking-wide ${active ? 'text-brand' : 'text-muted'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mode Vue rapide — plein écran */}
      <QuickVuModal open={showQuickVu} onClose={() => setShowQuickVu(false)} />
    </>
  )
}
