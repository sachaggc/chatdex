'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { getLevelInfo, XpAction } from '@/lib/levels'

export interface Profile {
  id: string
  username: string
  total_xp: number
  level: number
  streak_days: number
  cats_discovered_count: number
  last_action_at: string | null
}

interface XpToast {
  id: number
  amount: number
  label: string
}

interface ProfileCtx {
  profile: Profile | null
  setProfile: (p: Profile | null) => void
  awardXp: (action: XpAction, cat_id?: string, meta?: Record<string, unknown>) => Promise<void>
  toasts: XpToast[]
}

const Ctx = createContext<ProfileCtx>({
  profile: null,
  setProfile: () => {},
  awardXp: async () => {},
  toasts: [],
})

const ACTION_LABELS: Record<XpAction, string> = {
  NEW_CAT:     'Nouveau chat découvert !',
  CHECKIN:     'Check-in effectué',
  NIGHT_PHOTO: 'Photo de nuit 🌙',
  NEW_STREET:  'Nouvelle rue explorée !',
  ANECDOTE:    'Murmure ajouté',
  MISSION:     'Mission accomplie !',
}

let toastCounter = 0

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null)
  const [toasts, setToasts] = useState<XpToast[]>([])
  const profileRef = useRef<Profile | null>(null)

  // Sync ref pour éviter les closures périmées
  profileRef.current = profile

  // Au montage : charge le profil depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatdex_username')
    if (!saved) return
    fetch('/api/profiles')
      .then(r => r.json())
      .then((list: Profile[]) => {
        const found = list.find(p => p.username === saved)
        if (found) setProfileState(found)
      })
      .catch(() => {})
  }, [])

  const setProfile = useCallback((p: Profile | null) => {
    setProfileState(p)
    if (p) localStorage.setItem('chatdex_username', p.username)
    else localStorage.removeItem('chatdex_username')
  }, [])

  const awardXp = useCallback(async (
    action: XpAction,
    cat_id?: string,
    meta?: Record<string, unknown>
  ) => {
    const p = profileRef.current
    if (!p) return

    try {
      const res = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: p.username, action, cat_id, meta }),
      })
      if (!res.ok) return
      const { new_xp, amount, level, streak } = await res.json()

      // Mise à jour locale du profil
      setProfileState(prev => prev ? { ...prev, total_xp: new_xp, level, streak_days: streak } : prev)

      // Toast XP
      const id = ++toastCounter
      setToasts(prev => [...prev, { id, amount, label: ACTION_LABELS[action] }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800)

      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30])
      }

      // ── Mission tracking ──────────────────────────────────────────────────
      if (action !== 'MISSION') {
        const today = new Date().toISOString().slice(0, 10)
        const { getDailyMissions, updateMissionProgress } = await import('@/lib/missions')
        const missions = getDailyMissions(today)
        const { newlyCompleted } = updateMissionProgress(p.username, today, action, missions)

        for (const mission of newlyCompleted) {
          // Mission toast (distinct style: gold)
          const mId = ++toastCounter
          setToasts(prev => [...prev, { id: mId, amount: mission.xpReward, label: `🎯 Mission : ${mission.label}` }])
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== mId)), 4000)

          // Vibration spéciale
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 30, 50, 30, 100])
          }

          // Award bonus XP for mission completion
          fetch('/api/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: p.username,
              action: 'MISSION',
              meta: { customAmount: mission.xpReward, missionId: mission.id },
            }),
          }).then(r => r.json()).then(({ new_xp: nx, level: lv, streak: st }) => {
            setProfileState(prev => prev ? { ...prev, total_xp: nx, level: lv, streak_days: st } : prev)
          }).catch(() => {})
        }
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <Ctx.Provider value={{ profile, setProfile, awardXp, toasts }}>
      {children}

      {/* ── XP Toasts ── */}
      <div className="fixed bottom-24 inset-x-0 flex flex-col items-center gap-2 pointer-events-none z-[9999]">
        {toasts.map(t => {
          const isMission = t.label.startsWith('🎯')
          return (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
              style={{
                background: isMission ? '#C98A2F' : '#C34B32',
                animation: `xpToast ${isMission ? '4' : '2.8'}s ease forwards`,
              }}
            >
              <span className="text-white font-display font-bold text-sm">+{t.amount} XP</span>
              <span className="text-white/80 text-xs">{t.label}</span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes xpToast {
          0%   { opacity: 0; transform: translateY(12px) scale(0.9); }
          15%  { opacity: 1; transform: translateY(0)    scale(1);   }
          75%  { opacity: 1; transform: translateY(0)    scale(1);   }
          100% { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
      `}</style>
    </Ctx.Provider>
  )
}

export function useProfile() {
  return useContext(Ctx)
}
