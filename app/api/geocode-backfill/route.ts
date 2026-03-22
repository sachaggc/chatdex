import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&accept-language=fr`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Chatdex/1.0 (rabat-cats-app)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address ?? {}
    return addr.road ?? addr.neighbourhood ?? addr.suburb ?? addr.city_district ?? addr.city ?? null
  } catch { return null }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: sightings, error } = await supabase
    .from('sightings')
    .select('id, lat, lng')
    .is('street', null)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(25)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!sightings || sightings.length === 0) {
    return NextResponse.json({ updated: 0, message: 'Tous les lieux sont déjà renseignés ✓' })
  }

  let updated = 0
  for (const s of sightings) {
    const street = await reverseGeocode(s.lat!, s.lng!)
    if (street) {
      await supabase.from('sightings').update({ street }).eq('id', s.id)
      updated++
    }
    await sleep(1200) // Nominatim: max 1 req/s
  }

  return NextResponse.json({
    updated,
    skipped: sightings.length - updated,
    message: `${updated} lieu${updated > 1 ? 'x' : ''} mis à jour sur ${sightings.length}`,
  })
}
