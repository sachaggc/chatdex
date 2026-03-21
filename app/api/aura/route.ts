import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

const K = 32       // facteur ELO
const BASE = 1000  // score ELO de départ

function elo(ra: number, rb: number): [number, number] {
  const ea = 1 / (1 + Math.pow(10, (rb - ra) / 400))
  const eb = 1 - ea
  return [
    Math.round(ra + K * (1 - ea)),
    Math.round(Math.max(0, rb + K * (0 - eb))),
  ]
}

// POST /api/aura — enregistre un vote ELO
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { winner_id, loser_id } = await request.json()
  if (!winner_id || !loser_id) {
    return NextResponse.json({ error: 'winner_id et loser_id requis' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Récupère les scores actuels (0 en DB = BASE ELO)
  const [{ data: w }, { data: l }] = await Promise.all([
    supabase.from('cats').select('aura_score').eq('id', winner_id).single(),
    supabase.from('cats').select('aura_score').eq('id', loser_id).single(),
  ])

  const ra = (w as { aura_score: number } | null)?.aura_score || BASE
  const rb = (l as { aura_score: number } | null)?.aura_score || BASE
  const [newRa, newRb] = elo(ra, rb)

  await Promise.all([
    supabase.from('cats').update({ aura_score: newRa }).eq('id', winner_id),
    supabase.from('cats').update({ aura_score: newRb }).eq('id', loser_id),
    // Historique des duels
    supabase.from('aura_votes').insert({ winner_id, loser_id }).select(),
  ])

  return NextResponse.json({ winner_elo: newRa, loser_elo: newRb })
}

// GET /api/aura — classement ELO + derniers duels
export async function GET() {
  const supabase = getSupabaseAdmin()

  const [{ data: cats }, { data: votes }] = await Promise.all([
    supabase
      .from('cats')
      .select('id, name, main_photo_url, aura_score')
      .eq('unnamed', false)
      .order('aura_score', { ascending: false })
      .limit(15),
    supabase
      .from('aura_votes')
      .select('winner_id, loser_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({ leaderboard: cats ?? [], recentDuels: votes ?? [] })
}
