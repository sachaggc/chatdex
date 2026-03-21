'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Camera, MapPin, Edit3, X } from 'lucide-react'
import { CatWithSightings } from '@/types'
import { getRarity, DEFAULT_CATEGORIES } from '@/lib/rarity'
import RarityBadge from '@/components/RarityBadge'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const CatMap = dynamic(() => import('@/components/CatMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-parchment rounded-xl animate-pulse" />,
})

export default function CatDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [cat, setCat]           = useState<CatWithSightings | null>(null)
  const [loading, setLoading]   = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickDone, setQuickDone]       = useState(false)

  useEffect(() => {
    fetch(`/api/cats/${id}`)
      .then(r => r.json())
      .then(d => { setCat(d); setLoading(false) })
      .catch(() => { setLoading(false); router.push('/') })
  }, [id, router])

  async function quickSighting() {
    setQuickLoading(true)
    try {
      let lat: number | null = null, lng: number | null = null
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition | null>(resolve =>
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 8000, enableHighAccuracy: true })
        )
        if (pos) { lat = pos.coords.latitude; lng = pos.coords.longitude }
      }
      await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cat_id: id, lat, lng, seen_at: new Date().toISOString() }),
      })
      setQuickDone(true)
      const data = await fetch(`/api/cats/${id}`).then(r => r.json())
      setCat(data)
      setTimeout(() => setQuickDone(false), 3000)
    } catch { /* ignore */ }
    finally { setQuickLoading(false) }
  }

  if (loading) return (
    <div className="min-h-svh flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )
  if (!cat) return null

  const count    = cat.sightings_count ?? cat.sightings.length
  const rarity   = getRarity(count)
  const catDef   = cat.category ? DEFAULT_CATEGORIES[cat.category] : null
  const photos   = cat.sightings.filter(s => s.photo_url).map(s => s.photo_url!)

  return (
    <div className="min-h-svh pb-24">
      <TopBar
        backHref="/"
        title={<span className="font-display font-bold">{cat.name}</span>}
        action={
          <Link href={`/cats/${id}/edit`} className="flex items-center gap-1.5 text-sm text-muted font-semibold hover:text-text transition-colors">
            <Edit3 size={14} /> Modifier
          </Link>
        }
      />

      {/* Photo principale */}
      <div
        className="relative bg-parchment zellige-bg"
        style={{ height: 280 }}
        onClick={() => cat.main_photo_url && setLightbox(cat.main_photo_url)}
      >
        {cat.main_photo_url
          ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-contain cursor-pointer" priority />
          : <div className="flex h-full items-center justify-center opacity-10">
              <svg viewBox="0 0 60 60" className="w-24 h-24 fill-text">
                <ellipse cx="30" cy="36" rx="22" ry="18"/>
                <ellipse cx="30" cy="24" rx="14" ry="13"/>
                <polygon points="16,16 10,4 22,10"/>
                <polygon points="44,16 38,10 50,4"/>
              </svg>
            </div>
        }
        {/* Bande catégorie */}
        <div className="absolute top-0 inset-x-0 h-1" style={{ background: catDef?.color ?? '#DFC9AE' }} />
        {/* Dégradé bas */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <RarityBadge count={count} />
          {catDef && (
            <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold font-display"
              style={{ color: catDef.color, background: catDef.color + '22', border: `1px solid ${catDef.color}55` }}>
              {catDef.label}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 rounded-md bg-black/50 text-white text-xs px-2 py-1 font-display font-bold">
          {count} obs.
        </div>
      </div>

      <div className="px-4 space-y-6 mt-5">

        {/* Nom + description */}
        <div>
          <h1 className="font-display font-bold text-2xl text-text tracking-tight">{cat.name}</h1>
          {cat.description && <p className="text-muted text-sm mt-2 leading-relaxed">{cat.description}</p>}
        </div>

        {/* Traits */}
        {cat.character_traits?.length > 0 && (
          <div>
            <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">Caractère</p>
            <div className="flex flex-wrap gap-2">
              {cat.character_traits.map(t => (
                <span key={t} className="rounded-lg bg-surface border border-border px-3 py-1 text-sm text-text font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={quickSighting}
            disabled={quickLoading}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-display font-bold transition-all ${
              quickDone ? 'border-teal bg-teal/10 text-teal' : 'border-border bg-surface text-text hover:border-brand/40'
            } disabled:opacity-50`}
          >
            <Eye size={16} />
            {quickDone ? 'Enregistré !' : quickLoading ? 'Localisation…' : 'Juste vu !'}
          </button>
          <Link
            href={`/cats/${id}/observe`}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-display font-bold text-white"
          >
            <Camera size={16} /> Ajouter une photo
          </Link>
        </div>

        {/* Galerie */}
        {photos.length > 0 && (
          <div>
            <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">
              Galerie · {photos.length} photos
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-parchment cursor-pointer" onClick={() => setLightbox(url)}>
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carte */}
        {cat.sightings.some(s => s.lat && s.lng) && (
          <div>
            <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">Spots habituels</p>
            <div className="h-56 rounded-xl overflow-hidden border border-border">
              <CatMap sightings={cat.sightings} catName={cat.name} />
            </div>
          </div>
        )}

        {/* Historique */}
        {cat.sightings.length > 0 && (
          <div>
            <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">
              Historique · {cat.sightings.length} observations
            </p>
            <div className="space-y-2">
              {cat.sightings.map((s, i) => (
                <div key={s.id} className="flex items-start gap-3 rounded-xl bg-surface border border-border p-3">
                  <div className="shrink-0 mt-0.5">
                    {s.photo_url ? <Camera size={14} className="text-brand" /> : <Eye size={14} className="text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted">
                      {new Date(s.seen_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}
                      {new Date(s.seen_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {s.street && <p className="text-sm text-text font-medium mt-0.5 flex items-center gap-1"><MapPin size={11} /> {s.street}</p>}
                    {s.notes && <p className="text-sm text-muted italic mt-0.5">{s.notes}</p>}
                  </div>
                  {s.photo_url && (
                    <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightbox(s.photo_url!)}>
                      <Image src={s.photo_url} alt={`Obs ${i + 1}`} fill className="object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Photo agrandie" className="max-h-full max-w-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white" onClick={() => setLightbox(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
