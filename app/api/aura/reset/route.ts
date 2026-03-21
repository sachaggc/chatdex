import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// POST /api/aura/reset — remet tous les scores à 1000
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  await Promise.all([
    supabase.from('cats').update({ aura_score: 1000 }).neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('aura_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ])

  return NextResponse.json({ ok: true })
}
