'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import TopBar from '@/components/TopBar'

interface Category { key: string; label: string; color: string }

export default function NewCatPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [name, setName]           = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]   = useState('')
  const [traitsInput, setTraitsInput] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [gps, setGps]             = useState<{ lat: number; lng: number } | null>(null)
  const [photoDate, setPhotoDate] = useState<Date | null>(null)
  const [street, setStreet]       = useState('')

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [])

  function handleImageReady(file: File, exifGps: { lat: number; lng: number } | null, date: Date | null) {
    setPhotoFile(file); setGps(exifGps); setPhotoDate(date)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est requis'); return }
    setLoading(true); setError('')

    try {
      let mainPhotoUrl: string | null = null
      if (photoFile) {
        const fd = new FormData(); fd.append('file', photoFile)
        const up = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!up.ok) throw new Error('Erreur upload photo')
        mainPhotoUrl = (await up.json()).url
      }

      const traits = traitsInput.split(',').map(t => t.trim()).filter(Boolean)
      const res = await fetch('/api/cats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, category: category || null, character_traits: traits, main_photo_url: mainPhotoUrl }),
      })
      if (!res.ok) throw new Error('Erreur création')
      const newCat = await res.json()

      if (mainPhotoUrl) {
        let lat = gps?.lat ?? null, lng = gps?.lng ?? null
        if (!lat && navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition | null>(resolve =>
            navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 })
          )
          if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude }
        }
        await fetch('/api/sightings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cat_id: newCat.id, photo_url: mainPhotoUrl, lat, lng, street: street.trim() || null, seen_at: photoDate?.toISOString() ?? new Date().toISOString() }),
        })
      }
      router.push(`/cats/${newCat.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref="/" title="Nouveau chat" />

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto space-y-5">
        <ImageUpload onImageReady={handleImageReady} label="Photo principale" />

        <div>
          <label className="block text-sm font-semibold text-text mb-1">Rue / lieu (optionnel)</label>
          <input type="text" placeholder="Ex: Rue Tariq Ibn Ziad, Agdal" value={street} onChange={e => setStreet(e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1">Nom du chat <span className="text-brand">*</span></label>
          <input type="text" placeholder="Ex: Le Gros Roux, Whiskers…" value={name} onChange={e => setName(e.target.value)} className="input-field" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-2">Catégorie</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map(c => (
              <button key={c.key} type="button" onClick={() => setCategory(category === c.key ? '' : c.key)}
                className="rounded-xl border-2 px-3 py-2.5 text-sm font-display font-semibold text-left transition-all"
                style={category === c.key
                  ? { background: c.color, borderColor: c.color, color: 'white' }
                  : { borderColor: '#DFC9AE', color: '#7A6352' }
                }>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1">Description (optionnel)</label>
          <textarea placeholder="Décris ce chat en quelques mots…" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1">
            Traits de caractère <span className="text-muted font-normal">(séparés par des virgules)</span>
          </label>
          <input type="text" placeholder="Ex: joueur, méfiant, câlin" value={traitsInput} onChange={e => setTraitsInput(e.target.value)} className="input-field" />
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Enregistrement…' : 'Ajouter ce chat'}
        </button>
      </form>
    </div>
  )
}
