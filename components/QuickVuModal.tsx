'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Eye, Search, MapPin } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cat } from '@/types'
import { useProfile } from '@/components/ProfileContext'
import CatchAnimation from './CatchAnimation'
import { getRarity } from '@/lib/rarity'

interface Props {
  open: boolean
  onClose: () => void
}

export default function QuickVuModal({ open, onClose }: Props) {
  const { awardXp } = useProfile()
  const [cats, setCats]     = useState<Cat[]>([])
  const [search, setSearch] = useState('')
  // Map catId → timestamp du dernier tap (pour l'animation)
  const [tapped, setTapped] = useState<Record<string, number>>({})
  const [sessionCount, setSessionCount] = useState(0)
  const [gpsOk, setGpsOk] = useState<boolean | null>(null) // null = en cours
  const [catchAnim, setCatchAnim] = useState<{ active: boolean; rarityLevel?: number; catName?: string }>({ active: false })

  // GPS en continu — on garde la position la plus récente
  const posRef = useRef<{ lat: number; lng: number } | null>(null)
  const watchRef = useRef<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Démarre/arrête le watch GPS quand le modal s'ouvre/ferme
  useEffect(() => {
    if (!open) {
      if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current)
      watchRef.current = null
      posRef.current = null
      setGpsOk(null)
      setSearch('')
      setTapped({})
      setSessionCount(0)
      return
    }

    // Fetch cats
    fetch('/api/cats').then(r => r.json()).then((d: Cat[]) => {
      setCats(d.filter(c => !c.unnamed))
    }).catch(() => {})

    // GPS watch continu
    if (navigator.geolocation) {
      setGpsOk(null)
      watchRef.current = navigator.geolocation.watchPosition(
        pos => {
          posRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setGpsOk(true)
        },
        () => setGpsOk(false),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      )
    } else {
      setGpsOk(false)
    }

    setTimeout(() => searchRef.current?.focus(), 250)
  }, [open])

  const logVu = useCallback(async (cat: Cat) => {
    const now = Date.now()
    // Anti-double-tap : ignore si tapé il y a moins de 1.5s
    if (tapped[cat.id] && now - tapped[cat.id] < 1500) return

    setTapped(prev => ({ ...prev, [cat.id]: now }))
    setSessionCount(prev => prev + 1)
    if (navigator.vibrate) navigator.vibrate(40)

    const pos = posRef.current
    try {
      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: cat.id,
          lat: pos?.lat ?? null,
          lng: pos?.lng ?? null,
          seen_at: new Date().toISOString(),
        }),
      })
      awardXp('CHECKIN', cat.id)
      // Trigger catch animation based on cat rarity
      const rarity = getRarity(Number(cat.sightings_count ?? 0))
      setCatchAnim({ active: true, rarityLevel: rarity.level, catName: cat.name })
    } catch { /* ignore — on réessaie pas, c'est du vu rapide */ }
  }, [tapped, awardXp])

  const filtered = cats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col bg-navy"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-12 pb-3 shrink-0">
            <div className="flex-1 flex items-center gap-2">
              <Eye size={20} className="text-gold" />
              <p className="font-display font-bold text-white text-lg">Vu rapide</p>
              {sessionCount > 0 && (
                <motion.span
                  key={sessionCount}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-full bg-teal text-white text-xs font-bold px-2 py-0.5 font-display"
                >
                  {sessionCount} enregistré{sessionCount > 1 ? 's' : ''}
                </motion.span>
              )}
            </div>

            {/* GPS status */}
            <div className="flex items-center gap-1.5 mr-1">
              <MapPin size={13} className={
                gpsOk === true  ? 'text-teal' :
                gpsOk === false ? 'text-white/30' : 'text-amber-400'
              } />
              <span className={`text-[11px] font-semibold ${
                gpsOk === true  ? 'text-teal' :
                gpsOk === false ? 'text-white/30' : 'text-amber-400 animate-pulse'
              }`}>
                {gpsOk === true ? 'GPS OK' : gpsOk === false ? 'sans GPS' : 'GPS…'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Recherche */}
          <div className="px-4 pb-3 shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Filtrer les chats…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10 text-sm focus:outline-none focus:bg-white/15"
              />
            </div>
          </div>

          {/* Grille chats — plein écran scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {filtered.length === 0 ? (
              <p className="text-center text-white/40 text-sm py-16">Aucun chat trouvé</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map(cat => {
                  const lastTap  = tapped[cat.id] ?? 0
                  const isRecent = Date.now() - lastTap < 1500

                  return (
                    <motion.button
                      key={cat.id}
                      onClick={() => logVu(cat)}
                      whileTap={{ scale: 0.93 }}
                      className="relative rounded-2xl overflow-hidden border-2 transition-colors text-left"
                      style={{ borderColor: isRecent ? 'rgb(56 178 172)' : 'rgba(255,255,255,0.1)' }}
                    >
                      {/* Photo */}
                      <div className="aspect-[4/3] relative bg-navy/50">
                        {cat.main_photo_url
                          ? <Image
                              src={cat.main_photo_url}
                              alt={cat.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 45vw, 200px"
                            />
                          : <div className="h-full flex items-center justify-center text-3xl opacity-20">🐱</div>
                        }

                        {/* Flash "enregistré" */}
                        <AnimatePresence>
                          {isRecent && (
                            <motion.div
                              key={lastTap}
                              initial={{ opacity: 0.9 }}
                              animate={{ opacity: 0 }}
                              transition={{ duration: 1.2 }}
                              className="absolute inset-0 flex items-center justify-center bg-teal/60"
                            >
                              <motion.span
                                initial={{ scale: 0.5, opacity: 1 }}
                                animate={{ scale: 1.2, opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-4xl"
                              >
                                ✓
                              </motion.span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Nom */}
                      <div className="px-2.5 py-2 bg-white/5">
                        <p className="font-display font-bold text-white text-sm truncate">{cat.name}</p>
                        {lastTap > 0 && (
                          <p className="text-[10px] text-teal font-semibold mt-0.5">
                            {new Date(lastTap).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          <CatchAnimation
            active={catchAnim.active}
            onDone={() => setCatchAnim({ active: false })}
            rarityLevel={catchAnim.rarityLevel}
            catName={catchAnim.catName}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
