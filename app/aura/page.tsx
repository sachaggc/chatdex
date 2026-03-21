'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Crown, RefreshCw, Zap } from 'lucide-react'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Cat } from '@/types'

interface AuraEntry { id: string; name: string; main_photo_url: string | null; aura_score: number }

function pickTwo(cats: Cat[]): [Cat, Cat] | null {
  const eligible = cats.filter(c => c.main_photo_url)
  if (eligible.length < 2) return null
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
}

export default function AuraPage() {
  const [cats, setCats]         = useState<Cat[]>([])
  const [pair, setPair]         = useState<[Cat, Cat] | null>(null)
  const [leaderboard, setLeaderboard] = useState<AuraEntry[]>([])
  const [voted, setVoted]       = useState<string | null>(null) // id du gagnant
  const [loading, setLoading]   = useState(false)
  const [voteCount, setVoteCount] = useState(0)

  useEffect(() => {
    fetch('/api/cats').then(r => r.json()).then((data: Cat[]) => {
      const named = data.filter(c => !c.unnamed && c.main_photo_url)
      setCats(named)
      setPair(pickTwo(named))
    }).catch(() => {})
    fetch('/api/aura').then(r => r.json()).then(setLeaderboard).catch(() => {})
  }, [])

  const nextPair = useCallback(() => {
    setVoted(null)
    setPair(pickTwo(cats))
  }, [cats])

  async function vote(winner: Cat, loser: Cat) {
    if (voted || loading) return
    setVoted(winner.id)
    setLoading(true)
    try {
      await fetch('/api/aura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winner.id, loser_id: loser.id }),
      })
      setVoteCount(v => v + 1)
      // Refresh leaderboard
      fetch('/api/aura').then(r => r.json()).then(setLeaderboard).catch(() => {})
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const maxAura = leaderboard[0]?.aura_score ?? 1

  return (
    <div className="min-h-svh pb-24">
      <TopBar title={
        <span className="flex items-center gap-2">
          <Flame size={18} className="text-brand" />
          <span>Aura Farm</span>
        </span>
      } />

      <div className="px-4 py-5 max-w-lg mx-auto space-y-8">

        {/* Explications */}
        <div className="rounded-2xl bg-navy/90 text-white p-4 text-center space-y-1">
          <p className="font-display font-bold text-lg">Qui a le plus d&apos;aura ?</p>
          <p className="text-sm text-white/60">Vote pour le chat le plus charismatique du quartier.</p>
          {voteCount > 0 && <p className="text-xs text-gold font-bold mt-1">{voteCount} vote{voteCount > 1 ? 's' : ''} cette session</p>}
        </div>

        {/* Duel */}
        {pair ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {pair.map((cat, idx) => {
                const other = pair[idx === 0 ? 1 : 0]
                const isWinner = voted === cat.id
                const isLoser  = voted === other.id
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => vote(cat, other)}
                    disabled={!!voted}
                    whileHover={!voted ? { scale: 1.03 } : {}}
                    whileTap={!voted ? { scale: 0.97 } : {}}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                      isWinner ? 'border-gold shadow-lg shadow-gold/20' :
                      isLoser  ? 'border-border opacity-40' :
                      'border-border hover:border-brand/40'
                    }`}
                  >
                    <div className="aspect-square relative bg-parchment">
                      {cat.main_photo_url && (
                        <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                      )}
                      {isWinner && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/40"
                        >
                          <Crown size={48} className="text-gold drop-shadow-lg" />
                        </motion.div>
                      )}
                    </div>
                    <div className="p-2.5 bg-surface">
                      <p className="font-display font-bold text-sm text-text truncate">{cat.name}</p>
                      {isWinner && <p className="text-xs text-gold font-bold">+1 aura !</p>}
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
                  onClick={nextPair}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-white font-display font-bold text-sm"
                >
                  <RefreshCw size={16} /> Prochain duel
                </motion.button>
              )}
            </AnimatePresence>

            {!voted && (
              <p className="text-center text-xs text-muted">Clique sur le chat le plus charismatique</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted">
            <Zap size={32} className="opacity-20" />
            <p className="text-sm font-semibold">Pas assez de chats avec photo pour un duel</p>
          </div>
        )}

        {/* Classement Aura */}
        {leaderboard.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown size={15} className="text-gold" />
              <p className="font-display font-bold text-text text-sm uppercase tracking-wide">Classement Aura</p>
            </div>
            <div className="space-y-2">
              {leaderboard.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-5 text-xs font-display font-bold text-muted text-right shrink-0">
                    {i === 0 ? '👑' : i + 1}
                  </span>
                  <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-parchment">
                    {cat.main_photo_url
                      ? <Image src={cat.main_photo_url} alt={cat.name} fill className="object-cover" />
                      : <div className="h-full w-full bg-parchment" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-display font-semibold text-text truncate">{cat.name}</p>
                      <span className="text-xs font-bold text-gold ml-2 shrink-0 tabular-nums">{cat.aura_score} ✦</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-brand"
                        initial={{ width: 0 }}
                        animate={{ width: maxAura > 0 ? `${Math.round((cat.aura_score / maxAura) * 100)}%` : '0%' }}
                        transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
