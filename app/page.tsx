'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cat } from '@/types'
import CatCard from '@/components/CatCard'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'
import ProfileBar from '@/components/ProfileBar'
import NewsTicker from '@/components/NewsTicker'
import { DEFAULT_CATEGORIES, getRarityRelative, getRarity } from '@/lib/rarity'

interface Category { key: string; label: string; color: string }
interface CandidateInfo { id: string; name: string; emoji: string; color: string; alignment?: { id: string; name: string; color: string; position: number } | null }
type SortKey = 'rarity' | 'recent' | 'politique'
type CatWithCandidate = Cat & { candidate?: CandidateInfo | null }

const RARITY_ORDER = [0, 1, 2, 3, 4, 5, 6]

export default function GalleriePage() {
  const [cats, setCats]             = useState<CatWithCandidate[]>([])
  const [catsLoading, setLoading]   = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [sortBy, setSortBy]         = useState<SortKey>('rarity')

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then(d => { setCats(d); setLoading(false) }).catch(() => setLoading(false))
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) && data.length > 0
        ? data
        : Object.entries(DEFAULT_CATEGORIES).map(([key, v]) => ({ key, label: v.label, color: v.color }))))
      .catch(() => setCategories(Object.entries(DEFAULT_CATEGORIES).map(([key, v]) => ({ key, label: v.label, color: v.color }))))
  }, [])

  const unnamedCats = useMemo(() => cats.filter(c => c.unnamed), [cats])
  const namedCats   = useMemo(() => cats.filter(c => !c.unnamed), [cats])
  // Conversion Number() obligatoire : Supabase peut retourner count comme string
  const allCounts   = useMemo(() => namedCats.map(c => Number(c.sightings_count ?? 0)), [namedCats])

  const categoryMap = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {}
    for (const c of categories) map[c.key] = { label: c.label, color: c.color }
    return map
  }, [categories])

  const filtered = useMemo(() => namedCats.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filter === 'all' || c.category === filter
    return matchSearch && matchCat
  }), [namedCats, search, filter])

  // Groupement selon le tri sélectionné
  type Group = { key: string; label: string; color: string; emoji?: string; cats: CatWithCandidate[] }

  const groups = useMemo((): Group[] => {
    if (sortBy === 'recent') {
      const sorted = [...filtered].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      return [{ key: 'all', label: '', color: '', cats: sorted }]
    }

    if (sortBy === 'rarity') {
      const map = new Map<number, Group>()
      const sorted = [...filtered].sort((a, b) => {
        const ra = getRarityRelative(Number(a.sightings_count ?? 0), allCounts)
        const rb = getRarityRelative(Number(b.sightings_count ?? 0), allCounts)
        return ra.level - rb.level
      })
      for (const cat of sorted) {
        const r = getRarityRelative(Number(cat.sightings_count ?? 0), allCounts)
        if (!map.has(r.level)) map.set(r.level, { key: `r${r.level}`, label: r.label, color: r.color, emoji: r.emoji, cats: [] })
        map.get(r.level)!.cats.push(cat)
      }
      return RARITY_ORDER.filter(l => map.has(l)).map(l => map.get(l)!)
    }

    if (sortBy === 'politique') {
      const withAlignment = [...filtered].sort((a, b) => {
        const pa = a.candidate?.alignment?.position ?? (a.candidate ? 50 : 99)
        const pb = b.candidate?.alignment?.position ?? (b.candidate ? 50 : 99)
        return pa - pb
      })
      const map = new Map<string, Group>()
      for (const cat of withAlignment) {
        const align = cat.candidate?.alignment
        const label = align?.name ?? (cat.candidate ? cat.candidate.name : '🤷 Indécis')
        const color = align?.color ?? cat.candidate?.color ?? '#9CA3AF'
        const key   = align?.id ?? cat.candidate?.id ?? '__undecided__'
        if (!map.has(key)) map.set(key, { key, label, color, emoji: cat.candidate?.emoji, cats: [] })
        map.get(key)!.cats.push(cat)
      }
      return Array.from(map.values())
    }

    return [{ key: 'all', label: '', color: '', cats: filtered }]
  }, [filtered, sortBy, allCounts])

  const showSections = sortBy !== 'recent'

  return (
    <div className="min-h-svh pb-24">
      <TopBar />

      {/* Hero */}
      <div className="bg-navy px-4 pt-5 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white'%3E%3Cpolygon points='20,0 40,20 20,40 0,20'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="text-gold font-display font-semibold text-xs tracking-widest uppercase mb-1">
          المغرب · Rabat
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
          className="font-display font-bold text-white text-2xl">
          {catsLoading ? '—' : namedCats.length} chats recensés
          {unnamedCats.length > 0 && (
            <span className="ml-2 text-sm font-medium text-gold/80">· {unnamedCats.length} à nommer</span>
          )}
        </motion.h1>

        {/* Barre de recherche SANS le bouton filtre */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}
          className="mt-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/15 text-base focus:outline-none focus:bg-white/15" />
          </div>
        </motion.div>
      </div>

      {/* Ticker collant */}
      <NewsTicker />

      {/* Barre de profil */}
      <ProfileBar />

      {/* Filtres catégories (toujours visibles, scroll horizontal) */}
      <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto no-scrollbar border-b border-border/40">
        <button onClick={() => setFilter('all')}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-display font-bold border transition-colors ${
            filter === 'all' ? 'bg-navy text-white border-navy' : 'bg-surface text-muted border-border'
          }`}>
          Tous
        </button>
        {categories.map(c => (
          <button key={c.key} onClick={() => setFilter(filter === c.key ? 'all' : c.key)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-display font-bold border transition-colors"
            style={filter === c.key
              ? { background: c.color, color: 'white', borderColor: c.color }
              : { background: 'transparent', color: c.color, borderColor: c.color + '55' }
            }>
            {c.label}
          </button>
        ))}
      </div>

      {/* Tri */}
      <div className="flex gap-1.5 px-4 pt-2.5 pb-1 overflow-x-auto no-scrollbar">
        {([
          ['rarity',   '🎯 Rareté'  ],
          ['recent',   '🕐 Récents' ],
          ['politique','🗳️ Politique'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)}
            className={`shrink-0 text-[11px] font-display font-bold px-2.5 py-1 rounded-full border transition-all ${
              sortBy === key ? 'bg-navy text-white border-navy' : 'text-muted border-border bg-surface'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-3 space-y-6 pb-4">

        {/* Section "À nommer" */}
        {unnamedCats.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-display font-bold text-text text-sm flex items-center gap-1.5">
                <span className="text-gold">?</span> À nommer · {unnamedCats.length}
              </p>
              <p className="text-xs text-muted">Clique pour nommer</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {unnamedCats.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={`/cats/${cat.id}/edit`} className="shrink-0 block">
                    <div className="w-24 rounded-xl border-2 border-dashed border-gold/40 bg-surface overflow-hidden">
                      <div className="relative aspect-square bg-parchment zellige-bg">
                        {cat.main_photo_url
                          ? <Image src={cat.main_photo_url} alt="Chat à nommer" fill className="object-cover opacity-80" />
                          : <div className="flex h-full items-center justify-center text-gold/40 text-2xl">?</div>
                        }
                        <div className="absolute inset-0 bg-black/10" />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-display font-bold text-gold truncate">À nommer</p>
                        <p className="text-[10px] text-muted mt-0.5">{cat.sightings_count ?? 0} obs.</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 border-b border-border" />
          </div>
        )}

        {/* Grille groupée */}
        {catsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface border border-border animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
            <svg viewBox="0 0 60 60" className="w-16 h-16 fill-current opacity-20">
              <ellipse cx="30" cy="36" rx="22" ry="18"/>
              <ellipse cx="30" cy="24" rx="14" ry="13"/>
              <polygon points="16,16 10,4 22,10"/>
              <polygon points="44,16 38,10 50,4"/>
            </svg>
            <p className="font-display font-semibold text-center">
              {search || filter !== 'all' ? 'Aucun résultat' : 'Aucun chat encore'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={sortBy} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="space-y-5">

              {/* Aide contextuelle selon le tri */}
              {sortBy === 'politique' && groups.length === 1 && groups[0].key === '__undecided__' && (
                <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-center space-y-1">
                  <p className="text-sm font-display font-bold text-muted">🗳️ Aucun vote enregistré</p>
                  <p className="text-xs text-muted">Ouvre la fiche d&apos;un chat et assigne-lui un candidat pour le voir apparaître ici.</p>
                  <a href="/politique" className="inline-block mt-1 text-xs font-bold text-brand underline underline-offset-2">Voir Félitics →</a>
                </div>
              )}

              {groups.map(group => (
                <div key={group.key}>
                  {/* Section header */}
                  {showSections && group.label && (
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-px flex-1 bg-border" />
                      <span className="flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-widest shrink-0"
                        style={{ color: group.color }}>
                        {group.emoji && <span>{group.emoji}</span>}
                        {group.label}
                        <span className="text-muted/60 font-normal normal-case">({group.cats.length})</span>
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {group.cats.map((cat, i) => (
                      <CatCard
                        key={cat.id}
                        cat={cat}
                        index={i}
                        rarityOverride={getRarityRelative(Number(cat.sightings_count ?? 0), allCounts)}
                        categoryMap={categoryMap}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
