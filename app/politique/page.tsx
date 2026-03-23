'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { SkeletonBox, SkeletonText, SkeletonCandidateCard, SkeletonCatGrid } from '@/components/Skeleton'

/* ── Types ── */
interface Alignment { id: string; name: string; color: string; position: number }
interface Candidate {
  id: string; name: string; emoji: string; color: string
  count: number; pct: number
  alignment: Alignment | null
}
interface AlignmentStat extends Alignment { count: number; pct: number }
interface CatEntry {
  id: string; name: string; photo: string | null; abstain: boolean
  candidate: { id: string; name: string; emoji: string; color: string } | null
}
interface StreetStat { street: string; total: number; byCandidate: Record<string, number> }
interface Stats {
  total: number; abstentions: number; undecided: number
  candidateStats: Candidate[]
  alignmentStats: AlignmentStat[]
  streetStats: StreetStat[]
  catList: CatEntry[]
}

/* ── Second Tour duel ── */
function SecondTour({ a, b, total }: { a: Candidate; b: Candidate; total: number }) {
  const voted = a.count + b.count
  const pctA = voted > 0 ? Math.round((a.count / voted) * 100) : 0
  const pctB = 100 - pctA
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="bg-navy px-4 py-2.5 flex items-center gap-2">
        <span className="text-white/50 text-[10px] font-display font-bold uppercase tracking-widest">🗳️ Premier Tour — Qualifiés au Second Tour</span>
        <span className="ml-auto text-[10px] text-white/40">{voted} votes comptabilisés</span>
      </div>
      <div className="grid grid-cols-2">
        {[{ c: a, p: pctA }, { c: b, p: pctB }].map(({ c, p }, i) => (
          <div key={c.id}
            className={`p-4 text-center ${i === 0 ? 'border-r border-border' : ''}`}
            style={{ background: c.color + '08' }}>
            <div className="text-3xl mb-0.5">{c.emoji}</div>
            <p className="font-display font-bold text-xs text-text leading-tight truncate px-1">
              {c.name.split(' ').slice(-1)[0]}
            </p>
            <motion.p
              className="font-display font-black text-3xl mt-1 leading-none"
              style={{ color: c.color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {p}%
            </motion.p>
            <p className="text-xs text-muted mt-0.5">{c.count} chat{c.count > 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>
      {/* Barre de partage */}
      <div className="h-2 flex">
        <motion.div style={{ background: a.color, flex: pctA }}
          initial={{ flex: 0 }} animate={{ flex: pctA }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
        <motion.div style={{ background: b.color, flex: pctB }}
          initial={{ flex: 0 }} animate={{ flex: pctB }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <div className="px-4 py-2 text-xs text-center text-muted/60 italic">
        {pctA > pctB
          ? `${a.emoji} ${a.name.split(' ').pop()} en tête au premier tour`
          : `${b.emoji} ${b.name.split(' ').pop()} en tête au premier tour`}
      </div>
    </div>
  )
}

/* ── Spectre ── */
function Spectre({ alignments }: { alignments: AlignmentStat[] }) {
  const total = alignments.reduce((s, a) => s + a.count, 0)
  if (total === 0) return null
  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-6 border border-border">
        {alignments.filter(a => a.count > 0).map(a => (
          <motion.div key={a.id} style={{ background: a.color, flex: a.count }}
            title={`${a.name} · ${a.pct}%`}
            initial={{ flex: 0 }} animate={{ flex: a.count }} transition={{ duration: 0.7 }}
            className="flex items-center justify-center text-white text-[9px] font-bold overflow-hidden">
            {a.pct >= 12 ? `${a.pct}%` : ''}
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted px-0.5">
        <span>← Gauche</span><span>Droite →</span>
      </div>
    </div>
  )
}

/* ── Simulateur Coalitions + Parlement ── */
function CoalitionSim({ candidates, catList, total }: { candidates: Candidate[]; catList: CatEntry[]; total: number }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { count, pct, colors } = useMemo(() => {
    const sel = candidates.filter(c => selected.has(c.id))
    const c = sel.reduce((s, c) => s + c.count, 0)
    const p = total > 0 ? Math.round((c / total) * 100) : 0
    return { count: c, pct: p, colors: sel.map(c => c.color) }
  }, [selected, candidates, total])

  // Parliament: N seats in a semicircle
  const parliamentCats = useMemo(() => {
    return catList.filter(c => c.candidate)
      .sort((a, b) => {
        // Sort by alignment position (left to right)
        const pa = candidates.find(c => c.id === a.candidate?.id)?.alignment?.position ?? 99
        const pb = candidates.find(c => c.id === b.candidate?.id)?.alignment?.position ?? 99
        return pa - pb
      })
  }, [catList, candidates])

  const selectedCandidateIds = selected

  return (
    <div className="space-y-4">
      {/* Mini-parlement de chats */}
      {parliamentCats.length > 0 && (
        <div>
          <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">
            🏛️ Chambre Féline ({parliamentCats.length} député{parliamentCats.length > 1 ? 's' : ''})
          </p>
          <div className="rounded-2xl border border-border bg-surface p-4">
            {/* Hémicycle en rangées */}
            <div className="flex flex-wrap gap-1 justify-center">
              {parliamentCats.map(cat => {
                const cand = candidates.find(c => c.id === cat.candidate?.id)
                const isSelected = cand ? selectedCandidateIds.has(cand.id) : false
                return (
                  <div key={cat.id} title={`${cat.name} — ${cat.candidate?.name}`}
                    className={`relative h-7 w-7 rounded-full overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'
                    }`}
                    style={isSelected ? { boxShadow: `0 0 8px ${cand?.color}88` } : {}}
                  >
                    {cat.photo
                      ? <Image src={cat.photo} alt={cat.name} fill className="object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-[9px]" style={{ background: cand?.color ?? '#888' }}>🐱</div>
                    }
                    {isSelected && <div className="absolute inset-0 ring-2 ring-white/40 rounded-full" style={{ background: (cand?.color ?? '#888') + '33' }} />}
                  </div>
                )
              })}
            </div>
            {selected.size > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-xs font-bold mt-3"
                style={{ color: colors[0] }}>
                Coalition : {count} siège{count > 1 ? 's' : ''} · {pct}%
                {pct >= 50 && ' 🏆 Majorité !'}
              </motion.p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">Coche des candidats pour simuler une coalition :</p>
      <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
        {candidates.map(c => (
          <label key={c.id} className="flex items-center gap-2 cursor-pointer rounded-xl border border-border p-2.5 transition-colors"
            style={selected.has(c.id) ? { borderColor: c.color, background: c.color + '15' } : {}}>
            <input type="checkbox" className="accent-brand"
              checked={selected.has(c.id)}
              onChange={() => setSelected(prev => {
                const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n
              })} />
            <span className="text-sm">{c.emoji}</span>
            <span className="text-sm font-medium text-text flex-1">{c.name}</span>
            <span className="text-xs text-muted">{c.pct}%</span>
          </label>
        ))}
      </div>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border-2 p-4 text-center"
            style={{ borderColor: colors[0] ?? '#888', background: (colors[0] ?? '#888') + '15' }}>
            <p className="text-3xl font-display font-black" style={{ color: colors[0] ?? '#888' }}>{pct}%</p>
            <p className="text-sm font-semibold text-text mt-0.5">
              {count} chat{count > 1 ? 's' : ''} · {selected.size} candidat{selected.size > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted mt-1 italic">
              {pct >= 50 ? '🏆 Majorité absolue !' : pct >= 33 ? '⚡ Force significative' : '📊 Coalition en formation'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {selected.size > 0 && (
        <button onClick={() => setSelected(new Set())} className="text-xs text-muted underline underline-offset-2">
          Tout désélectionner
        </button>
      )}
    </div>
  )
}

/* ── Admin ── */
function AdminPanel({ onRefresh }: { onRefresh: () => void }) {
  const [alignments, setAlignments] = useState<Alignment[]>([])
  const [candidates, setCandidates] = useState<(Candidate & { alignment: Alignment | null })[]>([])
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🐾')
  const [newColor, setNewColor] = useState('#888888')
  const [newAlign, setNewAlign] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editAlign, setEditAlign] = useState('')

  useEffect(() => {
    fetch('/api/political/alignments').then(r => r.json()).then(setAlignments)
    fetch('/api/political/candidates').then(r => r.json()).then(setCandidates)
  }, [])

  async function addCandidate() {
    if (!newName.trim()) return
    setSaving(true)
    await fetch('/api/political/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, color: newColor, alignment_id: newAlign || null }),
    })
    setNewName(''); setNewEmoji('🐾'); setNewColor('#888888'); setNewAlign('')
    const data = await fetch('/api/political/candidates').then(r => r.json())
    setCandidates(data); onRefresh(); setSaving(false)
  }

  async function deleteCandidate(id: string) {
    if (!confirm('Supprimer ce candidat ?')) return
    await fetch('/api/political/candidates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCandidates(prev => prev.filter(c => c.id !== id)); onRefresh()
  }

  async function saveEdit(id: string) {
    await fetch('/api/political/candidates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim(), emoji: editEmoji, color: editColor, alignment_id: editAlign || null }),
    })
    setEditingId(null)
    const data = await fetch('/api/political/candidates').then(r => r.json())
    setCandidates(data)
    onRefresh()
  }

  return (
    <div className="space-y-5">
      {/* Candidats — avec édition inline */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {candidates.map(c => (
          editingId === c.id ? (
            /* Mode édition */
            <div key={c.id} className="rounded-xl border-2 border-brand/40 bg-surface p-3 space-y-2">
              <div className="flex gap-2">
                <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)}
                  className="input-field w-14 text-center text-xl p-1" maxLength={4} />
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="input-field flex-1 text-sm" placeholder="Nom" />
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2 flex-1 rounded-xl border border-border px-3 py-2">
                  <span className="text-xs text-muted">Couleur</span>
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                    className="h-6 w-8 rounded cursor-pointer border-0 bg-transparent" />
                </div>
                <select value={editAlign} onChange={e => setEditAlign(e.target.value)} className="input-field flex-1 text-sm">
                  <option value="">Sans bord</option>
                  {alignments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingId(null)}
                  className="flex-1 rounded-xl border border-border py-2 text-xs text-muted font-semibold hover:bg-parchment transition-colors">
                  Annuler
                </button>
                <button onClick={() => saveEdit(c.id)}
                  className="flex-1 btn-primary py-2 text-xs">
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            /* Mode affichage */
            <div key={c.id}
              className="flex items-center gap-2 rounded-xl bg-surface border border-border px-3 py-2 cursor-pointer hover:border-brand/40 transition-colors"
              onClick={() => { setEditingId(c.id); setEditName(c.name); setEditEmoji(c.emoji); setEditColor(c.color); setEditAlign(c.alignment?.id ?? '') }}>
              <span className="text-base">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{c.name}</p>
                <p className="text-xs text-muted">{c.alignment?.name ?? 'Sans bord'}</p>
              </div>
              <div className="h-3 w-3 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-[10px] text-muted/60 font-semibold">✎</span>
              <button onClick={e => { e.stopPropagation(); deleteCandidate(c.id) }}
                className="text-muted hover:text-red-400 transition-colors text-xs px-1">✕</button>
            </div>
          )
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border p-4 space-y-3">
        <p className="text-xs font-bold text-muted uppercase tracking-widest">Nouveau candidat</p>
        <div className="flex gap-2">
          <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} className="input-field w-14 text-center text-xl p-1" maxLength={4} />
          <input value={newName} onChange={e => setNewName(e.target.value)} className="input-field flex-1" placeholder="Nom du candidat" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 flex-1 rounded-xl border border-border px-3 py-2">
            <span className="text-xs text-muted">Couleur</span>
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-6 w-8 rounded cursor-pointer border-0 bg-transparent" />
          </div>
          <select value={newAlign} onChange={e => setNewAlign(e.target.value)} className="input-field flex-1">
            <option value="">Sans bord</option>
            {alignments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <button onClick={addCandidate} disabled={saving || !newName.trim()} className="btn-primary w-full">
          {saving ? 'Ajout…' : '+ Ajouter le candidat'}
        </button>
      </div>
    </div>
  )
}

/* ── Page principale ── */
export default function PolitiquePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sondage' | 'coalitions' | 'rues' | 'admin'>('sondage')
  const [isAuth, setIsAuth] = useState(false)

  async function loadStats() {
    const CACHE_KEY = 'chatdex_politique_cache'
    const mutationTs = parseInt(localStorage.getItem('chatdex_last_mutation') ?? '0', 10)
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, cachedAt } = JSON.parse(cached)
        if (cachedAt >= mutationTs) { setStats(data); setLoading(false); return }
      }
    } catch { /* ignore */ }
    fetch('/api/political/stats').then(r => r.json()).then(data => {
      setStats(data)
      setLoading(false)
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }))
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    loadStats()
    fetch('/api/auth').then(r => setIsAuth(r.ok))
  }, [])

  const top2 = useMemo(() => {
    if (!stats) return []
    return stats.candidateStats.filter(c => c.count > 0).slice(0, 2)
  }, [stats])

  const abstentionPct = stats ? Math.round(((stats.abstentions + stats.undecided) / (stats.total || 1)) * 100) : 0

  if (loading) return (
    <div className="min-h-svh pb-24">
      <TopBar title="Félitics" backHref="/arenes" />
      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
        {/* Onglets */}
        <div className="flex gap-1 border-b border-border pb-3">
          <SkeletonBox className="h-9 w-24 rounded-full" />
          <SkeletonBox className="h-9 w-20 rounded-full opacity-60" />
          <SkeletonBox className="h-9 w-28 rounded-full opacity-60" />
          <SkeletonBox className="h-9 w-16 rounded-full opacity-60" />
        </div>
        {/* Résumé */}
        <SkeletonBox className="h-24 rounded-2xl" />
        {/* Candidats */}
        <div className="space-y-2.5">
          <SkeletonText className="w-1/3" />
          {[...Array(4)].map((_, i) => <SkeletonCandidateCard key={i} />)}
        </div>
        {/* Grille chats */}
        <div className="pt-2 space-y-3">
          <SkeletonText className="w-1/2" />
          <SkeletonCatGrid n={6} />
        </div>
      </div>
      <BottomNav />
    </div>
  )

  const tabs = [
    { key: 'sondage',    label: '🗳️ Résultats'  },
    { key: 'coalitions', label: '🤝 Coalitions'  },
    { key: 'rues',       label: '📍 Par rue'     },
    ...(isAuth ? [{ key: 'admin', label: '⚙️ Admin' }] : []),
  ] as const

  return (
    <div className="min-h-svh pb-28">
      <TopBar backHref="/arenes" title="🗳️ Félitics — Océan" />

      {/* Hero compact */}
      <div className="px-4 pt-4 pb-3">
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <p className="text-[10px] font-display font-bold text-muted uppercase tracking-widest">Quartier Océan · Rue Adis Abeba</p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-lg font-display font-black text-text leading-tight">
              {(top2[0]?.count ?? 0) > 0
                ? `${top2[0].emoji} ${top2[0].name.split(' ').pop()} en tête`
                : 'Aucun vote enregistré'}
            </h1>
            <div className="flex gap-1.5 flex-wrap">
              {(top2[0]?.count ?? 0) > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: top2[0].color }}>
                  {top2[0].pct}%
                </span>
              )}
              {abstentionPct > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted/15 text-muted">
                  {abstentionPct}% abstention
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted">{stats?.total ?? 0} chats · <Link href="/aura" className="underline underline-offset-2">⚔️ Aura Farm</Link></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`shrink-0 text-xs font-display font-bold px-3 py-1.5 rounded-full border transition-all ${
              tab === t.key ? 'bg-brand text-white border-brand' : 'bg-surface text-muted border-border'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        <AnimatePresence mode="wait">
          {tab === 'sondage' && (
            <motion.div key="sondage"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-4">

              {/* Second Tour */}
              {top2.length === 2 && <SecondTour a={top2[0]} b={top2[1]} total={stats!.total} />}
              {top2.length === 1 && (
                <div className="rounded-2xl border border-border bg-surface p-6 text-center">
                  <div className="text-4xl mb-2">{top2[0].emoji}</div>
                  <p className="font-display font-black text-text">{top2[0].name}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: top2[0].color }}>{top2[0].pct}%</p>
                  <p className="text-xs text-muted mt-1">Candidat unique avec des votes</p>
                </div>
              )}
              {top2.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
                  <p className="text-2xl mb-2">🗳️</p>
                  <p className="text-sm font-semibold">Aucun vote pour l&apos;instant</p>
                  <p className="text-xs mt-1">Attribue un candidat à chaque chat depuis sa fiche</p>
                </div>
              )}

              {/* Classement complet */}
              {stats && stats.candidateStats.filter(c => c.count > 0).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-display font-bold text-muted uppercase tracking-widest">Classement général</p>
                  {stats.candidateStats.filter(c => c.count > 0).map((c, i) => (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-xl bg-surface border border-border px-3 py-2.5">
                      <span className="text-lg shrink-0">{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{c.name}</p>
                        {c.alignment && (
                          <p className="text-[10px] text-muted">{c.alignment.name}</p>
                        )}
                        <div className="h-1.5 rounded-full bg-border mt-1 overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: c.color }}
                            initial={{ width: 0 }} animate={{ width: `${c.pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-black tabular-nums" style={{ color: c.color }}>{c.pct}%</span>
                        <p className="text-[10px] text-muted">{c.count} chat{c.count > 1 ? 's' : ''}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Spectre */}
              {stats && (
                <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                  <p className="text-xs font-display font-bold text-muted uppercase tracking-widest">Spectre gauche → droite</p>
                  <Spectre alignments={stats.alignmentStats} />
                </div>
              )}

              {/* Cats par candidat */}
              {stats?.candidateStats.filter(c => c.count > 0).map(cand => (
                <div key={cand.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderLeft: `3px solid ${cand.color}` }}>
                    <span>{cand.emoji}</span>
                    <p className="font-display font-bold text-xs text-text flex-1">{cand.name}</p>
                    <span className="text-xs font-bold" style={{ color: cand.color }}>{cand.pct}%</span>
                  </div>
                  <div className="flex gap-1.5 px-4 pb-3 flex-wrap pt-2">
                    {stats.catList.filter(c => c.candidate?.id === cand.id).map(cat => (
                      <Link key={cat.id} href={`/cats/${cat.id}`}
                        className="flex items-center gap-1 rounded-xl border border-border px-2 py-1">
                        {cat.photo && (
                          <div className="relative h-5 w-5 rounded-full overflow-hidden shrink-0">
                            <Image src={cat.photo} alt={cat.name} fill className="object-cover" />
                          </div>
                        )}
                        <span className="text-xs font-medium text-text">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Abstentions + Indécis */}
              {((stats?.abstentions ?? 0) > 0 || (stats?.undecided ?? 0) > 0) && (
                <div className="rounded-2xl border border-dashed border-border p-4 space-y-2">
                  {(stats?.abstentions ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted mb-1">🛋️ Abstentionnistes ({stats!.abstentions})</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {stats!.catList.filter(c => c.abstain).map(cat => (
                          <Link key={cat.id} href={`/cats/${cat.id}`} className="text-xs text-muted border border-border rounded-xl px-2 py-0.5">{cat.name}</Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {(stats?.undecided ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted mb-1">🤷 Indécis ({stats!.undecided})</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {stats!.catList.filter(c => !c.abstain && !c.candidate).map(cat => (
                          <Link key={cat.id} href={`/cats/${cat.id}`} className="text-xs text-muted border border-border rounded-xl px-2 py-0.5">{cat.name}</Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'coalitions' && stats && (
            <motion.div key="coalitions"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-4">
                  Simulateur de coalitions + Chambre Féline
                </p>
                <CoalitionSim candidates={stats.candidateStats} catList={stats.catList} total={stats.total} />
              </div>
            </motion.div>
          )}

          {tab === 'rues' && stats && (
            <motion.div key="rues"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="space-y-3">
              {stats.streetStats.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-sm text-muted">Pas encore assez de données de localisation</p>
                  {isAuth && (
                    <button onClick={() => setTab('admin')}
                      className="text-xs text-brand underline underline-offset-2">
                      → Géocoder les lieux depuis l&apos;onglet Admin
                    </button>
                  )}
                </div>
              ) : stats.streetStats.map((s, i) => (
                <motion.div key={s.street}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-display font-bold text-text truncate">📍 {s.street}</p>
                    <span className="text-xs text-muted shrink-0 ml-2">{s.total} obs.</span>
                  </div>
                  {/* Mini barre politique de la rue */}
                  <div className="flex h-2 rounded-full overflow-hidden mb-2">
                    {Object.entries(s.byCandidate).sort(([,a],[,b]) => b - a).map(([cname, cnt]) => {
                      const cand = stats.candidateStats.find(c => c.name === cname)
                      return (
                        <div key={cname} style={{ background: cand?.color ?? '#888', flex: cnt }}
                          title={`${cname}: ${cnt}`} />
                      )
                    })}
                  </div>
                  <div className="space-y-0.5">
                    {Object.entries(s.byCandidate).sort(([,a],[,b]) => b - a).slice(0, 3).map(([cname, cnt]) => {
                      const cand = stats.candidateStats.find(c => c.name === cname)
                      return (
                        <div key={cname} className="flex items-center gap-1.5 text-xs">
                          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cand?.color ?? '#888' }} />
                          <span className="text-muted flex-1 truncate">{cname}</span>
                          <span className="font-bold text-text tabular-nums">{cnt}</span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 'admin' && isAuth && (
            <motion.div key="admin"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-4">Admin</p>
                <AdminPanel onRefresh={loadStats} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
