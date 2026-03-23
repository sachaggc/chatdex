'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Camera, MapPin, Edit3, X, Clock, BarChart2, GitMerge, Trash2 } from 'lucide-react'
import { CatWithSightings, Sighting } from '@/types'
import { getRarity, DEFAULT_CATEGORIES } from '@/lib/rarity'
import RarityBadge from '@/components/RarityBadge'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import GossipBox from '@/components/GossipBox'
import { useProfile } from '@/components/ProfileContext'
import { SkeletonBox, SkeletonText } from '@/components/Skeleton'

const CatMap = dynamic(() => import('@/components/CatMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-parchment rounded-xl animate-pulse" />,
})

// ── Calcul des stats ─────────────────────────────────────────
function computeStats(sightings: Sighting[]) {
  if (sightings.length === 0) return null

  const hours = sightings.map(s => new Date(s.seen_at).getHours())
  const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
  const period =
    avgHour >= 5  && avgHour < 12 ? 'Matin'       :
    avgHour >= 12 && avgHour < 18 ? 'Après-midi'  :
    avgHour >= 18 && avgHour < 22 ? 'Soir'        : 'Nuit'

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const dayCounts = sightings.reduce((acc, s) => {
    const d = new Date(s.seen_at).getDay()
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {} as Record<number, number>)
  const topDayIdx = Number(Object.entries(dayCounts).sort(([,a],[,b]) => b - a)[0]?.[0] ?? 1)

  const streetCounts = sightings.filter(s => s.street).reduce((acc, s) => {
    acc[s.street!] = (acc[s.street!] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topStreets = Object.entries(streetCounts).sort(([,a],[,b]) => b - a).slice(0, 2)

  return { avgHour, period, topDay: dayNames[topDayIdx], topStreets }
}

export default function CatDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { awardXp } = useProfile()
  const [cat, setCat]           = useState<CatWithSightings | null>(null)
  const [loading, setLoading]   = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickDone, setQuickDone]       = useState(false)
  const [showMerge, setShowMerge]       = useState(false)
  const [allCats, setAllCats]           = useState<{id:string;name:string}[]>([])
  const [mergeTarget, setMergeTarget]   = useState('')
  const [mergeLoading, setMergeLoading] = useState(false)
  const [deleteMode, setDeleteMode]     = useState(false)
  const [editingDate, setEditingDate]   = useState<string | null>(null) // sighting id
  const [editDateVal, setEditDateVal]   = useState('')
  const [editingStreet, setEditingStreet] = useState<string | null>(null) // sighting id
  const [editStreetVal, setEditStreetVal] = useState('')

  useEffect(() => {
    fetch(`/api/cats/${id}`)
      .then(r => r.json())
      .then(d => { setCat(d); setLoading(false) })
      .catch(() => { setLoading(false); router.push('/') })
  }, [id, router])

  const stats = useMemo(() => cat ? computeStats(cat.sightings) : null, [cat])

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
      awardXp('CHECKIN', id)
      setQuickDone(true)
      const data = await fetch(`/api/cats/${id}`).then(r => r.json())
      setCat(data)
      setTimeout(() => setQuickDone(false), 3000)
    } catch { /* ignore */ }
    finally { setQuickLoading(false) }
  }

  async function startMerge() {
    const data = await fetch('/api/cats').then(r => r.json())
    setAllCats(data.filter((c: {id:string}) => c.id !== id))
    setShowMerge(true)
  }

  async function doMerge() {
    if (!mergeTarget) return
    if (!confirm('Fusionner les deux chats ? Cette action est irréversible.')) return
    setMergeLoading(true)
    const res = await fetch('/api/cats/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_id: id, target_id: mergeTarget }),
    })
    if (res.ok) router.push(`/cats/${mergeTarget}`)
    else setMergeLoading(false)
  }

  async function deleteSightingPhoto(sightingId: string, photoUrl: string) {
    if (!confirm('Supprimer cette photo ?')) return
    // Supprime l'observation entière si elle n'a que la photo (pas de notes/street)
    const sighting = cat?.sightings.find(s => s.id === sightingId)
    const res = await fetch(`/api/sightings/${sightingId}`, { method: 'DELETE' })
    if (!res.ok) return
    // Si c'était la photo principale du chat, on met à jour
    const data = await fetch(`/api/cats/${id}`).then(r => r.json())
    setCat(data)
    if (cat?.main_photo_url === photoUrl) {
      const nextPhoto = data.sightings?.find((s: {photo_url: string|null}) => s.photo_url)?.photo_url ?? null
      await fetch(`/api/cats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ main_photo_url: nextPhoto }),
      })
      const updated = await fetch(`/api/cats/${id}`).then(r => r.json())
      setCat(updated)
    }
  }

  async function saveSightingDate(sightingId: string) {
    if (!editDateVal) return
    await fetch(`/api/sightings/${sightingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seen_at: new Date(editDateVal).toISOString() }),
    })
    setEditingDate(null)
    const data = await fetch(`/api/cats/${id}`).then(r => r.json())
    setCat(data)
  }

  async function saveSightingStreet(sightingId: string) {
    await fetch(`/api/sightings/${sightingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ street: editStreetVal.trim() || null }),
    })
    setEditingStreet(null)
    const data = await fetch(`/api/cats/${id}`).then(r => r.json())
    setCat(data)
  }

  if (loading) return (
    <div className="min-h-svh pb-24">
      <TopBar backHref="/" />
      {/* Photo hero skeleton */}
      <SkeletonBox className="aspect-[4/3] w-full rounded-none" />
      <div className="px-4 pt-4 space-y-4">
        {/* Nom + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <SkeletonText className="w-1/2 h-6" />
            <SkeletonText className="w-1/3" />
          </div>
          <SkeletonBox className="h-8 w-20 rounded-full shrink-0" />
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => <SkeletonBox key={i} className="h-16 rounded-xl" />)}
        </div>
        {/* Sightings list */}
        <SkeletonText className="w-1/3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <SkeletonBox className="h-12 w-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonText className="w-1/3" />
              <SkeletonText className="w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
  if (!cat) return null

  const count  = cat.sightings_count ?? cat.sightings.length
  const rarity = getRarity(count)
  const catDef = cat.category ? DEFAULT_CATEGORIES[cat.category] : null
  const photos = cat.sightings.filter(s => s.photo_url).map(s => s.photo_url!)

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
      <div className="relative bg-parchment zellige-bg" style={{ height: 280 }}
        onClick={() => cat.main_photo_url && setLightbox(cat.main_photo_url)}>
        {cat.main_photo_url
          ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-contain cursor-pointer" priority />
          : <div className="flex h-full items-center justify-center opacity-10">
              <svg viewBox="0 0 60 60" className="w-24 h-24 fill-text">
                <ellipse cx="30" cy="36" rx="22" ry="18"/><ellipse cx="30" cy="24" rx="14" ry="13"/>
                <polygon points="16,16 10,4 22,10"/><polygon points="44,16 38,10 50,4"/>
              </svg>
            </div>
        }
        <div className="absolute top-0 inset-x-0 h-1" style={{ background: catDef?.color ?? '#DFC9AE' }} />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <RarityBadge count={count} />
          {catDef && (
            <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold font-display"
              style={{ color: '#fff', background: catDef.color, border: 'none' }}>
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
                <span key={t} className="rounded-lg bg-surface border border-border px-3 py-1 text-sm text-text font-medium">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Vote politique */}
        {(() => {
          const candidate = (cat as any).candidate as { id: string; name: string; emoji: string; color: string; alignment?: { name: string; color: string } } | null
          const voteAbstain = (cat as any).vote_abstain as boolean | null
          if (!candidate && !voteAbstain) return null
          return (
            <div>
              <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">Vote politique</p>
              {voteAbstain ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-3 py-2">
                  <span className="text-base">🤐</span>
                  <span className="text-sm font-display font-semibold text-muted">Abstention</span>
                </div>
              ) : candidate ? (
                <div
                  className="inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 border"
                  style={{ background: candidate.color + '12', borderColor: candidate.color + '40' }}
                >
                  <span className="text-xl">{candidate.emoji}</span>
                  <div>
                    <p className="font-display font-bold text-sm text-text leading-tight">{candidate.name}</p>
                    {candidate.alignment && (
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: candidate.alignment.color }}>
                        {candidate.alignment.name}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })()}

        {/* Stats automatiques */}
        {stats && count >= 2 && (
          <div>
            <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <BarChart2 size={12} /> Stats
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-surface border border-border p-3">
                <p className="text-xs text-muted font-medium">Heure habituelle</p>
                <p className="font-display font-bold text-text mt-1 flex items-center gap-1">
                  <Clock size={13} className="text-brand" />
                  {String(stats.avgHour).padStart(2,'0')}h · {stats.period}
                </p>
              </div>
              <div className="rounded-xl bg-surface border border-border p-3">
                <p className="text-xs text-muted font-medium">Jour le + fréquent</p>
                <p className="font-display font-bold text-text mt-1">{stats.topDay}</p>
              </div>
              {stats.topStreets.length > 0 && (
                <div className="col-span-2 rounded-xl bg-surface border border-border p-3">
                  <p className="text-xs text-muted font-medium mb-1.5 flex items-center gap-1">
                    <MapPin size={11} /> Spots fréquents
                  </p>
                  <div className="space-y-1">
                    {stats.topStreets.map(([street, count]) => (
                      <div key={street} className="flex items-center justify-between">
                        <span className="text-sm text-text font-medium truncate">{street}</span>
                        <span className="text-xs text-muted ml-2 shrink-0">{count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={quickSighting} disabled={quickLoading}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-display font-bold transition-all ${
              quickDone ? 'border-teal bg-teal/10 text-teal' : 'border-border bg-surface text-text hover:border-brand/40'
            } disabled:opacity-50`}>
            <Eye size={16} />
            {quickDone ? 'Enregistré !' : quickLoading ? 'Localisation…' : 'Juste vu !'}
          </button>
          <Link href={`/cats/${id}/observe`}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-display font-bold text-white">
            <Camera size={16} /> Ajouter une photo
          </Link>
        </div>

        {/* Galerie */}
        {photos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-display font-bold text-muted uppercase tracking-widest">Galerie · {photos.length} photos</p>
              <button
                onClick={() => setDeleteMode(!deleteMode)}
                className={`text-xs font-semibold transition-colors ${deleteMode ? 'text-red-500' : 'text-muted hover:text-text'}`}
              >
                {deleteMode ? 'Terminer' : 'Gérer'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {cat.sightings.filter(s => s.photo_url).map((s, i) => (
                <div
                  key={s.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-parchment cursor-pointer"
                  onClick={() => !deleteMode && setLightbox(s.photo_url!)}
                >
                  <Image src={s.photo_url!} alt={`Photo ${i + 1}`} fill className="object-cover" />
                  {deleteMode && (
                    <button
                      onClick={e => { e.stopPropagation(); deleteSightingPhoto(s.id, s.photo_url!) }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50"
                    >
                      <Trash2 size={20} className="text-white" />
                    </button>
                  )}
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
                    {editingDate === s.id ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <input
                          type="datetime-local"
                          defaultValue={new Date(s.seen_at).toISOString().slice(0, 16)}
                          onChange={e => setEditDateVal(e.target.value)}
                          className="text-xs border border-brand rounded-md px-2 py-1 bg-surface text-text"
                        />
                        <button onClick={() => saveSightingDate(s.id)} className="text-xs font-bold text-brand">OK</button>
                        <button onClick={() => setEditingDate(null)} className="text-xs text-muted">Annuler</button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted flex items-center gap-1">
                        {new Date(s.seen_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        {' · '}
                        {new Date(s.seen_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        <button onClick={() => { setEditingDate(s.id); setEditDateVal(new Date(s.seen_at).toISOString().slice(0,16)) }} className="ml-1 text-border hover:text-muted transition-colors">
                          <Edit3 size={10} />
                        </button>
                      </p>
                    )}
                    {editingStreet === s.id ? (
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <input
                          type="text"
                          defaultValue={s.street ?? ''}
                          onChange={e => setEditStreetVal(e.target.value)}
                          placeholder="Rue, quartier…"
                          className="text-xs border border-brand rounded-md px-2 py-1 bg-surface text-text flex-1 min-w-0"
                          autoFocus
                        />
                        <button onClick={() => saveSightingStreet(s.id)} className="text-xs font-bold text-brand shrink-0">OK</button>
                        <button onClick={() => setEditingStreet(null)} className="text-xs text-muted shrink-0">Annuler</button>
                      </div>
                    ) : (
                      <p className="text-sm text-text font-medium mt-0.5 flex items-center gap-1">
                        <MapPin size={11} />
                        {s.street ?? <span className="text-muted text-xs italic">Lieu non renseigné</span>}
                        <button onClick={() => { setEditingStreet(s.id); setEditStreetVal(s.street ?? '') }} className="ml-1 text-border hover:text-muted transition-colors">
                          <Edit3 size={10} />
                        </button>
                      </p>
                    )}
                    {s.notes && <p className="text-sm text-muted italic mt-0.5">{s.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {s.photo_url && (
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden cursor-pointer" onClick={e => { e.stopPropagation(); setLightbox(s.photo_url!) }}>
                        <Image src={s.photo_url} alt={`Obs ${i + 1}`} fill className="object-cover" />
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm('Supprimer cette observation ?')) return
                        const res = await fetch(`/api/sightings/${s.id}`, { method: 'DELETE' })
                        if (res.ok) {
                          const data = await fetch(`/api/cats/${id}`).then(r => r.json())
                          setCat(data)
                        }
                      }}
                      className="text-border hover:text-red-400 transition-colors p-0.5"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Murmures de la Rue */}
        <GossipBox catId={id} />

        {/* Fusionner */}
        <div className="pb-4">
          {!showMerge ? (
            <button onClick={startMerge} className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors font-semibold">
              <GitMerge size={13} /> Fusionner avec un autre chat (doublon)
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <p className="font-display font-semibold text-sm text-text">Fusionner avec…</p>
              <p className="text-xs text-muted">Toutes les observations de <strong>{cat.name}</strong> seront transférées vers le chat choisi, puis ce profil sera supprimé.</p>
              <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="input-field">
                <option value="">Choisir un chat…</option>
                {allCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowMerge(false)} className="btn-secondary flex-1 py-2.5 text-sm">Annuler</button>
                <button onClick={doMerge} disabled={!mergeTarget || mergeLoading}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-display font-bold text-white disabled:opacity-40">
                  {mergeLoading ? 'Fusion…' : 'Fusionner'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Photo agrandie" className="max-h-full max-w-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white" onClick={() => setLightbox(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
