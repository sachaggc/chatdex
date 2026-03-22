'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

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

/* ── SVG Pie Chart ── */
function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 360) end = start + 359.99
  const s = polarToXY(cx, cy, r, start)
  const e = polarToXY(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

function PieChart({ data }: { data: { label: string; value: number; color: string; emoji: string }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return (
    <div className="flex items-center justify-center h-40 text-muted text-sm">Aucun vote enregistré</div>
  )

  let cursor = 0
  const slices = data.filter(d => d.value > 0).map(d => {
    const angle = (d.value / total) * 360
    const s = { ...d, start: cursor, angle }
    cursor += angle
    return s
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-44 h-44">
        {slices.map((s, i) => (
          <motion.path
            key={s.label}
            d={slicePath(100, 100, 85, s.start, s.start + s.angle)}
            fill={s.color}
            opacity={hovered === null || hovered === i ? 1 : 0.45}
            onHoverStart={() => setHovered(i)}
            onHoverEnd={() => setHovered(null)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: hovered === null || hovered === i ? 1 : 0.45 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="cursor-pointer"
          >
            <title>{s.emoji} {s.label} · {Math.round((s.value / total) * 100)}%</title>
          </motion.path>
        ))}
        {/* Trou donut */}
        <circle cx="100" cy="100" r="42" fill="var(--color-bg, #FDF8F2)" />
        {/* Label central */}
        <text x="100" y="96" textAnchor="middle" className="fill-text" fontSize="11" fontWeight="bold">
          {hovered !== null ? `${Math.round((slices[hovered].value / total) * 100)}%` : `${total}`}
        </text>
        <text x="100" y="110" textAnchor="middle" className="fill-muted" fontSize="8">
          {hovered !== null ? slices[hovered].emoji : 'chats'}
        </text>
      </svg>

      {/* Légende */}
      <div className="w-full space-y-1">
        {slices.map((s, i) => (
          <motion.div
            key={s.label}
            className="flex items-center gap-2 text-xs cursor-pointer rounded-lg px-2 py-1 transition-colors"
            style={hovered === i ? { background: s.color + '22' } : {}}
            onHoverStart={() => setHovered(i)}
            onHoverEnd={() => setHovered(null)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="font-semibold text-text flex-1 truncate">{s.emoji} {s.label}</span>
            <span className="text-muted font-mono">{s.value} · {Math.round((s.value / total) * 100)}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ── Spectre politique (barre gauche→droite) ── */
function Spectre({ alignments }: { alignments: AlignmentStat[] }) {
  const total = alignments.reduce((s, a) => s + a.count, 0)
  if (total === 0) return null
  return (
    <div className="space-y-1">
      <div className="flex rounded-full overflow-hidden h-7 border border-border">
        {alignments.filter(a => a.count > 0).map((a, i) => (
          <motion.div
            key={a.id}
            style={{ background: a.color, flex: a.count }}
            className="flex items-center justify-center text-white text-[9px] font-bold overflow-hidden"
            title={`${a.name} · ${a.pct}%`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {a.pct >= 10 ? `${a.pct}%` : ''}
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted px-1">
        <span>← Extrême-Gauche</span>
        <span>Extrême-Droite →</span>
      </div>
      <div className="grid grid-cols-2 gap-1 mt-2">
        {alignments.filter(a => a.count > 0).map(a => (
          <div key={a.id} className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ background: a.color }} />
            <span className="text-text font-medium truncate">{a.name}</span>
            <span className="text-muted ml-auto">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Simulateur de Coalitions ── */
function CoalitionSim({ candidates, total }: { candidates: Candidate[]; total: number }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { count, pct, color } = useMemo(() => {
    const c = candidates.filter(c => selected.has(c.id)).reduce((s, c) => s + c.count, 0)
    const p = total > 0 ? Math.round((c / total) * 100) : 0
    const colors = candidates.filter(c => selected.has(c.id)).map(c => c.color)
    const col = colors[0] ?? '#888'
    return { count: c, pct: p, color: col }
  }, [selected, candidates, total])

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Coche des candidats pour simuler une coalition :</p>
      <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
        {candidates.map(c => (
          <label key={c.id} className="flex items-center gap-2 cursor-pointer rounded-xl border border-border p-2.5 transition-colors"
            style={selected.has(c.id) ? { borderColor: c.color, background: c.color + '15' } : {}}>
            <input
              type="checkbox"
              className="accent-brand"
              checked={selected.has(c.id)}
              onChange={() => setSelected(prev => {
                const n = new Set(prev)
                n.has(c.id) ? n.delete(c.id) : n.add(c.id)
                return n
              })}
            />
            <span className="text-sm">{c.emoji}</span>
            <span className="text-sm font-medium text-text flex-1">{c.name}</span>
            <span className="text-xs text-muted">{c.pct}%</span>
          </label>
        ))}
      </div>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border-2 p-4 text-center"
            style={{ borderColor: color, background: color + '15' }}
          >
            <p className="text-3xl font-display font-black" style={{ color }}>{pct}%</p>
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

/* ── Admin candidats ── */
function AdminPanel({ onRefresh }: { onRefresh: () => void }) {
  const [alignments, setAlignments] = useState<Alignment[]>([])
  const [candidates, setCandidates] = useState<(Candidate & { alignment: Alignment | null })[]>([])
  const [newName, setNewName]   = useState('')
  const [newEmoji, setNewEmoji] = useState('🐾')
  const [newColor, setNewColor] = useState('#888888')
  const [newAlign, setNewAlign] = useState('')
  const [saving, setSaving]     = useState(false)

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
    setCandidates(data)
    onRefresh()
    setSaving(false)
  }

  async function deleteCandidate(id: string) {
    if (!confirm('Supprimer ce candidat ?')) return
    await fetch('/api/political/candidates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCandidates(prev => prev.filter(c => c.id !== id))
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Liste candidats existants */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {candidates.map(c => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl bg-surface border border-border px-3 py-2">
            <span className="text-base">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{c.name}</p>
              <p className="text-xs text-muted">{c.alignment?.name ?? 'Sans bord'}</p>
            </div>
            <div className="h-3 w-3 rounded-full shrink-0" style={{ background: c.color }} />
            <button onClick={() => deleteCandidate(c.id)} className="text-muted hover:text-red-400 transition-colors text-xs px-1">✕</button>
          </div>
        ))}
      </div>

      {/* Ajouter */}
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
    const data = await fetch('/api/political/stats').then(r => r.json())
    setStats(data)
    setLoading(false)
  }

  useEffect(() => {
    loadStats()
    fetch('/api/auth').then(r => setIsAuth(r.ok))
  }, [])

  const pieData = useMemo(() => {
    if (!stats) return []
    return stats.candidateStats
      .filter(c => c.count > 0)
      .map(c => ({ label: c.name, value: c.count, color: c.color, emoji: c.emoji }))
  }, [stats])

  if (loading) return (
    <div className="min-h-svh flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )

  const tabs = [
    { key: 'sondage',    label: '🗳️ Sondage'    },
    { key: 'coalitions', label: '🤝 Coalitions'  },
    { key: 'rues',       label: '🗺️ Par rue'     },
    ...(isAuth ? [{ key: 'admin', label: '⚙️ Admin' }] : []),
  ] as const

  return (
    <div className="min-h-svh pb-28">
      <TopBar title="🗳️ Félitics — Océan" />

      {/* Header satirique */}
      <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-surface to-transparent">
        <div className="rounded-2xl border border-border bg-surface p-4 text-center space-y-1">
          <p className="text-xs font-display font-bold text-muted uppercase tracking-widest">Quartier Océan · Rue Adis Abeba</p>
          <h1 className="text-xl font-display font-black text-text leading-tight">
            {(stats?.candidateStats[0]?.count ?? 0) > 0
              ? `${stats!.candidateStats[0].emoji} ${stats!.candidateStats[0].name} en tête !`
              : 'Aucun vote enregistré'}
          </h1>
          <p className="text-xs text-muted">
            {stats?.total ?? 0} chats · {stats?.abstentions ?? 0} abstentions · {stats?.undecided ?? 0} indécis
          </p>
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            {(stats?.candidateStats[0]?.count ?? 0) > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: stats!.candidateStats[0].color }}>
                {stats!.candidateStats[0].pct}% des chats
              </span>
            )}
            {(stats?.abstentions ?? 0) + (stats?.undecided ?? 0) > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted/20 text-muted">
                {Math.round(((stats!.abstentions + stats!.undecided) / (stats!.total || 1)) * 100)}% n&apos;ont pas voté
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`shrink-0 text-xs font-display font-bold px-3 py-1.5 rounded-full border transition-all ${
              tab === t.key
                ? 'bg-brand text-white border-brand'
                : 'bg-surface text-muted border-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-5">
        <AnimatePresence mode="wait">
          {tab === 'sondage' && (
            <motion.div key="sondage"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="space-y-5"
            >
              {/* Camembert */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-4">
                  MatouMètre™ — Intentions de vote
                </p>
                <PieChart data={pieData} />
              </div>

              {/* Spectre politique */}
              {stats && (
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-3">
                    Spectre politique
                  </p>
                  <Spectre alignments={stats.alignmentStats} />
                </div>
              )}

              {/* Liste chats par candidat */}
              {stats?.candidateStats.filter(c => c.count > 0).map(cand => (
                <div key={cand.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-2" style={{ borderLeft: `4px solid ${cand.color}` }}>
                    <span className="text-xl">{cand.emoji}</span>
                    <div className="flex-1">
                      <p className="font-display font-bold text-sm text-text">{cand.name}</p>
                      <p className="text-xs text-muted">{cand.alignment?.name ?? 'Sans bord'}</p>
                    </div>
                    <span className="text-lg font-black" style={{ color: cand.color }}>{cand.pct}%</span>
                  </div>
                  <div className="flex gap-2 px-4 pb-3 flex-wrap mt-2">
                    {stats.catList.filter(c => c.candidate?.id === cand.id).map(cat => (
                      <a key={cat.id} href={`/cats/${cat.id}`} className="flex items-center gap-1.5 rounded-xl border border-border px-2 py-1">
                        {cat.photo && (
                          <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0">
                            <Image src={cat.photo} alt={cat.name} fill className="object-cover" />
                          </div>
                        )}
                        <span className="text-xs font-medium text-text">{cat.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              {/* Abstentionnistes */}
              {(stats?.abstentions ?? 0) > 0 && (
                <div className="rounded-2xl border border-dashed border-muted/30 bg-surface p-4">
                  <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">
                    🛋️ Abstentionnistes ({stats!.abstentions})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {stats!.catList.filter(c => c.abstain).map(cat => (
                      <a key={cat.id} href={`/cats/${cat.id}`} className="text-xs text-muted border border-border rounded-xl px-2 py-1">{cat.name}</a>
                    ))}
                  </div>
                </div>
              )}

              {/* Indécis */}
              {(stats?.undecided ?? 0) > 0 && (
                <div className="rounded-2xl border border-dashed border-muted/30 bg-surface p-4">
                  <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-2">
                    🤷 Chats indécis ({stats!.undecided})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {stats!.catList.filter(c => !c.abstain && !c.candidate).map(cat => (
                      <a key={cat.id} href={`/cats/${cat.id}`} className="text-xs text-muted border border-border rounded-xl px-2 py-1">{cat.name}</a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'coalitions' && stats && (
            <motion.div key="coalitions"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            >
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-4">
                  Simulateur de coalitions
                </p>
                <CoalitionSim candidates={stats.candidateStats} total={stats.total} />
              </div>
            </motion.div>
          )}

          {tab === 'rues' && stats && (
            <motion.div key="rues"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="space-y-3"
            >
              {stats.streetStats.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">Pas encore assez de données de localisation</p>
              ) : stats.streetStats.map((s, i) => (
                <motion.div
                  key={s.street}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-display font-bold text-text truncate">📍 {s.street}</p>
                    <span className="text-xs text-muted shrink-0 ml-2">{s.total} obs.</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(s.byCandidate)
                      .sort(([,a],[,b]) => b - a)
                      .map(([cname, cnt]) => {
                        const cand = stats.candidateStats.find(c => c.name === cname)
                        return (
                          <div key={cname} className="flex items-center gap-2 text-xs">
                            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cand?.color ?? '#888' }} />
                            <span className="text-muted flex-1 truncate">{cname}</span>
                            <span className="font-bold text-text">{cnt}</span>
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
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            >
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-display font-bold text-muted uppercase tracking-widest mb-4">
                  Gérer les candidats
                </p>
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
