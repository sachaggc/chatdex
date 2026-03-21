import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// POST /api/cats/merge — fusionne deux chats (transfère les observations de source vers target)
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { source_id, target_id } = await request.json()
  if (!source_id || !target_id || source_id === target_id) {
    return NextResponse.json({ error: 'IDs invalides' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Transfère toutes les observations du chat source vers le chat cible
  const { error: sightingError } = await supabase
    .from('sightings')
    .update({ cat_id: target_id })
    .eq('cat_id', source_id)

  if (sightingError) return NextResponse.json({ error: sightingError.message }, { status: 500 })

  // Supprime le chat source
  const { error: deleteError } = await supabase.from('cats').delete().eq('id', source_id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ ok: true, target_id })
}
