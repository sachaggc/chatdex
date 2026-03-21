'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile, Profile } from './ProfileContext'

const AVATARS: Record<string, string> = {
  Sacha:   '🧑‍💻',
  Antoine: '🎮',
}

export default function ProfilePicker() {
  const { profile, setProfile } = useProfile()
  const [show, setShow] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Afficher le picker seulement si pas de profil en localStorage
    const saved = localStorage.getItem('chatdex_username')
    if (!saved) setShow(true)
  }, [])

  useEffect(() => {
    if (!show) return
    fetch('/api/profiles').then(r => r.json()).then(setProfiles).catch(() => {})
  }, [show])

  async function pick(username: string) {
    setLoading(true)
    try {
      // Crée le profil s'il n'existe pas encore
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      if (res.ok) {
        const p = await res.json()
        setProfile(p)
        setShow(false)
      } else {
        // Essaie de le trouver dans la liste
        const found = profiles.find(p => p.username === username)
        if (found) { setProfile(found); setShow(false) }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  if (profile || !show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl border border-border"
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🐱</div>
            <h2 className="font-display font-bold text-xl text-text">Qui es-tu ?</h2>
            <p className="text-sm text-muted mt-1">Choisis ton profil pour gagner de l&apos;XP</p>
          </div>

          <div className="space-y-3">
            {['Sacha', 'Antoine'].map(name => (
              <button
                key={name}
                onClick={() => pick(name)}
                disabled={loading}
                className="w-full flex items-center gap-4 rounded-2xl border-2 border-border bg-parchment/50 hover:border-brand hover:bg-brand/5 transition-all p-4 text-left group"
              >
                <span className="text-3xl">{AVATARS[name]}</span>
                <div>
                  <p className="font-display font-bold text-text group-hover:text-brand transition-colors">{name}</p>
                  {profiles.find(p => p.username === name) && (
                    <p className="text-xs text-muted">
                      Niveau {profiles.find(p => p.username === name)!.level} · {profiles.find(p => p.username === name)!.total_xp} XP
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
