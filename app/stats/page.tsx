'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Ghost, BarChart2, Eye, Star } from 'lucide-react'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

interface StatsData {
  totalCats: number
  totalSightings: number
  catOfTheWeek: { id: string; name: string; main_photo_url: string | null; weekCount: number } | null
  missing: { id: string; name: string; main_photo_url: string | null; lastSeen: string | null }[]
  topCats: { id: string; name: string; main_photo_url: string | null; count: number }[]
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 3600 * 24))
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  const maxCount = stats?.topCats?.[0]?.count ?? 1

  return (
    <div className="min-h-svh pb-24">
      <TopBar title="Statistiques" />

      <div className="px-4 py-5 max-w-lg mx-auto space-y-7">

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Chats recensés', value: stats?.totalCats ?? '—', icon: <Star size={16} className="text-brand" /> },
            { label: 'Observations', value: stats?.totalSightings ?? '—', icon: <Eye size={16} className="text-teal" /> },
          ].map(({ label, value, icon }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-surface border border-border p-4"
            >
              <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-xs text-muted font-semibold">{label}</p></div>
              <p className="font-display font-bold text-3xl text-text">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Chat de la semaine */}
        {stats?.catOfTheWeek && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={15} className="text-gold" />
              <p className="font-display font-bold text-text text-sm uppercase tracking-wide">Chat de la semaine</p>
            </div>
            <Link href={`/cats/${stats.catOfTheWeek.id}`}>
              <div className="flex items-center gap-4 rounded-2xl border-2 border-gold/40 bg-gold/5 p-4">
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-parchment">
                  {stats.catOfTheWeek.main_photo_url
                    ? <Image src={stats.catOfTheWeek.main_photo_url} alt={stats.catOfTheWeek.name} fill className="object-cover" />
                    : <div className="h-full w-full bg-parchment" />
                  }
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-text">{stats.catOfTheWeek.name}</p>
                  <p className="text-sm text-gold font-semibold">{stats.catOfTheWeek.weekCount} obs. cette semaine</p>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Classement top chats */}
        {stats && stats.topCats.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={15} className="text-brand" />
              <p className="font-display font-bold text-text text-sm uppercase tracking-wide">Les plus observés</p>
            </div>
            <div className="space-y-2.5">
              {stats.topCats.map((cat, i) => (
                <Link key={cat.id} href={`/cats/${cat.id}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-display font-bold text-muted w-4 shrink-0">{i + 1}</span>
                    <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-parchment">
                      {cat.main_photo_url
                        ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                        : <div className="h-full w-full bg-parchment" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-display font-semibold text-text truncate">{cat.name}</p>
                        <span className="text-xs font-bold text-muted ml-2 shrink-0">{cat.count} obs.</span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-brand"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((cat.count / maxCount) * 100)}%` }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.06, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chats disparus */}
        {stats && stats.missing.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Ghost size={15} className="text-muted" />
              <p className="font-display font-bold text-text text-sm uppercase tracking-wide">
                Disparus · {stats.missing.length}
              </p>
              <span className="text-xs text-muted">(pas vus depuis +10 jours)</span>
            </div>
            <div className="space-y-2">
              {stats.missing.map(cat => (
                <Link key={cat.id} href={`/cats/${cat.id}`}>
                  <div className="flex items-center gap-3 rounded-xl bg-surface border border-border p-3 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="relative h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-parchment grayscale">
                      {cat.main_photo_url
                        ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                        : <div className="h-full w-full bg-parchment" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-text truncate">{cat.name}</p>
                      <p className="text-xs text-muted">
                        {cat.lastSeen
                          ? `Vu il y a ${daysSince(cat.lastSeen)} jours`
                          : 'Jamais observé'}
                      </p>
                    </div>
                    <Ghost size={14} className="text-muted shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {!stats && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
