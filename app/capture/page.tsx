'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, PlusCircle } from 'lucide-react'
import Image from 'next/image'
import { Cat } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import TopBar from '@/components/TopBar'

export default function CapturePage() {
  const router = useRouter()
  const [step, setStep]         = useState<'photo' | 'select'>('photo')
  const [cats, setCats]         = useState<Cat[]>([])
  const [photoFile, setPhotoFile]   = useState<File | null>(null)
  const [gps, setGps]           = useState<{ lat: number; lng: number } | null>(null)
  const [photoDate, setPhotoDate]   = useState<Date | null>(null)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [street, setStreet]     = useState('')
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then(setCats).catch(() => {})
  }, [])

  function handleImageReady(file: File, exifGps: { lat: number; lng: number } | null, date: Date | null) {
    setPhotoFile(file)
    if (exifGps) setGps(exifGps)
    setPhotoDate(date)
    // Récupère le GPS du navigateur si pas dans l'EXIF
    if (!exifGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 6000, enableHighAccuracy: true }
      )
    }
    setStep('select')
  }

  async function handleSubmit() {
    if (!selectedCat || !photoFile) return
    setLoading(true); setError('')

    try {
      // Upload photo
      const fd = new FormData()
      fd.append('file', photoFile)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('Erreur upload')
      const { url } = await up.json()

      // Crée l'observation
      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: selectedCat,
          photo_url: url,
          lat: gps?.lat ?? null,
          lng: gps?.lng ?? null,
          street: street.trim() || null,
          notes: notes.trim() || null,
          seen_at: photoDate?.toISOString() ?? new Date().toISOString(),
        }),
      })
      router.push(`/cats/${selectedCat}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref="/" title="Capture rapide" />

      <div className="px-4 py-5 max-w-lg mx-auto space-y-6">

        {/* Étape 1 : Photo */}
        {step === 'photo' && (
          <>
            <div className="text-center py-4">
              <p className="font-display font-bold text-xl text-text">Tu viens de voir un chat ?</p>
              <p className="text-muted text-sm mt-1">Prends ou importe une photo pour commencer.</p>
            </div>
            <ImageUpload onImageReady={handleImageReady} />
          </>
        )}

        {/* Étape 2 : Choisir le chat */}
        {step === 'select' && (
          <>
            <div>
              <p className="font-display font-bold text-lg text-text mb-3">C&apos;est quel chat ?</p>

              {/* Nouveau chat */}
              <button
                onClick={() => router.push('/cats/new')}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 p-4 text-brand mb-3 hover:bg-brand/10 transition-colors"
              >
                <PlusCircle size={20} />
                <span className="font-display font-semibold">Nouveau chat (jamais recensé)</span>
              </button>

              {/* Liste des chats existants */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {cats.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                      selectedCat === cat.id
                        ? 'border-brand bg-brand/5'
                        : 'border-border bg-surface hover:border-brand/30'
                    }`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-parchment">
                      {cat.main_photo_url
                        ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                        : <div className="flex h-full items-center justify-center opacity-30">
                            <svg viewBox="0 0 60 60" className="w-6 h-6 fill-muted">
                              <ellipse cx="30" cy="36" rx="22" ry="18"/>
                              <ellipse cx="30" cy="24" rx="14" ry="13"/>
                              <polygon points="16,16 10,4 22,10"/>
                              <polygon points="44,16 38,10 50,4"/>
                            </svg>
                          </div>
                      }
                    </div>
                    <span className="font-display font-semibold text-text">{cat.name}</span>
                    {selectedCat === cat.id && (
                      <ArrowRight size={16} className="ml-auto text-brand" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Détails optionnels */}
            {selectedCat && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Rue (optionnel)</label>
                  <input type="text" placeholder="Ex: Rue Oqba, Agdal" value={street} onChange={e => setStreet(e.target.value)} className="input-field" />
                </div>
                {gps && (
                  <div className="flex items-center gap-2 text-sm text-teal font-medium">
                    <MapPin size={14} />
                    <span>Position GPS détectée</span>
                  </div>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
                  {loading ? 'Enregistrement…' : 'Enregistrer l\'observation'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
