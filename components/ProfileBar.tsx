'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useProfile } from './ProfileContext'
import { getLevelInfo } from '@/lib/levels'

export default function ProfileBar() {
  const { profile } = useProfile()
  if (!profile) return null

  const { current, next, progress } = getLevelInfo(profile.total_xp)
  const today = new Date().toISOString().slice(0, 10)
  const lastActionDay = profile.last_action_at
    ? new Date(profile.last_action_at).toISOString().slice(0, 10)
    : null
  const hour = new Date().getHours()

  const hasStreak   = profile.streak_days >= 1
  const loggedToday = lastActionDay === today
  const streakDanger = hasStreak && !loggedToday && hour >= 18

  return (
    <div className="px-4 pt-2 pb-1">
      {/* Streak danger banner */}
      {streakDanger && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 rounded-xl px-3 py-2 flex items-center gap-2"
          style={{ background: '#f975001a', border: '1px solid #f9750040' }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          >
            <Flame size={15} className="text-orange-500 shrink-0" />
          </motion.div>
          <p className="text-xs font-semibold" style={{ color: '#c2580a' }}>
            Ta streak <span className="font-black">{profile.streak_days}j</span> est en danger ! Logge un chat ce soir.
          </p>
        </motion.div>
      )}

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
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {/* Streak badge — larger and more prominent */}
              {hasStreak && (
                <motion.div
                  className="flex items-center gap-0.5 rounded-full px-2 py-0.5"
                  style={{
                    background: streakDanger ? '#f975001a' : '#f975000d',
                    border: `1px solid ${streakDanger ? '#f9750060' : '#f9750030'}`,
                  }}
                  animate={streakDanger ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Flame size={11} style={{ color: streakDanger ? '#ea580c' : '#f97316' }} />
                  <span
                    className="text-xs font-black tabular-nums"
                    style={{ color: streakDanger ? '#ea580c' : '#f97316' }}
                  >
                    {profile.streak_days}
                  </span>
                </motion.div>
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
