'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
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
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  useEffect(() => {
    fetch(`/api/cats/${id}`).then(r => r.json()).then((data: Cat) => {
      setCat(data)
      // Pour les chats "à nommer", le champ nom commence vide (pas le nom temp)
      setName(data.unnamed ? '' : (data.name ?? ''))
      setDescription(data.description ?? '')
      setCategory(data.category ?? '')
      setTraitsInput((data.character_traits ?? []).join(', '))
    })
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est requis'); return }
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
          unnamed: false,
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

  // Pour les chats "à nommer" : retour à l'accueil (la fiche détail n'est pas encore utile)
  const backHref = cat.unnamed ? '/' : `/cats/${id}`

  return (
    <div className="min-h-svh pb-10">
      <TopBar backHref={backHref} title={cat.unnamed ? 'Nommer ce chat' : `Modifier ${cat.name}`} />

      <form onSubmit={handleSubmit} className="px-4 py-5 max-w-lg mx-auto space-y-5">

        {/* Bandeau "à nommer" */}
        {cat.unnamed && (
          <div className="flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/30 p-3 text-sm text-gold font-semibold">
            <span>?</span> Donne un nom à ce chat pour l&apos;ajouter au Chatdex !
          </div>
        )}

        {/* Photo : affiche la photo existante + option de changement */}
        {cat.main_photo_url && !showPhotoUpload ? (
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Photo principale</label>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
              <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setShowPhotoUpload(true)}
              className="mt-2 text-sm text-muted hover:text-text underline underline-offset-2 transition-colors"
            >
              Changer la photo
            </button>
          </div>
        ) : (
          <ImageUpload
            onImageReady={(file) => setNewPhotoFile(file)}
            label={cat.main_photo_url ? 'Nouvelle photo' : 'Photo principale (optionnel)'}
          />
        )}

        <div>
          <label className="block text-sm font-semibold text-text mb-1">
            Nom {cat.unnamed && <span className="text-brand">*</span>}
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
            placeholder={cat.unnamed ? 'Ex: Le Gros Roux, Whiskers…' : ''}
            autoFocus={cat.unnamed}
            required
          />
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
          {loading ? 'Enregistrement…' : cat.unnamed ? 'Nommer ce chat !' : 'Sauvegarder'}
        </button>

        <button
          type="button"
          onClick={async () => {
            const label = cat.unnamed ? 'ce chat sans nom' : cat.name
            if (!confirm(`Supprimer ${label} définitivement ?`)) return
            await fetch(`/api/cats/${id}`, { method: 'DELETE' })
            window.location.href = '/'
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-display font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={15} /> Supprimer ce chat
        </button>
      </form>
    </div>
  )
}
