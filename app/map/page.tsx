'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Cat } from '@/types'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const GlobalMap = dynamic(() => import('@/components/GlobalMap'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-muted"><div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>,
})

interface CatWithCoords extends Cat { avg_lat: number; avg_lng: number }

export default function MapPage() {
  const [cats, setCats]       = useState<CatWithCoords[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then(async (list: Cat[]) => {
      const withCoords = await Promise.all(
        list.map(cat => fetch(`/api/cats/${cat.id}`).then(r => r.json()))
      )
      setCats(withCoords.filter((c: CatWithCoords) => c.avg_lat && c.avg_lng))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-svh pb-20 flex flex-col">
      <TopBar title="Carte des chats" />

      <div className="px-4 py-2.5 border-b border-border bg-surface">
        <p className="text-sm text-muted font-medium">
          {loading ? '…' : `${cats.length} chat${cats.length > 1 ? 's' : ''} localisé${cats.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="h-[calc(100svh-180px)] rounded-xl overflow-hidden border border-border shadow-sm">
            <GlobalMap cats={cats} />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
