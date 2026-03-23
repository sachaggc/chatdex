'use client'

/**
 * Écran de chargement vidéo-game entre les pages.
 * Apparaît uniquement si la navigation prend > 100ms (invisible pour les pages rapides).
 * Couvre le spinner natif du navigateur avec un 🐱 qui danse.
 */

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const TIPS = [
  'Les chats de l\'Océan dominent les rues à l\'aube 🌅',
  'Un chat Shiny ne se laisse apercevoir qu\'une fois… ✨',
  'La nuit tombée, les chats reprennent le quartier 🌙',
  'Plus tu explores, plus ta streak grandit 🔥',
  'Certains chats ont un alignement politique bien arrêté 🗳️',
  'Chaque rue de l\'Océan cache encore un chat inconnu 📍',
  'Les chats légendaires bougent peu — c\'est leur force 👑',
  'Le secret du Chatdex : observer, pas déranger 🤫',
]

export default function NavLoader() {
  const pathname    = usePathname()
  const [visible, setVisible]   = useState(false)
  const [tip, setTip]           = useState(TIPS[0])
  const prevPath    = useRef(pathname)
  const pendingRef  = useRef(false)
  const timerRef    = useRef<ReturnType<typeof setTimeout>>()

  // Intercepte les clics sur les liens internes
  useEffect(() => {
    const onNavClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      // Ignorer les liens externes, ancres, même page
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return
      if (anchor.target === '_blank') return
      const dest = href.split('?')[0].split('#')[0]
      if (dest === window.location.pathname) return
      if (pendingRef.current) return

      pendingRef.current = true
      // Nouveau tip aléatoire à chaque navigation
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)])

      clearTimeout(timerRef.current)
      // Ne s'affiche que si la nav prend > 100ms (pages rapides = invisible)
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) setVisible(true)
      }, 100)
    }

    document.addEventListener('click', onNavClick, true)
    return () => document.removeEventListener('click', onNavClick, true)
  }, [])

  // Quand la nouvelle page est prête → masquer
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    pendingRef.current = false
    clearTimeout(timerRef.current)
    setVisible(false)
  }, [pathname])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9990] flex flex-col items-center justify-center gap-8 select-none"
          style={{ background: '#1B2D4A' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          {/* Wordmark discret */}
          <p className="absolute top-6 inset-x-0 text-center font-display font-black text-[10px] tracking-[0.35em] uppercase text-white/20">
            Chatdex
          </p>

          {/* Chat qui danse — bounce + sway + squish */}
          <motion.div
            animate={{
              y:      [0, -20, -8, -20, 0],
              rotate: [0,  -7,  0,   7, 0],
              scaleX: [1,   1, 1.12,  1, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.75,
              ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
            style={{ fontSize: 68, lineHeight: 1 }}
            aria-hidden
          >
            🐱
          </motion.div>

          {/* Traces de pattes — allumage en séquence */}
          <div className="flex items-center gap-4">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                style={{ fontSize: 20 }}
                animate={{ opacity: [0.12, 0.65, 0.12] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                aria-hidden
              >
                🐾
              </motion.span>
            ))}
          </div>

          {/* Tip — apparaît avec un léger délai */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="text-white/30 text-[11px] text-center leading-relaxed px-10 max-w-[260px]"
          >
            {tip}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
