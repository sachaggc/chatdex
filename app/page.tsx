'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, SlidersHorizontal, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cat } from '@/types'
import CatCard from '@/components/CatCard'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'
import ProfileBar from '@/components/ProfileBar'
import { DEFAULT_CATEGORIES, getRarityRelative } from '@/lib/rarity'

interface Category { key: string; label: string; color: string }

export default function GalleriePage() {
  const [cats, setCats]       = useState<Cat[]>([])
  const [catsLoading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then(d => { setCats(d); setLoading(false) }).catch(() => setLoading(false))
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) && data.length > 0 ? data : Object.entries(DEFAULT_CATEGORIES).map(([key, v]) => ({ key, label: v.label, color: v.color }))))
      .catch(() => setCategories(Object.entries(DEFAULT_CATEGORIES).map(([key, v]) => ({ key, label: v.label, color: v.color }))))
  }, [])

  const unnamedCats = useMemo(() => cats.filter(c => c.unnamed), [cats])
  const namedCats   = useMemo(() => cats.filter(c => !c.unnamed), [cats])

  // Tous les counts pour la rareté relative
  const allCounts = useMemo(() => namedCats.map(c => c.sightings_count ?? 0), [namedCats])

  const filtered = useMemo(() => namedCats.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filter === 'all' || c.category === filter
    return matchSearch && matchCat
  }), [namedCats, search, filter])

  return (
    <div className="min-h-svh pb-24">
      <TopBar />

      {/* Hero */}
      <div className="bg-navy px-4 pt-5 pb-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white'%3E%3Cpolygon points='20,0 40,20 20,40 0,20'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-gold font-display font-semibold text-xs tracking-widest uppercase mb-1"
        >
          المغرب · Rabat
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="font-display font-bold text-white text-2xl"
        >
          {catsLoading ? '—' : namedCats.length} chats recensés
          {unnamedCats.length > 0 && (
            <span className="ml-2 text-sm font-medium text-gold/80">· {unnamedCats.length} à nommer</span>
          )}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mt-4 flex gap-2"
        >
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/15 text-base focus:outline-none focus:bg-white/15" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center w-11 rounded-xl border transition-colors ${
              filter !== 'all' ? 'bg-gold border-gold text-navy' : 'bg-white/10 border-white/15 text-white'
            }`}>
            <SlidersHorizontal size={16} />
          </button>
        </motion.div>
      </div>

      {/* Barre de profil */}
      <ProfileBar />

      {/* Filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-surface border-b border-border flex gap-2 overflow-x-auto">
              <button onClick={() => setFilter('all')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-display font-bold border transition-colors ${
                  filter === 'all' ? 'bg-navy text-white border-navy' : 'bg-surface text-muted border-border'
                }`}>
                Tous
              </button>
              {categories.map(c => (
                <button key={c.key} onClick={() => setFilter(c.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-display font-bold border transition-colors"
                  style={filter === c.key
                    ? { background: c.color, color: 'white', borderColor: c.color }
                    : { background: 'transparent', color: c.color, borderColor: c.color + '55' }
                  }>
                  {c.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-4 space-y-6">

        {/* Section "À nommer" */}
        {unnamedCats.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={15} className="text-gold" />
                <p className="font-display font-bold text-text text-sm">À nommer · {unnamedCats.length}</p>
              </div>
              <p className="text-xs text-muted">Clique pour donner un nom</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {unnamedCats.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link href={`/cats/${cat.id}/edit`} className="shrink-0 block">
                    <div className="w-24 rounded-xl border-2 border-dashed border-gold/40 bg-surface overflow-hidden">
                      <div className="relative aspect-square bg-parchment zellige-bg">
                        {cat.main_photo_url
                          ? <Image src={cat.main_photo_url} alt="Chat à nommer" fill className="object-cover opacity-80" />
                          : <div className="flex h-full items-center justify-center">
                              <HelpCircle size={28} className="text-gold/40" />
                            </div>
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

        {/* Grille principale */}
        {catsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface border border-border animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-3 text-muted"
          >
            <svg viewBox="0 0 60 60" className="w-16 h-16 fill-current opacity-20">
              <ellipse cx="30" cy="36" rx="22" ry="18"/>
              <ellipse cx="30" cy="24" rx="14" ry="13"/>
              <polygon points="16,16 10,4 22,10"/>
              <polygon points="44,16 38,10 50,4"/>
            </svg>
            <p className="font-display font-semibold text-center">
              {search || filter !== 'all' ? 'Aucun résultat' : 'Aucun chat encore.\nAjoutes-en un !'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((cat, i) => <CatCard key={cat.id} cat={cat} index={i} rarityOverride={getRarityRelative(cat.sightings_count ?? 0, allCounts)} />)}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
