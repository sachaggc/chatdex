import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabaseAdmin()

  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_xp', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch XP events from past 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: events } = await supabase
    .from('xp_events')
    .select('username, amount, action')
    .gte('created_at', sevenDaysAgo)

  // Aggregate weekly XP per user
  const weeklyMap: Record<string, { weekly_xp: number; weekly_actions: number }> = {}
  for (const e of events ?? []) {
    if (!weeklyMap[e.username]) weeklyMap[e.username] = { weekly_xp: 0, weekly_actions: 0 }
    weeklyMap[e.username].weekly_xp += e.amount
    weeklyMap[e.username].weekly_actions += 1
  }

  const weekly = Object.entries(weeklyMap).map(([username, stats]) => ({ username, ...stats }))

  return NextResponse.json({ profiles: profiles ?? [], weekly })
}
