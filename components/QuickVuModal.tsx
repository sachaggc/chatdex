'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Eye, Search, Check } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cat } from '@/types'
import { useProfile } from '@/components/ProfileContext'

interface Props {
  open: boolean
  onClose: () => void
}

export default function QuickVuModal({ open, onClose }: Props) {
  const { awardXp } = useProfile()
  const [cats, setCats]     = useState<Cat[]>([])
  const [search, setSearch] = useState('')
  const [done, setDone]     = useState<string | null>(null) // cat id just registered
  const [loading, setLoading] = useState<string | null>(null) // cat id being submitted
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      fetch('/api/cats').then(r => r.json()).then((d: Cat[]) => {
        setCats(d.filter(c => !c.unnamed))
      }).catch(() => {})
      setSearch('')
      setDone(null)
      setTimeout(() => searchRef.current?.focus(), 200)
    }
  }, [open])

  const filtered = cats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  async function quickVu(cat: Cat) {
    if (loading) return
    setLoading(cat.id)
    try {
      let lat: number | null = null
      let lng: number | null = null
      // Géoloc rapide (on n'attend pas trop)
      await new Promise<void>(resolve => {
        if (!navigator.geolocation) { resolve(); return }
        const t = setTimeout(resolve, 3000)
        navigator.geolocation.getCurrentPosition(
          pos => { lat = pos.coords.latitude; lng = pos.coords.longitude; clearTimeout(t); resolve() },
          () => { clearTimeout(t); resolve() },
          { timeout: 3000, enableHighAccuracy: false }
        )
      })
      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cat_id: cat.id, lat, lng, seen_at: new Date().toISOString() }),
      })
      awardXp('CHECKIN', cat.id)
      if (navigator.vibrate) navigator.vibrate([30, 10, 60])
      setDone(cat.id)
      setTimeout(() => {
        setDone(null)
        onClose()
      }, 1200)
    } catch { /* ignore */ }
    finally { setLoading(null) }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fond */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[201] bg-cream rounded-t-3xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ maxHeight: '80dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-brand" />
                <p className="font-display font-bold text-text text-base">Vu rapide</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-surface hover:bg-border transition-colors">
                <X size={16} className="text-muted" />
              </button>
            </div>

            {/* Recherche */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Rechercher un chat…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-text placeholder-muted focus:outline-none focus:border-brand/50"
                />
              </div>
            </div>

            {/* Grille chats */}
            <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: 'calc(80dvh - 140px)' }}>
              {filtered.length === 0 ? (
                <p className="text-center text-muted text-sm py-10">Aucun chat trouvé</p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {filtered.map(cat => {
                    const isDone    = done === cat.id
                    const isLoading = loading === cat.id
                    return (
                      <motion.button
                        key={cat.id}
                        onClick={() => quickVu(cat)}
                        disabled={!!loading || !!done}
                        whileTap={{ scale: 0.94 }}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                          isDone ? 'border-teal shadow-lg shadow-teal/20' : 'border-border hover:border-brand/40'
                        }`}
                      >
                        {/* Photo */}
                        <div className="aspect-square relative bg-parchment">
                          {cat.main_photo_url
                            ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" sizes="120px" />
                            : <div className="h-full flex items-center justify-center text-2xl opacity-20">🐱</div>
                          }
                          {(isLoading || isDone) && (
                            <div className={`absolute inset-0 flex items-center justify-center ${isDone ? 'bg-teal/70' : 'bg-black/30'}`}>
                              {isDone
                                ? <Check size={28} className="text-white" strokeWidth={3} />
                                : <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              }
                            </div>
                          )}
                        </div>
                        {/* Nom */}
                        <div className="p-1.5 bg-surface">
                          <p className="text-[11px] font-display font-bold text-text truncate text-center leading-tight">{cat.name}</p>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
