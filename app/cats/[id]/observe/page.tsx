'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Cat } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import TopBar from '@/components/TopBar'

export default function ObservePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cat, setCat] = useState<Cat | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [photoDate, setPhotoDate] = useState<Date | null>(null)
  const [street, setStreet] = useState('')
  const [notes, setNotes] = useState('')
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)

  useEffect(() => {
    fetch(`/api/cats/${id}`)
      .then((r) => r.json())
      .then(setCat)
  }, [id])

  function handleImageReady(file: File, exifGps: { lat: number; lng: number } | null, date: Date | null) {
    setPhotoFile(file)
    setPhotoDate(date)
    // Si la photo a un GPS dans ses métadonnées, on l'utilise
    if (exifGps) {
      setGps(exifGps)
    }
  }

  async function getCurrentLocation() {
    setFetchingLocation(true)
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setFetchingLocation(false)
          resolve()
        },
        () => {
          setFetchingLocation(false)
          resolve()
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let photoUrl: string | null = null
      let finalGps = gps

      // Upload photo si présente
      if (photoFile) {
        const fd = new FormData()
        fd.append('file', photoFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) throw new Error('Erreur upload photo')
        const { url } = await uploadRes.json()
        photoUrl = url
      }

      // GPS : depuis EXIF ou depuis le navigateur si demandé
      if (!finalGps && useCurrentLocation) {
        await getCurrentLocation()
        finalGps = gps
      }

      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: id,
          photo_url: photoUrl,
          lat: finalGps?.lat ?? null,
          lng: finalGps?.lng ?? null,
          street: street.trim() || null,
          notes: notes.trim() || null,
          seen_at: photoDate?.toISOString() ?? new Date().toISOString(),
        }),
      })

      router.push(`/cats/${id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref={`/cats/${id}`} title={cat ? `Observer ${cat.name}` : 'Observation'} />

      <form onSubmit={handleSubmit} className="px-4 py-4 max-w-lg mx-auto space-y-5">

        {/* Photo */}
        <ImageUpload onImageReady={handleImageReady} label="Photo (optionnelle)" />

        {/* Info GPS auto-détecté */}
        {gps && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            <span>📍</span>
            <span>Position détectée depuis la photo</span>
          </div>
        )}

        {/* Option localisation actuelle */}
        {!gps && (
          <div>
            <button
              type="button"
              onClick={() => { setUseCurrentLocation(true); getCurrentLocation() }}
              disabled={fetchingLocation}
              className="w-full rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 py-3 text-sm text-blue-600 font-medium disabled:opacity-50"
            >
              {fetchingLocation ? '📍 Localisation...' : '📍 Utiliser ma position actuelle'}
            </button>
            {useCurrentLocation && gps && (
              <p className="text-xs text-green-600 text-center mt-1">✅ Position enregistrée</p>
            )}
          </div>
        )}

        {/* Rue */}
        <div>
          <label className="block text-sm font-medium text-dark-brown mb-1">
            Rue / lieu (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex: Rue Oqba, Agdal"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="input-moroccan"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-dark-brown mb-1">
            Notes (optionnel)
          </label>
          <textarea
            placeholder="Il dormait sur une voiture, avait l'air en forme..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input-moroccan resize-none"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full text-base disabled:opacity-50">
          {loading ? 'Enregistrement...' : '📸 Enregistrer l\'observation'}
        </button>
      </form>
    </div>
  )
}
