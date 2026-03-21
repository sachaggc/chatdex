import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// DELETE /api/sightings/[id] — supprime l'observation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('sightings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}

// PATCH /api/sightings/[id] — modifie photo_url et/ou seen_at
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const supabase = getSupabaseAdmin()

  const updates: Record<string, unknown> = {}
  if ('photo_url' in body) updates.photo_url = body.photo_url ?? null
  if ('seen_at'   in body) updates.seen_at   = body.seen_at
  if ('street'    in body) updates.street    = body.street ?? null

  const { data, error } = await supabase
    .from('sightings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
