'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Cat } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import GeocodingInput from '@/components/GeocodingInput'
import TopBar from '@/components/TopBar'

export default function ObservePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cat, setCat]         = useState<Cat | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [gps, setGps]         = useState<{ lat: number; lng: number } | null>(null)
  const [photoDate, setPhotoDate] = useState<Date | null>(null)
  const [street, setStreet]   = useState('')
  const [notes, setNotes]     = useState('')

  useEffect(() => {
    fetch(`/api/cats/${id}`).then(r => r.json()).then(setCat)
  }, [id])

  function handleImageReady(file: File, exifGps: { lat: number; lng: number } | null, date: Date | null) {
    setPhotoFile(file)
    setPhotoDate(date)
    if (exifGps) setGps(exifGps)
    else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 6000, enableHighAccuracy: true }
      )
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      let photoUrl: string | null = null
      if (photoFile) {
        const fd = new FormData(); fd.append('file', photoFile)
        const up = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!up.ok) throw new Error('Erreur upload')
        photoUrl = (await up.json()).url
      }
      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: id, photo_url: photoUrl,
          lat: gps?.lat ?? null, lng: gps?.lng ?? null,
          street: street.trim() || null, notes: notes.trim() || null,
          seen_at: photoDate?.toISOString() ?? new Date().toISOString(),
        }),
      })
      router.push(`/cats/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref={`/cats/${id}`} title={cat ? `Observer ${cat.name}` : 'Observation'} />

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto space-y-5">
        <ImageUpload onImageReady={handleImageReady} label="Photo (optionnelle)" />

        {gps && (
          <div className="flex items-center gap-2 rounded-xl bg-teal/10 border border-teal/30 p-3 text-teal text-sm font-semibold">
            <CheckCircle size={16} /> Position GPS détectée
          </div>
        )}

        <GeocodingInput
          label="Rue / lieu (optionnel)"
          value={street}
          onChange={setStreet}
          onGeocode={(lat, lng) => setGps({ lat, lng })}
          placeholder="Rue, quartier de Rabat…"
        />

        <div>
          <label className="block text-sm font-semibold text-text mb-1">Notes (optionnel)</label>
          <textarea placeholder="Il dormait sur une voiture…" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-field resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Enregistrement…' : "Enregistrer l'observation"}
        </button>
      </form>
    </div>
  )
}
