import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { XP_REWARDS, XpAction, getLevelInfo } from '@/lib/levels'

// POST /api/xp — enregistre une action XP
// Body: { username, action, cat_id? }
export async function POST(req: NextRequest) {
  const { username, action, cat_id, meta } = await req.json() as {
    username: string
    action: XpAction
    cat_id?: string
    meta?: Record<string, unknown>
  }

  if (!username || !action || !(action in XP_REWARDS)) {
    return NextResponse.json({ error: 'username et action valide requis' }, { status: 400 })
  }

  const amount = XP_REWARDS[action]
  const supabase = getSupabaseAdmin()

  // Récupère le profil courant
  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (fetchErr || !profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  const newXp = (profile.total_xp ?? 0) + amount
  const { current } = getLevelInfo(newXp)

  // Calcul streak : si last_action_at est aujourd'hui → pas de changement
  // si c'était hier → streak + 1, sinon streak = 1
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const lastAt = profile.last_action_at ? new Date(profile.last_action_at).toISOString().slice(0, 10) : null
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)

  let streak = profile.streak_days ?? 0
  if (lastAt === today) {
    // déjà actif aujourd'hui, streak inchangé
  } else if (lastAt === yesterday) {
    streak += 1
  } else {
    streak = 1
  }

  // Met à jour le profil
  await supabase.from('profiles').update({
    total_xp: newXp,
    level: current.level,
    streak_days: streak,
    last_action_at: now.toISOString(),
  }).eq('username', username)

  // Log l'événement XP
  await supabase.from('xp_events').insert({
    username,
    action,
    amount,
    cat_id: cat_id ?? null,
    meta: meta ?? null,
    created_at: now.toISOString(),
  })

  return NextResponse.json({
    new_xp: newXp,
    amount,
    level: current.level,
    level_title: current.title,
    streak,
  })
}
