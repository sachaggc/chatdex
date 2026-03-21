'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Cat } from '@/types'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

// Leaflet ne fonctionne pas côté serveur, on l'importe dynamiquement
const GlobalMap = dynamic(() => import('@/components/GlobalMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-gray-400">
      <span className="text-3xl animate-bounce">🗺️</span>
    </div>
  ),
})

interface CatWithCoords extends Cat {
  avg_lat: number
  avg_lng: number
}

export default function MapPage() {
  const [cats, setCats] = useState<CatWithCoords[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charge tous les chats avec leurs positions moyennes
    Promise.all(
      // On fetch d'abord la liste, puis les détails pour avoir avg_lat/lng
      [fetch('/api/cats').then((r) => r.json())]
    ).then(async ([catList]) => {
      const withCoords = await Promise.all(
        catList.map((cat: Cat) =>
          fetch(`/api/cats/${cat.id}`)
            .then((r) => r.json())
            .then((d) => ({ ...d }))
        )
      )
      setCats(withCoords.filter((c: CatWithCoords) => c.avg_lat && c.avg_lng))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-svh pb-20 flex flex-col">
      <TopBar title="Carte des chats" />

      <div className="px-4 py-2 text-sm text-gray-500">
        {cats.length} chat{cats.length > 1 ? 's' : ''} localisé{cats.length > 1 ? 's' : ''}
      </div>

      <div className="flex-1 px-4 pb-4" style={{ minHeight: 400 }}>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-gray-400">
            <span className="text-3xl animate-bounce">🐱</span>
          </div>
        ) : (
          <div className="h-[calc(100svh-160px)] rounded-xl overflow-hidden border border-terracotta/20 shadow">
            <GlobalMap cats={cats} />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
