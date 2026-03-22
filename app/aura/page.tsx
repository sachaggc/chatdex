'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Crown, RefreshCw, Swords, TrendingUp, Zap, Plus, RotateCcw, ChevronDown } from 'lucide-react'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { Cat } from '@/types'

interface AuraEntry { id: string; name: string; main_photo_url: string | null; aura_score: number }
interface Duel { winner_id: string; loser_id: string; created_at: string; action_name?: string; aura_delta?: number }

interface PresetAction {
  id: string; name: string; aura_points: number; emoji: string; note: string; is_preset: boolean
}
interface CustomAction {
  id: string; name: string; aura_points: number; emoji: string; is_preset: boolean
}

const BASE_AURA = 1000

function pickTwo(cats: Cat[], lastPair: string[]): [Cat, Cat] | null {
  const eligible = cats.filter(c => c.main_photo_url)
  if (eligible.length < 2) return null
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
  const [auraChange, setAuraChange]   = useState<{ winner: number; loser: number } | null>(null)
  const [loading, setLoading]         = useState(false)
  const [tab, setTab]                 = useState<'duel' | 'classement' | 'actions'>('duel')

  // Actions
  const [presets, setPresets]       = useState<PresetAction[]>([])
  const [custom, setCustom]         = useState<CustomAction[]>([])
  const [selectedCatId, setSelectedCatId] = useState('')
  const [selectedAction, setSelectedAction] = useState<PresetAction | CustomAction | null>(null)
  const [applyLoading, setApplyLoading] = useState(false)
  const [applyResult, setApplyResult] = useState<{ cat_name: string; new_score: number; delta: number } | null>(null)
  const [showNewAction, setShowNewAction] = useState(false)
  const [newActionName, setNewActionName] = useState('')
  const [newActionPts, setNewActionPts]   = useState(10)
  const [newActionEmoji, setNewActionEmoji] = useState('⚡')
  const [isAuth, setIsAuth] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

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
    fetch('/api/aura/actions').then(r => r.json()).then(({ presets, custom }) => {
      setPresets(presets ?? [])
      setCustom(custom ?? [])
    }).catch(() => {})
    fetch('/api/auth').then(r => setIsAuth(r.ok)).catch(() => {})
  }, [loadLeaderboard])

  function nextPair(currentPair?: [Cat, Cat]) {
    const p = currentPair ?? pair
    const ids = p ? [p[0].id, p[1].id] : []
    setLastPair(ids)
    setVoted(null)
    setAuraChange(null)
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
        setAuraChange({ winner: winner_elo, loser: loser_elo })
        loadLeaderboard()
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function applyAction() {
    if (!selectedCatId || !selectedAction) return
    setApplyLoading(true); setApplyResult(null)
    try {
      const res = await fetch('/api/aura/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cat_id: selectedCatId,
          action_name: selectedAction.name,
          aura_points: selectedAction.aura_points,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setApplyResult(data)
        loadLeaderboard()
        if (navigator.vibrate) navigator.vibrate([20, 10, 40, 10, 80])
        setTimeout(() => { setApplyResult(null); setSelectedAction(null) }, 4000)
      }
    } catch { /* ignore */ }
    finally { setApplyLoading(false) }
  }

  async function createAction() {
    if (!newActionName.trim()) return
    const res = await fetch('/api/aura/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newActionName.trim(), aura_points: newActionPts, emoji: newActionEmoji }),
    })
    if (res.ok) {
      const data = await res.json()
      setCustom(prev => [data, ...prev])
      setShowNewAction(false)
      setNewActionName(''); setNewActionPts(10); setNewActionEmoji('⚡')
    }
  }

  async function resetAura() {
    if (!confirm('Remettre TOUS les scores à 1000 et effacer l\'historique des duels ?')) return
    setResetLoading(true)
    try {
      await fetch('/api/aura/reset', { method: 'POST' })
      loadLeaderboard()
    } finally { setResetLoading(false) }
  }

  const maxAura = Math.max(...leaderboard.map(c => c.aura_score), BASE_AURA)
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]))

  const allActions = [
    ...presets,
    ...custom,
  ]

  return (
    <div className="min-h-svh pb-24">
      <TopBar title={
        <span className="flex items-center gap-2 font-display font-bold">
          <Flame size={17} className="text-brand" /> Aura Farm
        </span>
      } />

      {/* Onglets */}
      <div className="sticky top-14 z-30 bg-cream/90 backdrop-blur-md border-b border-border">
        <div className="flex max-w-lg mx-auto overflow-x-auto no-scrollbar">
          {(['duel', 'classement', 'actions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-display font-bold transition-colors whitespace-nowrap px-3 ${
                tab === t ? 'text-brand border-b-2 border-brand' : 'text-muted'
              }`}>
              {t === 'duel' ? '⚔️ Duel' : t === 'classement' ? '👑 Classement' : '⚡ Actions'}
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
                    const other   = pair[idx === 0 ? 1 : 0]
                    const isWinner = voted === cat.id
                    const isLoser  = voted === other.id
                    const catAura  = leaderboard.find(c => c.id === cat.id)?.aura_score ?? BASE_AURA
                    const newAura  = isWinner ? auraChange?.winner : isLoser ? auraChange?.loser : null

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
                            {newAura ? (
                              <span className={`text-xs font-bold ${isWinner ? 'text-green-500' : 'text-red-400'}`}>
                                {isWinner ? '+' : ''}{newAura - catAura} → {newAura} pts
                              </span>
                            ) : (
                              <span className="text-xs text-muted tabular-nums">{catAura} pts</span>
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
            {recentDuels.filter(d => !d.action_name || d.winner_id !== d.loser_id).length > 0 && (
              <div>
                <p className="text-xs font-display font-bold text-muted uppercase tracking-wide mb-2">Derniers duels</p>
                <div className="space-y-1.5">
                  {recentDuels.filter(d => !d.action_name || d.winner_id !== d.loser_id).slice(0, 5).map((d, i) => {
                    const w = catMap[d.winner_id]
                    const l = catMap[d.loser_id]
                    if (!w || !l || w.id === l.id) return null
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
            {/* Reset (admin) */}
            {isAuth && (
              <div className="flex justify-end">
                <button onClick={resetAura} disabled={resetLoading}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition-colors font-semibold disabled:opacity-50">
                  <RotateCcw size={12} />
                  {resetLoading ? 'Reset…' : 'Remettre à zéro'}
                </button>
              </div>
            )}

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
                          {cat.aura_score || BASE_AURA} pts
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-gold to-amber-400' : 'bg-brand/60'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(((cat.aura_score || BASE_AURA) / maxAura) * 100)}%` }}
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

        {/* ── TAB ACTIONS ── */}
        {tab === 'actions' && (
          <div className="space-y-5">

            {/* Intro */}
            <div className="rounded-2xl bg-surface border border-border p-4">
              <p className="font-display font-bold text-text text-sm mb-1">⚡ Donner de l&apos;Aura à un chat</p>
              <p className="text-xs text-muted leading-relaxed">
                Certains comportements méritent de l&apos;aura — plus le truc est improbable, plus ça rapporte.
                Applique une action à un chat pour modifier son score directement.
              </p>
            </div>

            {/* Sélectionner un chat */}
            <div>
              <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">1. Quel chat ?</p>
              <select
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Choisir un chat…</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Choisir une action */}
            <div>
              <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">2. Quelle action ?</p>
              <div className="space-y-2">
                {allActions.map(action => {
                  const isSelected = selectedAction?.id === action.id
                  const pts = action.aura_points
                  const intensity =
                    pts <= 5   ? 'text-muted' :
                    pts <= 20  ? 'text-amber-600' :
                    pts <= 50  ? 'text-orange-500' :
                    pts <= 100 ? 'text-red-500' : 'text-purple-600'

                  return (
                    <motion.button
                      key={action.id}
                      onClick={() => setSelectedAction(isSelected ? null : action)}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected ? 'border-brand bg-brand/5' : 'border-border bg-surface hover:border-brand/30'
                      }`}
                    >
                      <span className="text-xl shrink-0">{(action as PresetAction).emoji ?? '⚡'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm text-text truncate">{action.name}</p>
                        {(action as PresetAction).note && (
                          <p className="text-[11px] text-muted italic">{(action as PresetAction).note}</p>
                        )}
                      </div>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${intensity}`}>
                        +{pts}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Appliquer */}
            <AnimatePresence>
              {selectedCatId && selectedAction && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <button
                    onClick={applyAction}
                    disabled={applyLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-teal py-3.5 text-white font-display font-bold shadow-lg disabled:opacity-50"
                  >
                    <Zap size={16} />
                    {applyLoading ? 'Application…' : `+${selectedAction.aura_points} aura à ${cats.find(c => c.id === selectedCatId)?.name ?? '…'}`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Résultat */}
            <AnimatePresence>
              {applyResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-gradient-to-br from-teal/10 to-brand/5 border border-teal/20 p-4 text-center"
                >
                  <p className="text-3xl mb-1">⚡</p>
                  <p className="font-display font-bold text-text">
                    +{applyResult.delta} aura pour {applyResult.cat_name} !
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Score : {applyResult.new_score} pts
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Créer une action custom */}
            {isAuth && (
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setShowNewAction(!showNewAction)}
                  className="flex items-center gap-2 text-sm font-display font-bold text-brand"
                >
                  <Plus size={14} />
                  Créer une action personnalisée
                  <ChevronDown size={14} className={`ml-auto transition-transform ${showNewAction ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showNewAction && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Emoji"
                            value={newActionEmoji}
                            onChange={e => setNewActionEmoji(e.target.value)}
                            className="input-field w-16 text-center text-lg"
                            maxLength={2}
                          />
                          <input
                            type="text"
                            placeholder="Nom de l'action…"
                            value={newActionName}
                            onChange={e => setNewActionName(e.target.value)}
                            className="input-field flex-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted font-semibold mb-1 block">
                            Points d&apos;aura : <span className="font-bold text-text">{newActionPts}</span>
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={999}
                            value={newActionPts}
                            onChange={e => setNewActionPts(Number(e.target.value))}
                            className="w-full accent-brand"
                          />
                          <div className="flex justify-between text-[10px] text-muted mt-0.5">
                            <span>1 (nul)</span>
                            <span>100 (fort)</span>
                            <span>999 (jetpack)</span>
                          </div>
                        </div>
                        <button
                          onClick={createAction}
                          disabled={!newActionName.trim()}
                          className="btn-primary w-full py-2.5 text-sm disabled:opacity-40"
                        >
                          Créer l&apos;action
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
