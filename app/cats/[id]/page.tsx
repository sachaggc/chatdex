'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CatWithSightings } from '@/types'
import { getRarity, CATEGORIES } from '@/lib/rarity'
import RarityBadge from '@/components/RarityBadge'
import CategoryBadge from '@/components/CategoryBadge'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const CatMap = dynamic(() => import('@/components/CatMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-parchment rounded-xl animate-pulse" />,
})

export default function CatDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cat, setCat] = useState<CatWithSightings | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [addingQuickSighting, setAddingQuickSighting] = useState(false)
  const [quickDone, setQuickDone] = useState(false)

  useEffect(() => {
    fetch(`/api/cats/${id}`)
      .then((r) => r.json())
      .then((data) => { setCat(data); setLoading(false) })
      .catch(() => { setLoading(false); router.push('/') })
  }, [id, router])

  // Bouton "Juste vu !" — ajoute une observation sans photo avec la position GPS
  async function handleQuickSighting() {
    setAddingQuickSighting(true)
    try {
      let lat: number | null = null
      let lng: number | null = null

      // Demande la position GPS au navigateur
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
            timeout: 8000,
            enableHighAccuracy: true,
          })
        })
        if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude }
      }

      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cat_id: id, lat, lng, seen_at: new Date().toISOString() }),
      })

      setQuickDone(true)
      // Rafraîchit les données
      const data = await fetch(`/api/cats/${id}`).then((r) => r.json())
      setCat(data)
      setTimeout(() => setQuickDone(false), 3000)
    } catch {
      alert('Erreur lors de l\'ajout.')
    } finally {
      setAddingQuickSighting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <span className="text-4xl animate-bounce">🐱</span>
      </div>
    )
  }

  if (!cat) return null

  const count = cat.sightings_count ?? cat.sightings.length
  const rarity = getRarity(count)
  const category = cat.category ? CATEGORIES[cat.category] : null
  const photos = cat.sightings.filter((s) => s.photo_url).map((s) => s.photo_url!)

  return (
    <div className="min-h-svh pb-24">
      <TopBar backHref="/" title={cat.name} />

      {/* Photo principale */}
      <div
        className={`relative h-72 sm:h-96 ${rarity.isShiny ? 'shiny-card' : 'bg-parchment zellige-bg'}`}
        onClick={() => cat.main_photo_url && setSelectedPhoto(cat.main_photo_url)}
      >
        {cat.main_photo_url ? (
          <Image
            src={cat.main_photo_url}
            alt={cat.name}
            fill
            className="object-contain cursor-pointer"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-8xl opacity-20">🐱</div>
        )}

        {/* Overlay dégradé bas */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badges superposés */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <RarityBadge count={count} />
          {cat.category && <CategoryBadge category={cat.category} />}
        </div>

        {/* Numéro d'observations */}
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs rounded-full px-2 py-1">
          {count} obs.
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 space-y-5 mt-4">

        {/* Nom + description */}
        <div>
          <h1 className="text-2xl font-bold text-dark-brown">{cat.name}</h1>
          {cat.description && (
            <p className="text-gray-600 mt-2 text-sm leading-relaxed">{cat.description}</p>
          )}
        </div>

        {/* Traits de caractère */}
        {cat.character_traits?.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Caractère
            </h2>
            <div className="flex flex-wrap gap-2">
              {cat.character_traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full bg-parchment border border-terracotta/20 px-3 py-1 text-sm text-dark-brown"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleQuickSighting}
            disabled={addingQuickSighting}
            className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
              quickDone
                ? 'border-green-400 bg-green-50 text-green-700'
                : 'border-terracotta/30 bg-white text-terracotta hover:bg-terracotta/5'
            } disabled:opacity-50`}
          >
            {quickDone ? '✅ Observation ajoutée !' : addingQuickSighting ? '📍 Localisation...' : '👀 Juste vu !'}
          </button>
          <Link
            href={`/cats/${id}/observe`}
            className="flex-1 rounded-xl bg-terracotta py-3 text-center text-sm font-semibold text-white"
          >
            📸 Ajouter une photo
          </Link>
        </div>

        {/* Galerie photos des observations */}
        {photos.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Galerie ({photos.length} photos)
            </h2>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-parchment"
                  onClick={() => setSelectedPhoto(url)}
                >
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carte des observations */}
        {cat.sightings.some((s) => s.lat && s.lng) && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Spots habituels
            </h2>
            <div className="h-56 rounded-xl overflow-hidden border border-terracotta/20">
              <CatMap sightings={cat.sightings} catName={cat.name} />
            </div>
          </div>
        )}

        {/* Historique des observations */}
        {cat.sightings.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Historique ({cat.sightings.length} observations)
            </h2>
            <div className="space-y-2">
              {cat.sightings.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 rounded-xl bg-white border border-terracotta/10 p-3"
                >
                  <div className="text-xl shrink-0">{s.photo_url ? '📸' : '👀'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">
                      {new Date(s.seen_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                      {' à '}
                      {new Date(s.seen_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {s.street && <p className="text-sm text-gray-600 mt-0.5">📍 {s.street}</p>}
                    {s.notes && <p className="text-sm text-gray-500 italic mt-0.5">{s.notes}</p>}
                  </div>
                  {s.photo_url && (
                    <div
                      className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg"
                      onClick={() => setSelectedPhoto(s.photo_url!)}
                    >
                      <Image src={s.photo_url} alt={`Obs ${i + 1}`} fill className="object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lien édition */}
        <div className="text-center pb-4">
          <Link href={`/cats/${id}/edit`} className="text-xs text-gray-400 underline">
            Modifier la fiche
          </Link>
        </div>
      </div>

      {/* Lightbox photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto}
            alt="Photo agrandie"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setSelectedPhoto(null)}
          >
            ×
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
