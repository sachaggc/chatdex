import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const POLITICAL_ORDER = ['arthaud','melenchon','ruffin','tondelier','glucksmann','macron','attal','retailleau','lepen','knafo','soral']
function politicalIdx(name: string): number {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const i = POLITICAL_ORDER.findIndex(o => n.includes(o))
  return i === -1 ? 50 : i
}

export async function GET() {
  // All cats with candidate info
  const { data: cats, error: catsErr } = await supabase
    .from('cats')
    .select(`
      id, name, main_photo_url, vote_abstain,
      candidate:candidates(id, name, emoji, color, alignment:political_alignments(id, name, color, position)),
      sightings(id, street, lat, lng)
    `)
    .eq('unnamed', false)
  if (catsErr) return NextResponse.json({ error: catsErr.message }, { status: 500 })

  // All candidates with alignment
  const { data: candidates } = await supabase
    .from('candidates')
    .select('*, alignment:political_alignments(id, name, color, position)')
    .order('created_at')

  // All alignments
  const { data: alignments } = await supabase
    .from('political_alignments')
    .select('*')
    .order('position')

  const total = cats?.length ?? 0

  // Count per candidate
  const candidateCounts: Record<string, number> = {}
  let abstentions = 0
  let undecided   = 0

  for (const cat of cats ?? []) {
    if (cat.vote_abstain) { abstentions++; continue }
    const cid = (cat.candidate as unknown as { id: string } | null)?.id
    if (!cid) { undecided++; continue }
    candidateCounts[cid] = (candidateCounts[cid] ?? 0) + 1
  }

  const candidateStats = (candidates ?? []).map(c => ({
    ...c,
    count: candidateCounts[c.id] ?? 0,
    pct:   total > 0 ? Math.round(((candidateCounts[c.id] ?? 0) / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count)

  const candidateSpectrum = [...candidateStats].sort((a, b) => politicalIdx(a.name) - politicalIdx(b.name))

  // Count per alignment
  const alignmentCounts: Record<string, number> = {}
  for (const cat of cats ?? []) {
    if (cat.vote_abstain) continue
    const al = (cat.candidate as { alignment?: { id: string } } | null)?.alignment
    if (!al) continue
    alignmentCounts[al.id] = (alignmentCounts[al.id] ?? 0) + 1
  }

  const alignmentStats = (alignments ?? []).map(a => ({
    ...a,
    count: alignmentCounts[a.id] ?? 0,
    pct:   total > 0 ? Math.round(((alignmentCounts[a.id] ?? 0) / total) * 100) : 0,
  })).sort((a, b) => politicalIdx(a.name) - politicalIdx(b.name))

  // Per street breakdown (using sightings.street)
  const streetMap: Record<string, { total: number; byCandidate: Record<string, number> }> = {}
  for (const cat of cats ?? []) {
    const cName = (cat.candidate as unknown as { name: string } | null)?.name ?? 'Indécis'
    for (const s of (cat.sightings ?? []) as { street: string | null }[]) {
      const street = s.street ?? 'Rue inconnue'
      if (!streetMap[street]) streetMap[street] = { total: 0, byCandidate: {} }
      streetMap[street].total++
      streetMap[street].byCandidate[cName] = (streetMap[street].byCandidate[cName] ?? 0) + 1
    }
  }

  const streetStats = Object.entries(streetMap)
    .map(([street, data]) => ({ street, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Cat list with candidate for display
  const catList = (cats ?? []).map(c => ({
    id:          c.id,
    name:        c.name,
    photo:       c.main_photo_url,
    abstain:     c.vote_abstain,
    candidate:   c.candidate,
  }))

  return NextResponse.json({
    total,
    abstentions,
    undecided,
    candidateStats,
    candidateSpectrum,
    alignmentStats,
    streetStats,
    catList,
  })
}
