import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/profiles — liste les profils
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_xp', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/profiles — crée un profil (idempotent sur username)
export async function POST(req: NextRequest) {
  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: 'username requis' }, { status: 400 })
  const supabase = getSupabaseAdmin()
  // Upsert pour éviter les doublons
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ username, total_xp: 0, level: 1, streak_days: 0, cats_discovered_count: 0, last_action_at: null }, {
      onConflict: 'username',
      ignoreDuplicates: true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
