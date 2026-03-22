'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flame, Vote } from 'lucide-react'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const OPTIONS = [
  {
    href: '/aura',
    Icon: Flame,
    color: '#C34B32',
    bg: '#C34B3208',
    border: '#C34B3240',
    title: 'Aura Farm',
    sub: 'Duels · Classement · Actions spéciales',
    badge: '⚔️',
  },
  {
    href: '/politique',
    Icon: Vote,
    color: '#1B2D4A',
    bg: '#1B2D4A08',
    border: '#1B2D4A30',
    title: 'Félitics',
    sub: 'Sondages · Coalitions · Premier Tour',
    badge: '🗳️',
  },
]

export default function ArenesPage() {
  return (
    <div className="min-h-svh pb-24 flex flex-col">
      <TopBar title="⚔️ Arènes" />

      <div className="flex-1 flex flex-col justify-center px-6 py-10 gap-5 max-w-sm mx-auto w-full">
        <motion.p
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="text-center text-[11px] font-display font-bold text-muted uppercase tracking-widest mb-2"
        >
          Choisis ton arène
        </motion.p>

        {OPTIONS.map((opt, i) => (
          <motion.div key={opt.href}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href={opt.href}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-3xl border-2 p-7 text-center cursor-pointer transition-shadow hover:shadow-lg"
                style={{ background: opt.bg, borderColor: opt.border }}
              >
                <div className="text-4xl mb-3">{opt.badge}</div>
                <h2 className="font-display font-black text-text text-2xl mb-1">{opt.title}</h2>
                <p className="text-sm text-muted">{opt.sub}</p>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
