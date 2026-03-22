import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&accept-language=fr`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Chatdex/1.0 (rabat-cats-app)' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address ?? {}
    // Priorité : rue → quartier → ville
    return addr.road ?? addr.neighbourhood ?? addr.suburb ?? addr.city_district ?? addr.city ?? null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.cat_id) {
    return NextResponse.json({ error: 'cat_id requis' }, { status: 400 })
  }

  let street = body.street ?? null

  // Reverse geocoding si pas de rue mais coords disponibles
  if (!street && body.lat && body.lng) {
    street = await reverseGeocode(body.lat, body.lng)
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('sightings')
    .insert({
      cat_id: body.cat_id,
      photo_url: body.photo_url ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      street: street,
      notes: body.notes ?? null,
      seen_at: body.seen_at ?? new Date().toISOString(),
      featuring_cat_ids: body.featuring_cat_ids ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
