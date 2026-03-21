'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { useProfile } from './ProfileContext'

interface Anecdote {
  id: string
  cat_id: string
  username: string
  text: string
  created_at: string
}

const AVATAR_EMOJI: Record<string, string> = {
  Sacha:   '🧑‍💻',
  Antoine: '🎮',
}

export default function GossipBox({ catId }: { catId: string }) {
  const { profile, awardXp } = useProfile()
  const [anecdotes, setAnecdotes] = useState<Anecdote[]>([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch(`/api/anecdotes?cat_id=${catId}`)
      .then(r => r.json())
      .then(setAnecdotes)
      .catch(() => {})
  }, [catId])

  async function post() {
    if (!text.trim() || !profile) return
    setPosting(true)
    try {
      const res = await fetch('/api/anecdotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cat_id: catId, username: profile.username, text }),
      })
      if (res.ok) {
        const a = await res.json()
        setAnecdotes(prev => [a, ...prev])
        setText('')
        awardXp('ANECDOTE', catId)
      }
    } catch { /* ignore */ }
    setPosting(false)
  }

  async function deleteAnecdote(id: string) {
    const res = await fetch(`/api/anecdotes?id=${id}`, { method: 'DELETE' })
    if (res.ok) setAnecdotes(prev => prev.filter(a => a.id !== id))
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={14} className="text-brand" />
        <p className="text-[11px] font-display font-bold text-muted uppercase tracking-widest">Murmures de la Rue</p>
      </div>

      {/* Formulaire */}
      {profile ? (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Une anecdote sur ce chat…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && post()}
            className="input-field flex-1 text-sm py-2.5"
          />
          <button
            onClick={post}
            disabled={posting || !text.trim()}
            className="btn-primary px-4 py-2.5 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted mb-3 italic">Choisis un profil pour ajouter un murmure</p>
      )}

      {/* Liste */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden divide-y divide-border">
        <AnimatePresence>
          {anecdotes.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 px-4 py-3"
            >
              <span className="text-lg shrink-0">{AVATAR_EMOJI[a.username] ?? '🐱'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-text">{a.username}</span>
                  <span className="text-[10px] text-muted">
                    {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-sm text-text/80 leading-relaxed">{a.text}</p>
              </div>
              {profile?.username === a.username && (
                <button
                  onClick={() => deleteAnecdote(a.id)}
                  className="text-border hover:text-red-500 transition-colors shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {anecdotes.length === 0 && (
          <p className="px-4 py-4 text-sm text-muted italic">Pas encore de murmures… sois le premier !</p>
        )}
      </div>
    </section>
  )
}
