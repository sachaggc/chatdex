'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Crown, RefreshCw, Swords, TrendingUp } from 'lucide-react'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Cat } from '@/types'

interface AuraEntry { id: string; name: string; main_photo_url: string | null; aura_score: number }
interface Duel { winner_id: string; loser_id: string; created_at: string }

const BASE_ELO = 1000

function pickTwo(cats: Cat[], lastPair: string[]): [Cat, Cat] | null {
  const eligible = cats.filter(c => c.main_photo_url)
  if (eligible.length < 2) return null
  // Évite de reproposer la même paire
  const pool = eligible.filter(c => !lastPair.includes(c.id))
  const a = pool.length >= 2 ? pool : eligible
  const shuffled = [...a].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
}

export default function AuraPage() {
  const [cats, setCats]               = useState<Cat[]>([])
  const [pair, setPair]               = useState<[Cat, Cat] | null>(null)
  const [lastPair, setLastPair]       = useState<string[]>([])
  const [leaderboard, setLeaderboard] = useState<AuraEntry[]>([])
  const [recentDuels, setRecentDuels] = useState<Duel[]>([])
  const [voted, setVoted]             = useState<string | null>(null)
  const [eloChange, setEloChange]     = useState<{ winner: number; loser: number } | null>(null)
  const [loading, setLoading]         = useState(false)
  const [tab, setTab]                 = useState<'duel' | 'classement'>('duel')

  const loadLeaderboard = useCallback(() => {
    fetch('/api/aura').then(r => r.json()).then(({ leaderboard, recentDuels }) => {
      setLeaderboard(leaderboard ?? [])
      setRecentDuels(recentDuels ?? [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then((data: Cat[]) => {
      const named = data.filter(c => !c.unnamed && c.main_photo_url)
      setCats(named)
      setPair(pickTwo(named, []))
    }).catch(() => {})
    loadLeaderboard()
  }, [loadLeaderboard])

  function nextPair(currentPair?: [Cat, Cat]) {
    const p = currentPair ?? pair
    const ids = p ? [p[0].id, p[1].id] : []
    setLastPair(ids)
    setVoted(null)
    setEloChange(null)
    setPair(pickTwo(cats, ids))
  }

  async function vote(winner: Cat, loser: Cat) {
    if (voted || loading) return
    setVoted(winner.id)
    setLoading(true)
    try {
      const res = await fetch('/api/aura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winner.id, loser_id: loser.id }),
      })
      if (res.ok) {
        const { winner_elo, loser_elo } = await res.json()
        setEloChange({ winner: winner_elo, loser: loser_elo })
        loadLeaderboard()
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const maxElo = Math.max(...leaderboard.map(c => c.aura_score), BASE_ELO)
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]))

  return (
    <div className="min-h-svh pb-24">
      <TopBar title={
        <span className="flex items-center gap-2 font-display font-bold">
          <Flame size={17} className="text-brand" /> Aura Farm
        </span>
      } />

      {/* Onglets */}
      <div className="sticky top-14 z-30 bg-cream/90 backdrop-blur-md border-b border-border">
        <div className="flex max-w-lg mx-auto">
          {(['duel', 'classement'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-display font-bold transition-colors ${
                tab === t ? 'text-brand border-b-2 border-brand' : 'text-muted'
              }`}>
              {t === 'duel' ? '⚔️ Duel' : '👑 Classement'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">

        {/* ── TAB DUEL ── */}
        {tab === 'duel' && (
          <div className="space-y-5">
            <p className="text-center text-sm text-muted font-semibold">
              Quel chat a le plus d&apos;aura ? Clique pour voter.
            </p>

            {pair ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {pair.map((cat, idx) => {
                    const other = pair[idx === 0 ? 1 : 0]
                    const isWinner = voted === cat.id
                    const isLoser  = voted === other.id
                    const catElo   = leaderboard.find(c => c.id === cat.id)?.aura_score ?? BASE_ELO
                    const newElo   = isWinner ? eloChange?.winner : isLoser ? eloChange?.loser : null

                    return (
                      <motion.button
                        key={cat.id}
                        onClick={() => vote(cat, other)}
                        disabled={!!voted}
                        whileHover={!voted ? { scale: 1.03, y: -2 } : {}}
                        whileTap={!voted ? { scale: 0.97 } : {}}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                          isWinner ? 'border-gold shadow-xl shadow-gold/25' :
                          isLoser  ? 'border-border opacity-35' :
                          'border-border hover:border-brand/50 shadow-sm'
                        }`}
                      >
                        <div className="aspect-square relative bg-parchment">
                          {cat.main_photo_url && (
                            <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                          )}
                          {!voted && (
                            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
                          )}
                          {isWinner && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 flex items-center justify-center bg-black/35"
                            >
                              <Crown size={44} className="text-gold drop-shadow-lg" />
                            </motion.div>
                          )}
                        </div>
                        <div className="p-2.5 bg-surface">
                          <p className="font-display font-bold text-sm text-text truncate">{cat.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <TrendingUp size={10} className="text-muted shrink-0" />
                            {newElo ? (
                              <span className={`text-xs font-bold ${isWinner ? 'text-green-500' : 'text-red-400'}`}>
                                {isWinner ? '+' : ''}{newElo - catElo} → {newElo}
                              </span>
                            ) : (
                              <span className="text-xs text-muted tabular-nums">{catElo} ELO</span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {voted && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => nextPair()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-white font-display font-bold"
                    >
                      <RefreshCw size={15} /> Prochain duel
                    </motion.button>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-muted">
                <Swords size={32} className="opacity-20" />
                <p className="text-sm">Pas assez de chats avec photo</p>
              </div>
            )}

            {/* Derniers duels */}
            {recentDuels.length > 0 && (
              <div>
                <p className="text-xs font-display font-bold text-muted uppercase tracking-wide mb-2">Derniers duels</p>
                <div className="space-y-1.5">
                  {recentDuels.slice(0, 5).map((d, i) => {
                    const w = catMap[d.winner_id]
                    const l = catMap[d.loser_id]
                    if (!w || !l) return null
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted">
                        <span className="font-semibold text-text">{w.name}</span>
                        <span className="text-brand font-bold">⚔</span>
                        <span className="line-through">{l.name}</span>
                        <span className="ml-auto">
                          {new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CLASSEMENT ── */}
        {tab === 'classement' && (
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted text-sm py-12">Aucun vote encore — lance des duels !</p>
            ) : leaderboard.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/cats/${cat.id}`}>
                  <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                    i === 0 ? 'border-gold/50 bg-gold/5' : 'border-border bg-surface'
                  }`}>
                    <span className="w-6 text-center shrink-0">
                      {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs font-bold text-muted">{i + 1}</span>}
                    </span>
                    <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-parchment">
                      {cat.main_photo_url
                        ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                        : <div className="h-full w-full" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-display font-semibold text-sm text-text truncate">{cat.name}</p>
                        <span className={`text-xs font-bold tabular-nums ml-2 shrink-0 ${i === 0 ? 'text-gold' : 'text-muted'}`}>
                          {cat.aura_score || BASE_ELO} ELO
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-gold to-amber-400' : 'bg-brand/60'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(((cat.aura_score || BASE_ELO) / maxElo) * 100)}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
