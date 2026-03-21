import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// POST /api/sightings — ajoute une observation (avec ou sans photo)
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.cat_id) {
    return NextResponse.json({ error: 'cat_id requis' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('sightings')
    .insert({
      cat_id: body.cat_id,
      photo_url: body.photo_url ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      street: body.street ?? null,
      notes: body.notes ?? null,
      seen_at: body.seen_at ?? new Date().toISOString(),
      featuring_cat_ids: body.featuring_cat_ids ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
