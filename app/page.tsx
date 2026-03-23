'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, X, SlidersHorizontal, Flame } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cat } from '@/types'
import CatCard from '@/components/CatCard'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'
import NewsTicker from '@/components/NewsTicker'
import DailyMissions from '@/components/DailyMissions'
import { DEFAULT_CATEGORIES, getRarityRelative, getRarity } from '@/lib/rarity'
import { getLevelInfo } from '@/lib/levels'
import { useProfile } from '@/components/ProfileContext'

interface Category { key: string; label: string; color: string }
interface CandidateInfo { id: string; name: string; emoji: string; color: string; alignment?: { id: string; name: string; color: string; position: number } | null }
type SortKey = 'rarity' | 'recent' | 'politique'
type CatWithCandidate = Cat & { candidate?: CandidateInfo | null }

const RARITY_ORDER = [0, 1, 2, 3, 4, 5, 6]

export default function GalleriePage() {
  const { profile } = useProfile()
  const [cats, setCats]             = useState<CatWithCandidate[]>([])
  const [catsLoading, setLoading]   = useState(true)
  const [search, setSearch]         = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showSortSheet, setShowSortSheet] = useState(false)
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
      const positionMap = new Map<string, number>()
      for (const cat of withAlignment) {
        const cand  = cat.candidate as { id: string; name: string; emoji: string; color: string; alignment?: { id: string; name: string; color: string; position: number } | null } | null
        const align = cand?.alignment
        if (align) {
          const key = `align_${align.id}`
          if (!map.has(key)) { map.set(key, { key, label: align.name, color: align.color, emoji: undefined, cats: [] }); positionMap.set(key, align.position) }
          map.get(key)!.cats.push(cat)
        } else if (cand) {
          const key = `cand_${cand.id}`
          if (!map.has(key)) { map.set(key, { key, label: cand.name, color: cand.color, emoji: cand.emoji, cats: [] }); positionMap.set(key, 50) }
          map.get(key)!.cats.push(cat)
        } else {
          const key = '__undecided__'
          if (!map.has(key)) { map.set(key, { key, label: '🤷 Indécis', color: '#9CA3AF', emoji: undefined, cats: [] }); positionMap.set(key, 99) }
          map.get(key)!.cats.push(cat)
        }
      }
      return Array.from(map.entries()).sort(([ka], [kb]) => (positionMap.get(ka) ?? 99) - (positionMap.get(kb) ?? 99)).map(([, g]) => g)
    }

    return [{ key: 'all', label: '', color: '', cats: filtered }]
  }, [filtered, sortBy, allCounts])

  const showSections = sortBy !== 'recent'

  // Profile data for compact strip
  const { current, progress, next } = profile ? getLevelInfo(profile.total_xp) : { current: null, progress: 0, next: null }
  const today = new Date().toISOString().slice(0, 10)
  const lastActionDay = profile?.last_action_at ? new Date(profile.last_action_at).toISOString().slice(0, 10) : null
  const streakDanger = (profile?.streak_days ?? 0) > 0 && lastActionDay !== today && new Date().getHours() >= 18

  const SORT_OPTIONS: { key: SortKey; label: string; desc: string }[] = [
    { key: 'rarity',    label: '🎯 Rareté',    desc: 'Du plus rare au plus commun' },
    { key: 'recent',    label: '🕐 Récents',    desc: 'Derniers ajoutés en premier' },
    { key: 'politique', label: '🗳️ Politique',  desc: 'Groupés par alignement' },
  ]

  return (
    <div className="min-h-svh pb-24">
      <TopBar />

      {/* ── Compact hero ─────────────────────────────────────── */}
      <div className="bg-navy px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-gold font-display font-semibold text-[9px] tracking-[0.25em] uppercase leading-none mb-1">
              المغرب · Rabat
            </p>
            <h1 className="font-display font-bold text-white text-xl leading-tight truncate">
              {catsLoading ? '—' : namedCats.length} chats recensés
              {!catsLoading && unnamedCats.length > 0 && (
                <span className="ml-1.5 text-xs font-medium text-gold/70">· {unnamedCats.length} à nommer</span>
              )}
            </h1>
          </div>
          <button
            onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch('') }}
            className="h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0"
            style={{ background: showSearch ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
          >
            {showSearch
              ? <X size={16} className="text-white" />
              : <Search size={16} className="text-white/70" />
            }
          </button>
        </div>

        {/* Search bar — collapsible */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="search"
                    autoFocus
                    placeholder="Rechercher un chat…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/35 border border-white/15 text-sm focus:outline-none focus:bg-white/15"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Ticker ───────────────────────────────────────────── */}
      <NewsTicker />

      {/* ── Profile strip (compact, 1 ligne) ─────────────────── */}
      {profile && current && (
        <div className="px-4 py-2 flex items-center gap-2.5 border-b border-border/50">
          {/* Level badge */}
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-display font-bold text-white shrink-0"
            style={{ background: current.color }}
          >
            {current.level}
          </div>
          {/* Progress + title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-display font-bold text-text truncate leading-none">{current.title}</p>
              {next && <p className="text-[9px] text-muted shrink-0 ml-1">+{next.minXp - profile.total_xp} XP</p>}
            </div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: current.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
          {/* Streak */}
          {(profile.streak_days ?? 0) > 0 && (
            <motion.div
              className="flex items-center gap-0.5 rounded-full px-2 py-1 shrink-0"
              style={{
                background: streakDanger ? '#f9750015' : 'transparent',
                border: streakDanger ? '1px solid #f9750040' : '1px solid transparent',
              }}
              animate={streakDanger ? { scale: [1, 1.06, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Flame size={12} style={{ color: streakDanger ? '#ea580c' : '#f97316' }} />
              <span className="text-xs font-black tabular-nums" style={{ color: streakDanger ? '#ea580c' : '#f97316' }}>
                {profile.streak_days}
              </span>
            </motion.div>
          )}
          {/* XP */}
          <span className="text-[10px] text-muted tabular-nums shrink-0">{profile.total_xp} XP</span>
        </div>
      )}

      {/* ── Daily Missions (collapsed by default) ────────────── */}
      <DailyMissions />

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-2 border-b border-border/40">
        {/* Active filter summary */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filter !== 'all' && (() => {
            const cat = categories.find(c => c.key === filter)
            return cat ? (
              <button
                onClick={() => setFilter('all')}
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-display font-bold text-white flex items-center gap-1"
                style={{ background: cat.color }}
              >
                {cat.label} <X size={10} />
              </button>
            ) : null
          })()}
          {sortBy !== 'rarity' && (
            <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-display font-semibold text-muted bg-border/40 border border-border">
              {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
            </span>
          )}
          {filter === 'all' && sortBy === 'rarity' && (
            <span className="text-xs text-muted font-display">Tous les chats</span>
          )}
        </div>

        {/* Filter + sort button */}
        <button
          onClick={() => setShowSortSheet(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-display font-bold transition-colors"
          style={filter !== 'all' || sortBy !== 'rarity'
            ? { background: '#1B2D4A', color: 'white', borderColor: '#1B2D4A' }
            : { background: 'transparent', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }
          }
        >
          <SlidersHorizontal size={11} />
          Filtres
          {(filter !== 'all' || sortBy !== 'rarity') && (
            <span className="ml-0.5 h-4 w-4 rounded-full bg-white/25 text-[9px] font-black flex items-center justify-center">
              {(filter !== 'all' ? 1 : 0) + (sortBy !== 'rarity' ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter + Sort bottom sheet ─────────────────────────── */}
      <AnimatePresence>
        {showSortSheet && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSortSheet(false)}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-[81] rounded-t-2xl bg-surface border-t border-border pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3 mb-4" />

              {/* Sort section */}
              <p className="px-5 text-xs font-display font-black text-muted uppercase tracking-wider mb-2">Trier par</p>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-border/30"
                  style={{ background: sortBy === opt.key ? 'var(--color-border)' : 'transparent' }}
                >
                  <div className="flex-1">
                    <p className="font-display font-bold text-sm text-text">{opt.label}</p>
                    <p className="text-xs text-muted">{opt.desc}</p>
                  </div>
                  {sortBy === opt.key && <span className="text-brand text-lg">✓</span>}
                </button>
              ))}

              {/* Category section */}
              <p className="px-5 mt-4 mb-2 text-xs font-display font-black text-muted uppercase tracking-wider">Catégorie</p>
              <div className="px-5 flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-full px-3 py-1.5 text-xs font-display font-bold border transition-colors ${
                    filter === 'all' ? 'bg-navy text-white border-navy' : 'bg-surface text-muted border-border'
                  }`}
                >
                  Tous
                </button>
                {categories.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setFilter(filter === c.key ? 'all' : c.key)}
                    className="rounded-full px-3 py-1.5 text-xs font-display font-bold border transition-colors"
                    style={filter === c.key
                      ? { background: c.color, color: 'white', borderColor: c.color }
                      : { background: 'transparent', color: c.color, borderColor: c.color + '55' }
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowSortSheet(false)}
                className="mx-5 mt-5 w-[calc(100%-2.5rem)] rounded-xl py-3 text-sm font-display font-bold text-white"
                style={{ background: '#1B2D4A' }}
              >
                Appliquer
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="px-4 pt-3 space-y-5 pb-4">

        {/* Section "À nommer" */}
        {unnamedCats.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-display font-bold text-text text-sm flex items-center gap-1.5">
                <span className="text-gold">?</span> À nommer · {unnamedCats.length}
              </p>
              <p className="text-xs text-muted">Clique pour nommer</p>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {unnamedCats.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={`/cats/${cat.id}/edit`} className="shrink-0 block">
                    <div className="w-20 rounded-xl overflow-hidden" style={{ border: '1.5px dashed rgba(201,138,47,0.5)' }}>
                      <div className="relative aspect-square bg-parchment zellige-bg">
                        {cat.main_photo_url
                          ? <Image src={cat.main_photo_url} alt="Chat à nommer" fill className="object-cover opacity-80" />
                          : <div className="flex h-full items-center justify-center text-gold/30 text-2xl">?</div>
                        }
                        <div className="absolute inset-0 bg-black/10" />
                      </div>
                      <div className="px-1.5 py-1.5 bg-surface">
                        <p className="text-[10px] font-display font-bold text-gold truncate">À nommer</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 border-b border-border" />
          </div>
        )}

        {/* Grille */}
        {catsLoading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-square skeleton" />
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
              transition={{ duration: 0.18 }} className="space-y-4">

              {sortBy === 'politique' && groups.length === 1 && groups[0].key === '__undecided__' && (
                <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-center space-y-1">
                  <p className="text-sm font-display font-bold text-muted">🗳️ Aucun vote enregistré</p>
                  <p className="text-xs text-muted">Ouvre la fiche d&apos;un chat et assigne-lui un candidat.</p>
                  <a href="/politique" className="inline-block mt-1 text-xs font-bold text-brand underline underline-offset-2">Voir Félitics →</a>
                </div>
              )}

              {groups.map(group => (
                <div key={group.key}>
                  {/* Section header — only for top rarities or when there's a label */}
                  {showSections && group.label && (
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-1"
                        style={{ background: group.color + '14', borderLeft: `3px solid ${group.color}` }}
                      >
                        {group.emoji && <span className="text-sm leading-none">{group.emoji}</span>}
                        <span className="font-display font-black text-xs uppercase tracking-wider leading-none" style={{ color: group.color }}>
                          {group.label}
                        </span>
                        <span className="text-[10px] text-muted font-normal ml-auto">
                          {group.cats.length}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
