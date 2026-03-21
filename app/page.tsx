'use client'

import { useEffect, useState, useMemo } from 'react'
import { Cat, Category } from '@/types'
import { CATEGORIES } from '@/lib/rarity'
import CatCard from '@/components/CatCard'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

export default function GalleriePage() {
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')

  useEffect(() => {
    fetch('/api/cats')
      .then((r) => r.json())
      .then((data) => { setCats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return cats.filter((cat) => {
      const matchSearch = cat.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === 'all' || cat.category === filterCategory
      return matchSearch && matchCategory
    })
  }, [cats, search, filterCategory])

  const categories = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]

  return (
    <div className="min-h-svh pb-24">
      <TopBar />

      {/* Header décoratif */}
      <div className="bg-terracotta text-cream px-4 pt-4 pb-6">
        <p className="text-sm opacity-80">المغرب · Rabat</p>
        <h1 className="text-2xl font-bold mt-1">
          {cats.length} chats recensés
        </h1>

        {/* Barre de recherche */}
        <div className="mt-3 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/60">🔍</span>
          <input
            type="search"
            placeholder="Rechercher un chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/20 text-cream placeholder-cream/60 border border-white/20 focus:outline-none focus:bg-white/30 text-base"
          />
        </div>
      </div>

      {/* Filtres catégories */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterCategory('all')}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
            filterCategory === 'all'
              ? 'bg-terracotta text-white border-terracotta'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Tous
        </button>
        {categories.map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setFilterCategory(key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
              filterCategory === key ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'
            }`}
            style={filterCategory === key ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Grille */}
      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <span className="text-4xl animate-bounce">🐱</span>
            <p>Chargement des chats...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <span className="text-5xl">🐾</span>
            <p className="text-center">
              {search || filterCategory !== 'all'
                ? 'Aucun chat ne correspond à ta recherche'
                : 'Aucun chat encore. Ajoutes-en un !'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
