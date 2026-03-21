import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// GET /api/cats — liste tous les chats avec le nombre d'observations
export async function GET() {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('cats')
    .select(`
      *,
      sightings(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reshape pour avoir sightings_count comme nombre directement
  const cats = (data ?? []).map((cat) => ({
    ...cat,
    sightings_count: cat.sightings?.[0]?.count ?? 0,
    sightings: undefined,
  }))

  return NextResponse.json(cats)
}

// POST /api/cats — crée un nouveau chat
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('cats')
    .insert({
      name: body.name,
      description: body.description ?? null,
      category: body.category ?? null,
      character_traits: body.character_traits ?? [],
      main_photo_url: body.main_photo_url ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
