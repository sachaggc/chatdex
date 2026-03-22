'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { getDailyMissions, getMissionState, Mission, MissionState } from '@/lib/missions'
import { useProfile } from '@/components/ProfileContext'

export default function DailyMissions() {
  const { profile } = useProfile()
  const [open, setOpen] = useState(true)
  const [missions, setMissions] = useState<Mission[]>([])
  const [missionState, setMissionState] = useState<MissionState>({ progress: {}, completed: [] })

  const today = new Date().toISOString().slice(0, 10)

  const refresh = useCallback(() => {
    const m = getDailyMissions(today)
    setMissions(m)
    if (profile?.username) {
      setMissionState(getMissionState(profile.username, today))
    }
  }, [today, profile?.username])

  useEffect(() => {
    refresh()
    // Re-check on window focus (after user logs a cat in another tab)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  // Also refresh when profile changes (after awardXp fires)
  useEffect(() => { refresh() }, [profile, refresh])

  if (!profile || missions.length === 0) return null

  const completedCount = missionState.completed.length
  const allDone = completedCount >= missions.length

  return (
    <div className="px-4 pt-2 pb-1">
      <div className="rounded-2xl bg-surface border border-border overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        >
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-sm"
            style={{ background: allDone ? '#C98A2F20' : '#1B2D4A15' }}
          >
            {allDone ? '🏅' : '🎯'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-bold text-text">
              Missions du jour
            </p>
            <p className="text-[10px] text-muted">
              {allDone
                ? '✅ Toutes accomplies — bravo !'
                : `${completedCount}/${missions.length} accomplie${completedCount > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Progress pills */}
          <div className="flex items-center gap-1 mr-1">
            {missions.map(m => (
              <div
                key={m.id}
                className="h-2 w-2 rounded-full transition-colors"
                style={{ background: missionState.completed.includes(m.id) ? '#C98A2F' : '#DFC9AE' }}
              />
            ))}
          </div>

          {open ? <ChevronUp size={14} className="text-muted shrink-0" /> : <ChevronDown size={14} className="text-muted shrink-0" />}
        </button>

        {/* Mission list */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="divide-y divide-border/50 border-t border-border/50">
                {missions.map(m => {
                  const done = missionState.completed.includes(m.id)
                  const progress = missionState.progress[m.id] ?? 0
                  const pct = Math.min((progress / m.target) * 100, 100)

                  return (
                    <div key={m.id} className="px-3 py-2.5 flex items-center gap-3">
                      <span className="text-xl leading-none shrink-0">{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-xs font-semibold ${done ? 'text-muted line-through' : 'text-text'}`}>
                            {m.label}
                          </p>
                          <span className="text-[10px] font-bold text-gold shrink-0 ml-2">
                            +{m.xpReward} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Progress bar */}
                          <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: done ? '#C98A2F' : '#1B2D4A' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-[10px] text-muted shrink-0 tabular-nums">
                            {done ? '✓' : `${progress}/${m.target}`}
                          </span>
                        </div>
                        {!done && (
                          <p className="text-[10px] text-muted mt-0.5">{m.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {allDone && (
                <div className="px-3 py-2.5 bg-gold/8 border-t border-gold/20 flex items-center gap-2">
                  <Trophy size={13} className="text-gold shrink-0" />
                  <p className="text-[11px] font-semibold text-gold">
                    Journée parfaite ! Reviens demain pour 3 nouvelles missions.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
