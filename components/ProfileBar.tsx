'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useProfile } from './ProfileContext'
import { getLevelInfo } from '@/lib/levels'

export default function ProfileBar() {
  const { profile } = useProfile()
  if (!profile) return null

  const { current, next, progress } = getLevelInfo(profile.total_xp)
  const hasStreak = profile.streak_days >= 1

  return (
    <div className="px-4 pt-2 pb-1">
      <div className="flex items-center gap-3 rounded-2xl bg-surface border border-border px-3 py-2.5">
        {/* Avatar / niveau */}
        <div
          className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-display font-bold text-white shadow-sm"
          style={{ background: current.color }}
        >
          {current.level}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-display font-bold text-text truncate">{current.title}</p>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {hasStreak && (
                <div className="flex items-center gap-0.5">
                  <Flame size={12} className="text-orange-500" />
                  <span className="text-xs font-bold text-orange-500">{profile.streak_days}</span>
                </div>
              )}
              <span className="text-[11px] text-muted tabular-nums">{profile.total_xp} XP</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: current.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          {next && (
            <p className="text-[10px] text-muted mt-0.5">
              → {next.title} dans {next.minXp - profile.total_xp} XP
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
