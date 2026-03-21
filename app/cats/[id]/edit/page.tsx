'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Cat } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import TopBar from '@/components/TopBar'

interface Category { key: string; label: string; color: string }

export default function EditCatPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [cat, setCat]       = useState<Cat | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [name, setName]           = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]   = useState('')
  const [traitsInput, setTraitsInput] = useState('')
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    fetch(`/api/cats/${id}`).then(r => r.json()).then((data: Cat) => {
      setCat(data)
      setName(data.name)
      setDescription(data.description ?? '')
      setCategory(data.category ?? '')
      setTraitsInput((data.character_traits ?? []).join(', '))
    })
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    try {
      let mainPhotoUrl = cat?.main_photo_url ?? null

      if (newPhotoFile) {
        const fd = new FormData()
        fd.append('file', newPhotoFile)
        const up = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!up.ok) throw new Error('Erreur upload photo')
        const { url } = await up.json()
        mainPhotoUrl = url
      }

      const traits = traitsInput.split(',').map(t => t.trim()).filter(Boolean)

      const res = await fetch(`/api/cats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category: category || null,
          character_traits: traits,
          main_photo_url: mainPhotoUrl,
        }),
      })
      if (!res.ok) throw new Error('Erreur modification')
      router.push(`/cats/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  if (!cat) return (
    <div className="min-h-svh flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref={`/cats/${id}`} title={`Modifier ${cat.name}`} />

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto space-y-5">

        <ImageUpload
          onImageReady={(file) => setNewPhotoFile(file)}
          label="Nouvelle photo principale (optionnel)"
        />

        <div>
          <label className="block text-sm font-semibold text-text mb-1">Nom *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-2">Catégorie</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(category === c.key ? '' : c.key)}
                className="rounded-xl border-2 px-3 py-2.5 text-sm font-display font-semibold text-left transition-all"
                style={category === c.key
                  ? { background: c.color, borderColor: c.color, color: 'white' }
                  : { borderColor: '#DFC9AE', color: '#7A6352' }
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1">
            Traits de caractère <span className="text-muted font-normal">(séparés par des virgules)</span>
          </label>
          <input type="text" value={traitsInput} onChange={e => setTraitsInput(e.target.value)} className="input-field" placeholder="Ex: joueur, méfiant, câlin" />
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Enregistrement…' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  )
}
