import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/cats/:id — fiche d'un chat avec toutes ses observations
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: cat, error: catError } = await supabase
    .from('cats')
    .select('*, candidate:candidates(id, name, emoji, color, alignment:political_alignments(id, name, color, position))')
    .eq('id', id)
    .single()

  if (catError) return NextResponse.json({ error: 'Chat introuvable' }, { status: 404 })

  const { data: sightings } = await supabase
    .from('sightings')
    .select('*')
    .eq('cat_id', id)
    .order('seen_at', { ascending: false })

  // Calcule la position moyenne pour la carte globale
  const withCoords = (sightings ?? []).filter((s) => s.lat && s.lng)
  const avg_lat =
    withCoords.length > 0
      ? withCoords.reduce((a, s) => a + s.lat, 0) / withCoords.length
      : null
  const avg_lng =
    withCoords.length > 0
      ? withCoords.reduce((a, s) => a + s.lng, 0) / withCoords.length
      : null

  return NextResponse.json({
    ...cat,
    sightings: sightings ?? [],
    sightings_count: (sightings ?? []).length,
    avg_lat,
    avg_lng,
  })
}

// PATCH /api/cats/:id — modifie un chat
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('cats')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// DELETE /api/cats/:id — supprime un chat
export async function DELETE(_: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('cats').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
