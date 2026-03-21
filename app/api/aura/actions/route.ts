import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

// Actions présets (hardcodées, toujours disponibles)
const PRESET_ACTIONS = [
  { id: 'preset_scratch',   name: 'Se gratter l\'oreille',              aura_points: 3,   is_preset: true, emoji: '👂', note: 'un peu nul, c\'est banal' },
  { id: 'preset_purr',      name: 'Ronronner fort',                     aura_points: 8,   is_preset: true, emoji: '😽', note: 'classique mais appréciable' },
  { id: 'preset_knead',     name: 'Faire le biscuit',                   aura_points: 12,  is_preset: true, emoji: '🫳', note: 'c\'est cute' },
  { id: 'preset_ignore',    name: 'Ignorer royalement quelqu\'un',      aura_points: 5,   is_preset: true, emoji: '😒', note: 'banal pour un chat' },
  { id: 'preset_nap',       name: 'Sieste au soleil',                   aura_points: 10,  is_preset: true, emoji: '☀️', note: 'mérité' },
  { id: 'preset_drink',     name: 'Boire dans le robinet',              aura_points: 18,  is_preset: true, emoji: '🚿', note: 'style indéniable' },
  { id: 'preset_knock',     name: 'Faire tomber un objet intentionnellement', aura_points: 22, is_preset: true, emoji: '😈', note: 'pur génie' },
  { id: 'preset_roof',      name: 'Grimper sur un toit',                aura_points: 28,  is_preset: true, emoji: '🏠', note: 'respect' },
  { id: 'preset_stranger',  name: 'Rentrer chez quelqu\'un d\'étranger',aura_points: 35,  is_preset: true, emoji: '🚪', note: 'culot total' },
  { id: 'preset_fight_dog', name: 'Affronter un chien',                 aura_points: 50,  is_preset: true, emoji: '🐕', note: 'légendaire' },
  { id: 'preset_mouse',     name: 'Chasser une vraie souris',           aura_points: 45,  is_preset: true, emoji: '🐭', note: 'instinct pur' },
  { id: 'preset_swim',      name: 'Nager volontairement',               aura_points: 80,  is_preset: true, emoji: '🏊', note: 'mythique, personne n\'y croit' },
  { id: 'preset_jetpack',   name: 'S\'envoler en jetpack',              aura_points: 999, is_preset: true, emoji: '🚀', note: 'légende absolue' },
]

// GET /api/aura/actions — retourne presets + actions custom
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data: custom } = await supabase
    .from('aura_actions')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({
    presets: PRESET_ACTIONS,
    custom: custom ?? [],
  })
}

// POST /api/aura/actions — crée une action custom
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, aura_points, emoji } = await request.json()
  if (!name?.trim() || typeof aura_points !== 'number') {
    return NextResponse.json({ error: 'name et aura_points requis' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('aura_actions')
    .insert({ name: name.trim(), aura_points, emoji: emoji ?? '⚡', is_preset: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
