'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Grid2X2, BarChart2, Camera, Flame, Settings, Eye, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QuickVuModal from './QuickVuModal'

const NAV = [
  { href: '/',         label: 'Galerie',  Icon: Grid2X2  },
  { href: '/stats',    label: 'Stats',    Icon: BarChart2 },
  { href: '/aura',     label: 'Aura',     Icon: Flame    },
  { href: '/settings', label: 'Réglages', Icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [showChoice, setShowChoice]   = useState(false)
  const [showQuickVu, setShowQuickVu] = useState(false)

  function openChoice() { setShowChoice(true) }
  function closeChoice() { setShowChoice(false) }

  function handleQuickVu() {
    closeChoice()
    setTimeout(() => setShowQuickVu(true), 50)
  }

  return (
    <>
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

          {/* Bouton central — ouvre le choix */}
          <button onClick={openChoice} className="flex flex-col items-center gap-1 -mt-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/30 border-4 border-cream transition-transform active:scale-95">
              <Camera size={24} color="white" strokeWidth={2} />
            </span>
            <span className="text-[10px] font-display font-semibold tracking-wide text-brand">Photo</span>
          </button>

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

      {/* Mini-menu choix au-dessus de la nav */}
      <AnimatePresence>
        {showChoice && (
          <>
            <motion.div
              className="fixed inset-0 z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChoice}
            />
            <motion.div
              className="fixed bottom-20 left-1/2 z-[101] flex flex-col items-center gap-3"
              style={{ transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.85 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            >
              {/* Vu rapide */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleQuickVu}
                className="flex items-center gap-3 rounded-2xl bg-white shadow-xl border border-border px-6 py-3.5 min-w-[180px]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/10">
                  <Eye size={18} className="text-teal" />
                </span>
                <div className="text-left">
                  <p className="font-display font-bold text-text text-sm">Vu rapide</p>
                  <p className="text-[11px] text-muted">Sans photo, en 1 sec</p>
                </div>
              </motion.button>

              {/* Capture photo */}
              <motion.div
                whileTap={{ scale: 0.94 }}
              >
                <Link
                  href="/capture"
                  onClick={closeChoice}
                  className="flex items-center gap-3 rounded-2xl bg-brand shadow-xl px-6 py-3.5 min-w-[180px]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                    <Camera size={18} className="text-white" />
                  </span>
                  <div className="text-left">
                    <p className="font-display font-bold text-white text-sm">Capture photo</p>
                    <p className="text-[11px] text-white/70">Avec photo</p>
                  </div>
                </Link>
              </motion.div>

              {/* Fermer */}
              <button onClick={closeChoice} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md border border-border">
                <X size={16} className="text-muted" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal vu rapide */}
      <QuickVuModal open={showQuickVu} onClose={() => setShowQuickVu(false)} />
    </>
  )
}
