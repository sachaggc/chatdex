'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Clock, Zap } from 'lucide-react'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

interface NewsItem {
  id: string; content: string; is_auto: boolean
  expires_at: string | null; created_at: string
}

const DURATIONS = [
  { label: '1 jour',    days: 1    },
  { label: '3 jours',   days: 3    },
  { label: '1 semaine', days: 7    },
  { label: 'Permanent', days: null },
]

const EXAMPLES = [
  '🐾 EXCLUSIF : [Nom du chat] aperçu en flagrant délit de sieste rue Adis Abeba',
  '⚡ FLASH : alliance historique entre deux chats — la coalition tient !',
  '🎙️ TÉMOIGNAGE : un chat aurait miaulé en arabe classique selon un passant',
  '🏆 RECORD : [Nom du chat] bat le record de sightings hebdomadaires',
]

export default function NewsPage() {
  const router = useRouter()
  const [items, setItems]     = useState<NewsItem[]>([])
  const [content, setContent] = useState('')
  const [duration, setDuration] = useState<number | null>(3)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await fetch('/api/news').then(r => r.json())
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!content.trim()) return
    setSaving(true)
    await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim(), duration_days: duration }),
    })
    setContent('')
    await load()
    setSaving(false)
  }

  async function del(id: string) {
    await fetch('/api/news', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  // suppress unused router warning
  void router

  return (
    <div className="min-h-svh pb-28">
      <TopBar backHref="/" title="📺 Breaking News" />

      <div className="px-4 pt-5 space-y-5">

        {/* Explication */}
        <div className="rounded-2xl bg-navy/5 border border-navy/15 p-4">
          <p className="text-xs font-bold text-navy uppercase tracking-widest mb-1">Bandeau BFM Félitics</p>
          <p className="text-sm text-muted">Crée des breaking news qui s&apos;affichent en bas sur l&apos;écran d&apos;accueil. Elles disparaissent automatiquement à l&apos;expiration.</p>
        </div>

        {/* Exemples */}
        <div>
          <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">Idées ✨</p>
          <div className="space-y-1.5">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setContent(ex)}
                className="w-full text-left text-xs text-muted border border-dashed border-border rounded-xl px-3 py-2 hover:border-brand hover:text-text transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <p className="text-xs font-display font-bold text-muted uppercase tracking-widest">Nouvelle breaking news</p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            placeholder="🔴 BREAKING : ..."
            className="input-field resize-none text-sm"
          />

          {/* Durée */}
          <div>
            <p className="text-xs text-muted mb-1.5 flex items-center gap-1"><Clock size={11} /> Durée d&apos;affichage</p>
            <div className="flex gap-1.5 flex-wrap">
              {DURATIONS.map(d => (
                <button key={String(d.days)} onClick={() => setDuration(d.days)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                    duration === d.days ? 'bg-brand text-white border-brand' : 'bg-surface text-muted border-border'
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={add} disabled={saving || !content.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            <Zap size={14} />
            {saving ? 'Envoi…' : 'Diffuser sur le bandeau'}
          </button>
        </div>

        {/* News actuelles */}
        <div>
          <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-3">
            En cours ({items.filter(i => !i.is_auto).length})
          </p>

          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />)}
            </div>
          ) : items.filter(i => !i.is_auto).length === 0 ? (
            <p className="text-sm text-muted text-center py-6">Aucune breaking news en cours</p>
          ) : (
            <AnimatePresence>
              {items.filter(i => !i.is_auto).map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="flex items-start gap-3 rounded-xl bg-surface border border-border p-3 mb-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text leading-snug">{item.content}</p>
                    <p className="text-xs text-muted mt-1">
                      {item.expires_at
                        ? `Expire le ${new Date(item.expires_at).toLocaleDateString('fr-FR')}`
                        : 'Permanent'}
                    </p>
                  </div>
                  <button onClick={() => del(item.id)} className="text-muted hover:text-red-400 transition-colors shrink-0 mt-0.5">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
