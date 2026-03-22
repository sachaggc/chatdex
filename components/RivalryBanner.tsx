'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Swords, Trophy } from 'lucide-react'
import { getLevelInfo } from '@/lib/levels'

interface Profile {
  id: string
  username: string
  total_xp: number
  level: number
  streak_days: number
  cats_discovered_count: number
  last_action_at: string | null
}

interface WeeklyStat {
  username: string
  weekly_xp: number
  weekly_actions: number
}

interface RivalryData {
  profiles: Profile[]
  weekly: WeeklyStat[]
}

const AVATAR_COLORS = ['#C34B32', '#2D7A75', '#C98A2F', '#1B2D4A', '#9333ea']

export default function RivalryBanner() {
  const [data, setData] = useState<RivalryData | null>(null)

  useEffect(() => {
    fetch('/api/rivalry').then(r => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data || data.profiles.length < 2) return null

  const [p1, p2] = data.profiles
  const w1 = data.weekly.find(w => w.username === p1.username)
  const w2 = data.weekly.find(w => w.username === p2.username)

  const weeklyLeader = (w1?.weekly_xp ?? 0) >= (w2?.weekly_xp ?? 0) ? p1.username : p2.username
  const totalLeader  = p1.total_xp >= p2.total_xp ? p1.username : p2.username
  const streakLeader = p1.streak_days >= p2.streak_days ? p1.username : p2.username

  function PlayerCard({ p, weekly, colorIndex }: { p: Profile; weekly?: WeeklyStat; colorIndex: number }) {
    const { current } = getLevelInfo(p.total_xp)
    const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]
    const isWeeklyWinner  = weeklyLeader  === p.username
    const isTotalWinner   = totalLeader   === p.username
    const isStreakWinner  = streakLeader  === p.username

    return (
      <div className="flex-1 flex flex-col items-center text-center px-2 py-3">
        {/* Avatar */}
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-display font-black text-lg mb-2 shadow-sm"
          style={{ background: color }}
        >
          {p.username[0].toUpperCase()}
        </div>
        <p className="font-display font-bold text-text text-sm truncate w-full">{p.username}</p>
        <p className="text-[10px] text-muted mb-2">{current.title}</p>

        {/* Stats */}
        <div className="w-full space-y-1.5">
          <StatRow
            label="XP semaine"
            value={`${(weekly?.weekly_xp ?? 0).toLocaleString('fr-FR')} XP`}
            highlight={isWeeklyWinner}
          />
          <StatRow
            label="XP total"
            value={`${p.total_xp.toLocaleString('fr-FR')} XP`}
            highlight={isTotalWinner}
          />
          <StatRow
            label="Streak"
            value={`${p.streak_days}j 🔥`}
            highlight={isStreakWinner}
          />
          <StatRow
            label="Chats découverts"
            value={`${p.cats_discovered_count}`}
            highlight={p.cats_discovered_count >= (data?.profiles[colorIndex === 0 ? 1 : 0]?.cats_discovered_count ?? 0)}
          />
        </div>
      </div>
    )
  }

  function StatRow({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
    return (
      <div
        className="rounded-lg px-2 py-1 text-left"
        style={{ background: highlight ? '#C98A2F15' : 'transparent' }}
      >
        <p className="text-[9px] text-muted uppercase font-bold tracking-wide">{label}</p>
        <p className={`text-xs font-bold ${highlight ? 'text-gold' : 'text-text'}`}>
          {highlight && '› '}{value}
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mx-0 mb-4"
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <Swords size={15} className="text-brand" />
        <p className="font-display font-bold text-text text-sm uppercase tracking-wide">Rivalry</p>
        <span className="text-xs text-muted">— cette semaine</span>
      </div>

      <div className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="flex divide-x divide-border">
          <PlayerCard p={p1} weekly={w1} colorIndex={0} />

          {/* VS divider */}
          <div className="flex items-center justify-center px-2 bg-navy/5">
            <div className="flex flex-col items-center gap-1">
              <Swords size={16} className="text-brand" />
              <span className="text-[10px] font-black text-brand">VS</span>
            </div>
          </div>

          <PlayerCard p={p2} weekly={w2} colorIndex={1} />
        </div>

        {/* Weekly leader banner */}
        <div className="px-4 py-2 bg-navy/5 border-t border-border flex items-center gap-2">
          <Trophy size={12} className="text-gold" />
          <p className="text-[11px] font-semibold text-muted">
            En tête cette semaine : <span className="text-gold font-bold">{weeklyLeader}</span>
            {' '}(+{Math.max(w1?.weekly_xp ?? 0, w2?.weekly_xp ?? 0) - Math.min(w1?.weekly_xp ?? 0, w2?.weekly_xp ?? 0)} XP d&apos;écart)
          </p>
        </div>
      </div>
    </motion.div>
  )
}
