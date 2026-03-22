'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface Props {
  active: boolean
  onDone: () => void
  isNewCat?: boolean
  rarityLevel?: number   // 0=shiny 1=legendary 2=ultra-rare 3=rare 4=uncommon 5+=common
  rarityColor?: string
  catName?: string
}

const TIER_CONFIG = {
  new:       { bg: '#C98A2F', icon: '✨', text: 'Nouveau chat !',   glow: '#FFD700' },
  shiny:     { bg: '#C98A2F', icon: '💎', text: 'SHINY !',          glow: '#FFD700' },
  legendary: { bg: '#9333ea', icon: '👑', text: 'Légendaire !',      glow: '#c084fc' },
  ultrarare: { bg: '#2563eb', icon: '🌟', text: 'Ultra Rare !',      glow: '#60a5fa' },
  rare:      { bg: '#16a34a', icon: '✓',  text: 'Observé !',         glow: '#4ade80' },
  common:    { bg: '#2D7A75', icon: '✓',  text: 'Observé !',         glow: '#5eead4' },
}

function getTier(isNewCat?: boolean, rarityLevel?: number) {
  if (isNewCat) return TIER_CONFIG.new
  if (rarityLevel === 0) return TIER_CONFIG.shiny
  if (rarityLevel === 1) return TIER_CONFIG.legendary
  if (rarityLevel === 2) return TIER_CONFIG.ultrarare
  if (rarityLevel === 3) return TIER_CONFIG.rare
  return TIER_CONFIG.common
}

export default function CatchAnimation({ active, onDone, isNewCat, rarityLevel, catName }: Props) {
  const tier = getTier(isNewCat, rarityLevel)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(onDone, 1600)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isNewCat ? [40, 30, 80, 30, 40] : [30, 20, 30])
    }
    return () => clearTimeout(t)
  }, [active, isNewCat, onDone])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Dark overlay */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Expanding ring */}
          <motion.div
            className="absolute rounded-full"
            style={{ background: tier.glow + '30', border: `2px solid ${tier.glow}60` }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ background: tier.glow + '20', border: `2px solid ${tier.glow}40` }}
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 500, height: 500, opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.1 }}
          />

          {/* Core circle with icon */}
          <motion.div
            className="relative flex flex-col items-center justify-center rounded-full z-10"
            style={{ background: tier.bg, boxShadow: `0 0 60px ${tier.glow}80`, width: 110, height: 110 }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: [0, 1.15, 1], rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 240, duration: 0.5 }}
          >
            <span className="text-5xl leading-none select-none">{tier.icon}</span>
          </motion.div>

          {/* Text label */}
          <motion.div
            className="relative z-10 mt-5 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="font-display font-black text-white text-xl tracking-wide drop-shadow-lg">
              {tier.text}
            </p>
            {catName && (
              <p className="text-white/70 text-sm font-semibold mt-1">{catName}</p>
            )}
          </motion.div>

          {/* Sparkle dots for legendary+ */}
          {(isNewCat || (rarityLevel !== undefined && rarityLevel <= 2)) && (
            <>
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2
                const dist = 90
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{ width: 8, height: 8, background: tier.glow }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      scale: [0, 1.5, 0],
                      opacity: [1, 1, 0],
                    }}
                    transition={{ duration: 0.9, delay: 0.1 + i * 0.03, ease: 'easeOut' }}
                  />
                )
              })}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
