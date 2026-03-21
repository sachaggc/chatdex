import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// POST /api/aura — enregistre un vote d'aura
// body: { winner_id: string, loser_id: string }
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { winner_id, loser_id } = await request.json()
  if (!winner_id || !loser_id) {
    return NextResponse.json({ error: 'winner_id et loser_id requis' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Incrémente le score du gagnant (+1), décrémente le perdant (-1, min 0)
  // On fait deux PATCH séparés
  const [{ data: winner }, { data: loser }] = await Promise.all([
    supabase.from('cats').select('aura_score').eq('id', winner_id).single(),
    supabase.from('cats').select('aura_score').eq('id', loser_id).single(),
  ])

  await Promise.all([
    supabase.from('cats').update({ aura_score: ((winner as {aura_score:number}|null)?.aura_score ?? 0) + 1 }).eq('id', winner_id),
    supabase.from('cats').update({ aura_score: Math.max(0, ((loser as {aura_score:number}|null)?.aura_score ?? 0) - 1) }).eq('id', loser_id),
  ])

  return NextResponse.json({ ok: true })
}

// GET /api/aura — classement aura
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('cats')
    .select('id, name, main_photo_url, aura_score')
    .eq('unnamed', false)
    .order('aura_score', { ascending: false })
    .limit(10)

  return NextResponse.json(data ?? [])
}
