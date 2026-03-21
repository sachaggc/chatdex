'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cat } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import GeocodingInput from '@/components/GeocodingInput'
import TopBar from '@/components/TopBar'
import { findMatches, MatchResult } from '@/lib/catMatcher'

interface Category { key: string; label: string; color: string }

type Step = 'photo' | 'select' | 'new-cat-form'

// Couleur selon le score de confiance
function confidenceColor(c: number) {
  if (c >= 0.88) return { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  bar: 'bg-green-400' }
  if (c >= 0.78) return { bg: 'bg-teal/5',    border: 'border-teal/25',    text: 'text-teal',       bar: 'bg-teal' }
  return              { bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  bar: 'bg-amber-400' }
}

export default function CapturePage() {
  const router = useRouter()
  const [cats, setCats]             = useState<Cat[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep]             = useState<Step>('photo')
  const [photoFile, setPhotoFile]   = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [gps, setGps]               = useState<{ lat: number; lng: number } | null>(null)
  const [photoDate, setPhotoDate]   = useState<Date | null>(null)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [street, setStreet]         = useState('')
  const [notes, setNotes]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  // Suggestions locales (plusieurs résultats)
  const [suggestions, setSuggestions] = useState<MatchResult[]>([])
  const [matchLoading, setMatchLoading] = useState(false)

  // Champs nouveau chat (inline)
  const [newName, setNewName]         = useState('')
  const [newCategory, setNewCategory] = useState('')

  // Ref pour éviter la race condition : cats peut être vide au moment du match
  const catsRef = useRef<Cat[]>([])

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then(data => { setCats(data); catsRef.current = data }).catch(() => {})
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [])

  async function runMatching(file: File) {
    const catList = catsRef.current
    if (catList.length === 0) return
    setMatchLoading(true)
    try {
      const matches = await findMatches(file, catList)
      setSuggestions(matches)
      // Pré-sélectionner le meilleur si score ≥ 85%
      if (matches[0]?.confidence >= 0.85) setSelectedCat(matches[0].id)
    } catch { /* ignore */ } finally {
      setMatchLoading(false)
    }
  }

  function handleImageReady(file: File, exifGps: { lat: number; lng: number } | null, date: Date | null) {
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setPhotoDate(date)
    if (exifGps) {
      setGps(exifGps)
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 6000, enableHighAccuracy: true }
      )
    }
    setStep('select')
    runMatching(file)
  }

  async function uploadPhoto(file: File): Promise<string> {
    const fd = new FormData(); fd.append('file', file)
    const up = await fetch('/api/upload', { method: 'POST', body: fd })
    if (up.status === 401) throw new Error('Non connecté — va dans Réglages pour te connecter')
    if (!up.ok) { const e = await up.json().catch(() => ({})); throw new Error(e.error ?? 'Erreur upload photo') }
    const { url } = await up.json()
    return url
  }

  async function submit(catId: string) {
    if (!photoFile) return
    setLoading(true); setError('')
    try {
      const url = await uploadPhoto(photoFile)

      const sr = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: catId, photo_url: url,
          lat: gps?.lat ?? null, lng: gps?.lng ?? null,
          street: street.trim() || null,
          notes: notes.trim() || null,
          seen_at: photoDate?.toISOString() ?? new Date().toISOString(),
        }),
      })
      if (sr.status === 401) throw new Error('Non connecté — va dans Réglages pour te connecter')
      if (!sr.ok) { const e = await sr.json().catch(() => ({})); throw new Error(e.error ?? 'Erreur enregistrement') }
      router.push(`/cats/${catId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  async function submitNewCat() {
    if (!newName.trim() || !photoFile) return
    setLoading(true); setError('')
    try {
      const url = await uploadPhoto(photoFile)

      const catRes = await fetch('/api/cats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), category: newCategory || null, main_photo_url: url }),
      })
      if (catRes.status === 401) throw new Error('Non connecté — va dans Réglages pour te connecter')
      if (!catRes.ok) { const e = await catRes.json().catch(() => ({})); throw new Error(e.error ?? 'Erreur création chat') }
      const newCat = await catRes.json()

      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: newCat.id, photo_url: url,
          lat: gps?.lat ?? null, lng: gps?.lng ?? null,
          street: street.trim() || null,
          notes: notes.trim() || null,
          seen_at: photoDate?.toISOString() ?? new Date().toISOString(),
        }),
      })
      router.push(`/cats/${newCat.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  // IDs des chats suggérés (pour les remonter en tête dans la liste complète)
  const suggestionIds = new Set(suggestions.map(s => s.id))
  const sortedCats = [
    ...cats.filter(c => suggestionIds.has(c.id)),
    ...cats.filter(c => !suggestionIds.has(c.id)),
  ]

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref="/" title="Capture rapide" />

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">

        {/* Étape 1 : Photo */}
        {step === 'photo' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="py-2">
              <p className="font-display font-bold text-xl text-text">Tu viens de voir un chat ?</p>
              <p className="text-muted text-sm mt-1">Prends ou importe une photo pour commencer.</p>
            </div>
            <ImageUpload onImageReady={handleImageReady} />
          </motion.div>
        )}

        {/* Étapes 2 et 3 */}
        {(step === 'select' || step === 'new-cat-form') && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Miniature */}
            {previewUrl && (
              <div className="relative h-40 rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Photo" className="w-full h-full object-cover" />
                {gps && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-white text-xs font-semibold">
                    <CheckCircle size={11} /> GPS détecté
                  </div>
                )}
                {photoDate && (
                  <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-white text-xs">
                    {photoDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            )}

            {/* Géocodage */}
            <GeocodingInput
              label="Lieu (optionnel)"
              value={street}
              onChange={setStreet}
              onGeocode={(lat, lng) => setGps({ lat, lng })}
              placeholder="Rue, quartier de Rabat…"
            />

            {/* Sélection chat */}
            {step === 'select' && (
              <div className="space-y-4">
                <p className="font-display font-bold text-lg text-text">C&apos;est quel chat ?</p>

                {/* ── Bloc suggestions ───────────────────────────────────── */}
                <AnimatePresence>
                  {(matchLoading || suggestions.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-xl border border-border overflow-hidden"
                    >
                      {/* En-tête */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-border">
                        <Sparkles size={13} className="text-teal" />
                        <span className="text-xs font-display font-bold text-text">
                          {matchLoading ? 'Analyse de la robe…' : `${suggestions.length} ressemblance${suggestions.length > 1 ? 's' : ''} détectée${suggestions.length > 1 ? 's' : ''}`}
                        </span>
                        {matchLoading && (
                          <div className="ml-auto h-3 w-3 rounded-full border-2 border-teal border-t-transparent animate-spin" />
                        )}
                      </div>

                      {/* Liste des suggestions */}
                      {suggestions.length > 0 && (
                        <div className="divide-y divide-border">
                          {suggestions.map((s, i) => {
                            const colors = confidenceColor(s.confidence)
                            const pct = Math.round(s.confidence * 100)
                            const catData = cats.find(c => c.id === s.id)
                            const isSelected = selectedCat === s.id

                            return (
                              <motion.button
                                key={s.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                onClick={() => setSelectedCat(isSelected ? null : s.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                  isSelected ? 'bg-teal/8' : 'bg-surface hover:bg-parchment/50'
                                }`}
                              >
                                {/* Photo miniature */}
                                <div className="relative h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-parchment">
                                  {catData?.main_photo_url
                                    ? <Image src={catData.main_photo_url} alt={s.name} fill className="object-cover" />
                                    : <div className="h-full w-full bg-parchment" />
                                  }
                                </div>

                                {/* Nom + barre */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-display font-semibold text-sm text-text truncate">{s.name}</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${colors.bar} transition-all`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold tabular-nums ${colors.text}`}>{pct}%</span>
                                  </div>
                                </div>

                                {/* Checkmark si sélectionné */}
                                <div className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected ? 'bg-teal border-teal' : 'border-border'
                                }`}>
                                  {isSelected && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      )}

                      {/* Aucune ressemblance trouvée */}
                      {!matchLoading && suggestions.length === 0 && (
                        <p className="px-3 py-2.5 text-xs text-muted">
                          Aucune ressemblance significative trouvée — probablement un nouveau chat.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Boutons nouveau / à nommer ─────────────────────────── */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('new-cat-form')}
                    className="flex flex-1 items-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 p-3 text-brand hover:bg-brand/10 transition-colors font-display font-semibold text-sm"
                  >
                    <span className="text-lg">+</span> Nouveau chat
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true); setError('')
                      try {
                        const url = await uploadPhoto(photoFile!)
                        const catRes = await fetch('/api/cats', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ unnamed: true, main_photo_url: url }),
                        })
                        if (catRes.status === 401) throw new Error('Non connecté — va dans Réglages pour te connecter')
                        if (!catRes.ok) { const e = await catRes.json().catch(() => ({})); throw new Error(e.error ?? 'Erreur création chat') }
                        const newCat = await catRes.json()
                        if (!newCat.id) throw new Error('Réponse inattendue du serveur')
                        await fetch('/api/sightings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ cat_id: newCat.id, photo_url: url, lat: gps?.lat ?? null, lng: gps?.lng ?? null, street: street.trim() || null, seen_at: photoDate?.toISOString() ?? new Date().toISOString() }),
                        })
                        router.push(`/cats/${newCat.id}/edit`)
                      } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); setLoading(false) }
                    }}
                    disabled={loading}
                    className="flex flex-1 items-center gap-2 rounded-xl border-2 border-dashed border-gold/50 bg-gold/5 p-3 text-gold hover:bg-gold/10 transition-colors font-display font-semibold text-sm disabled:opacity-40"
                  >
                    <span className="text-lg">?</span> À nommer
                  </button>
                </div>

                {/* ── Liste complète ─────────────────────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                    Tous les chats
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {sortedCats.map(cat => {
                      const suggestion = suggestions.find(s => s.id === cat.id)
                      const isSelected = selectedCat === cat.id
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCat(isSelected ? null : cat.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                            isSelected ? 'border-brand bg-brand/5' : 'border-border bg-surface hover:border-brand/30'
                          }`}
                        >
                          <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-parchment">
                            {cat.main_photo_url
                              ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                              : <div className="flex h-full items-center justify-center opacity-20 text-xl">🐱</div>
                            }
                          </div>
                          <span className="font-display font-semibold text-text flex-1">{cat.name}</span>
                          {suggestion && (
                            <span className="text-xs font-bold text-teal tabular-nums">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          )}
                          {isSelected && <ArrowRight size={16} className="text-brand shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Valider ────────────────────────────────────────────── */}
                {selectedCat && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-text mb-1">Notes (optionnel)</label>
                      <input type="text" placeholder="Il dormait sur une voiture…" value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                    <button onClick={() => submit(selectedCat)} disabled={loading} className="btn-primary w-full">
                      {loading ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Formulaire nouveau chat */}
            {step === 'new-cat-form' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep('select')} className="text-muted text-sm hover:text-text">← Retour</button>
                  <p className="font-display font-bold text-text">Nouveau chat</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Nom <span className="text-brand">*</span></label>
                  <input type="text" placeholder="Ex: Le Gros Roux, Whiskers…" value={newName} onChange={e => setNewName(e.target.value)} className="input-field" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Catégorie</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(c => (
                      <button key={c.key} type="button" onClick={() => setNewCategory(newCategory === c.key ? '' : c.key)}
                        className="rounded-xl border-2 px-3 py-2 text-sm font-display font-semibold text-left transition-all"
                        style={newCategory === c.key
                          ? { background: c.color, borderColor: c.color, color: 'white' }
                          : { borderColor: '#DFC9AE', color: '#7A6352' }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Notes (optionnel)</label>
                  <input type="text" placeholder="Première impression…" value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
                </div>
                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                <button onClick={submitNewCat} disabled={loading || !newName.trim()} className="btn-primary w-full disabled:opacity-40">
                  {loading ? 'Enregistrement…' : 'Créer et enregistrer'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
