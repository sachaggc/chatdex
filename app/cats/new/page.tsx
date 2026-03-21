'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Category } from '@/types'
import { CATEGORIES } from '@/lib/rarity'
import ImageUpload from '@/components/ImageUpload'
import TopBar from '@/components/TopBar'

export default function NewCatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Champs du formulaire
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [traitsInput, setTraitsInput] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [firstSightingGps, setFirstSightingGps] = useState<{ lat: number; lng: number } | null>(null)
  const [firstSightingDate, setFirstSightingDate] = useState<Date | null>(null)
  const [street, setStreet] = useState('')

  function handleImageReady(file: File, gps: { lat: number; lng: number } | null, date: Date | null) {
    setPhotoFile(file)
    setFirstSightingGps(gps)
    setFirstSightingDate(date)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est requis'); return }
    setLoading(true)
    setError('')

    try {
      let mainPhotoUrl: string | null = null

      // 1. Upload la photo si présente
      if (photoFile) {
        const fd = new FormData()
        fd.append('file', photoFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) throw new Error('Erreur upload photo')
        const { url } = await uploadRes.json()
        mainPhotoUrl = url
      }

      // 2. Crée le chat
      const traits = traitsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const catRes = await fetch('/api/cats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category: category || null,
          character_traits: traits,
          main_photo_url: mainPhotoUrl,
        }),
      })
      if (!catRes.ok) throw new Error('Erreur création chat')
      const newCat = await catRes.json()

      // 3. Ajoute la première observation si on a une photo
      if (mainPhotoUrl) {
        // GPS : depuis EXIF ou depuis navigateur
        let lat = firstSightingGps?.lat ?? null
        let lng = firstSightingGps?.lng ?? null

        if (!lat && navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 })
          })
          if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude }
        }

        await fetch('/api/sightings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cat_id: newCat.id,
            photo_url: mainPhotoUrl,
            lat, lng,
            street: street.trim() || null,
            seen_at: firstSightingDate?.toISOString() ?? new Date().toISOString(),
          }),
        })
      }

      router.push(`/cats/${newCat.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const categories = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref="/" title="Nouveau chat" />

      <form onSubmit={handleSubmit} className="px-4 py-4 max-w-lg mx-auto space-y-5">

        {/* Photo principale */}
        <ImageUpload onImageReady={handleImageReady} label="Photo principale" />

        {/* Rue (si on veut préciser la localisation) */}
        <div>
          <label className="block text-sm font-medium text-dark-brown mb-1">
            Rue / lieu (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex: Rue Tariq Ibn Ziad, Agdal"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="input-moroccan"
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-dark-brown mb-1">
            Nom du chat *
          </label>
          <input
            type="text"
            placeholder="Ex: Le Gros Roux, Whiskers..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-moroccan"
            required
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-dark-brown mb-2">
            Catégorie
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(category === key ? '' : key)}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all text-left ${
                  category === key
                    ? 'border-current text-white'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
                style={category === key ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-dark-brown mb-1">
            Description (optionnel)
          </label>
          <textarea
            placeholder="Décris ce chat en quelques mots..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-moroccan resize-none"
          />
        </div>

        {/* Traits de caractère */}
        <div>
          <label className="block text-sm font-medium text-dark-brown mb-1">
            Traits de caractère (séparés par des virgules)
          </label>
          <input
            type="text"
            placeholder="Ex: joueur, méfiant, câlin"
            value={traitsInput}
            onChange={(e) => setTraitsInput(e.target.value)}
            className="input-moroccan"
          />
          <p className="text-xs text-gray-400 mt-1">
            Appuie sur virgule pour séparer les traits.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full text-base disabled:opacity-50">
          {loading ? 'Enregistrement...' : '✨ Ajouter ce chat'}
        </button>
      </form>
    </div>
  )
}
