'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { Cat } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import GeocodingInput from '@/components/GeocodingInput'
import TopBar from '@/components/TopBar'

interface Category { key: string; label: string; color: string }

type Step = 'photo' | 'select' | 'new-cat-form'

export default function CapturePage() {
  const router = useRouter()
  const [cats, setCats]         = useState<Cat[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep]         = useState<Step>('photo')
  const [photoFile, setPhotoFile]   = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [gps, setGps]           = useState<{ lat: number; lng: number } | null>(null)
  const [photoDate, setPhotoDate]   = useState<Date | null>(null)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [street, setStreet]     = useState('')
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Champs nouveau chat (inline)
  const [newName, setNewName]         = useState('')
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then(setCats).catch(() => {})
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [])

  function handleImageReady(file: File, exifGps: { lat: number; lng: number } | null, date: Date | null) {
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setPhotoDate(date)
    if (exifGps) {
      setGps(exifGps)
    } else if (navigator.geolocation) {
      // Essaie le GPS du navigateur si pas dans l'EXIF
      navigator.geolocation.getCurrentPosition(
        pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 6000, enableHighAccuracy: true }
      )
    }
    setStep('select')
  }

  async function submit(catId: string) {
    if (!photoFile) return
    setLoading(true); setError('')
    try {
      const fd = new FormData(); fd.append('file', photoFile)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('Erreur upload')
      const { url } = await up.json()

      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: catId,
          photo_url: url,
          lat: gps?.lat ?? null,
          lng: gps?.lng ?? null,
          street: street.trim() || null,
          notes: notes.trim() || null,
          seen_at: photoDate?.toISOString() ?? new Date().toISOString(),
        }),
      })
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
      // Upload photo
      const fd = new FormData(); fd.append('file', photoFile)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('Erreur upload')
      const { url } = await up.json()

      // Crée le chat
      const catRes = await fetch('/api/cats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory || null,
          main_photo_url: url,
        }),
      })
      if (!catRes.ok) throw new Error('Erreur création chat')
      const newCat = await catRes.json()

      // Crée la première observation
      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: newCat.id,
          photo_url: url,
          lat: gps?.lat ?? null,
          lng: gps?.lng ?? null,
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

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref="/" title="Capture rapide" />

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">

        {/* Étape 1 : Photo */}
        {step === 'photo' && (
          <>
            <div className="py-2">
              <p className="font-display font-bold text-xl text-text">Tu viens de voir un chat ?</p>
              <p className="text-muted text-sm mt-1">Prends ou importe une photo pour commencer.</p>
            </div>
            <ImageUpload onImageReady={handleImageReady} />
          </>
        )}

        {/* Étapes 2 et 3 : Chat + détails */}
        {(step === 'select' || step === 'new-cat-form') && (
          <>
            {/* Miniature de la photo */}
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

            {/* Choisir un chat existant */}
            {step === 'select' && (
              <div>
                <p className="font-display font-bold text-lg text-text mb-3">C&apos;est quel chat ?</p>

                {/* Nouveau chat (inline) */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setStep('new-cat-form')}
                    className="flex flex-1 items-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 p-3 text-brand hover:bg-brand/10 transition-colors font-display font-semibold text-sm"
                  >
                    <span className="text-lg">+</span> Nouveau chat
                  </button>
                  {/* À nommer */}
                  <button
                    onClick={async () => {
                      setLoading(true); setError('')
                      try {
                        const fd = new FormData(); fd.append('file', photoFile!)
                        const up = await fetch('/api/upload', { method: 'POST', body: fd })
                        if (!up.ok) throw new Error('Erreur upload')
                        const { url } = await up.json()
                        const catRes = await fetch('/api/cats', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ unnamed: true, main_photo_url: url }),
                        })
                        const newCat = await catRes.json()
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

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cats.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                        selectedCat === cat.id ? 'border-brand bg-brand/5' : 'border-border bg-surface hover:border-brand/30'
                      }`}
                    >
                      <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-parchment">
                        {cat.main_photo_url
                          ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                          : <div className="flex h-full items-center justify-center opacity-20 text-xl">🐱</div>
                        }
                      </div>
                      <span className="font-display font-semibold text-text flex-1">{cat.name}</span>
                      {selectedCat === cat.id && <ArrowRight size={16} className="text-brand" />}
                    </button>
                  ))}
                </div>

                {selectedCat && (
                  <>
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-text mb-1">Notes (optionnel)</label>
                      <input type="text" placeholder="Il dormait sur une voiture…" value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium mt-2">{error}</p>}
                    <button onClick={() => submit(selectedCat)} disabled={loading} className="btn-primary w-full mt-3">
                      {loading ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Formulaire nouveau chat (inline) */}
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
                          : { borderColor: '#DFC9AE', color: '#7A6352' }
                        }>
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
          </>
        )}
      </div>
    </div>
  )
}
