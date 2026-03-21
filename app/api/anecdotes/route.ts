import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/anecdotes?cat_id=xxx — lit les murmures d'un chat
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get('cat_id')
  if (!catId) return NextResponse.json({ error: 'cat_id requis' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('anecdotes')
    .select('*')
    .eq('cat_id', catId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/anecdotes — poste un murmure
// Body: { cat_id, username, text }
export async function POST(req: NextRequest) {
  const { cat_id, username, text } = await req.json()
  if (!cat_id || !username || !text?.trim()) {
    return NextResponse.json({ error: 'cat_id, username et text requis' }, { status: 400 })
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('anecdotes')
    .insert({ cat_id, username, text: text.trim() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/anecdotes?id=xxx — supprime un murmure
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('anecdotes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
