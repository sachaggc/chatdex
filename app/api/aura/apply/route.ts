import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

const BASE_AURA = 1000

// POST /api/aura/apply — applique X points d'aura à un chat suite à une action
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { cat_id, action_name, aura_points } = await request.json()
  if (!cat_id || !action_name || typeof aura_points !== 'number') {
    return NextResponse.json({ error: 'cat_id, action_name et aura_points requis' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Score actuel
  const { data: cat } = await supabase
    .from('cats')
    .select('aura_score, name')
    .eq('id', cat_id)
    .single()

  const currentScore = (cat as { aura_score: number; name: string } | null)?.aura_score ?? BASE_AURA
  const newScore = Math.max(0, currentScore + aura_points)

  await supabase
    .from('cats')
    .update({ aura_score: newScore })
    .eq('id', cat_id)

  // Log dans aura_votes pour l'historique (on réutilise la table avec winner_id = cat_id, loser_id = null simulé)
  await supabase
    .from('aura_votes')
    .insert({
      winner_id: cat_id,
      loser_id: cat_id, // auto-vote pour une action
      action_name,
      aura_delta: aura_points,
    })
    .select()

  return NextResponse.json({
    cat_name: (cat as { aura_score: number; name: string } | null)?.name ?? '',
    old_score: currentScore,
    new_score: newScore,
    delta: aura_points,
  })
}
