import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const weekAgo  = new Date(now.getTime() - 7  * 24 * 3600 * 1000).toISOString()
  const tenAgo   = new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString()

  // Tous les chats nommés
  const { data: cats } = await supabase
    .from('cats')
    .select('id, name, main_photo_url, category, sightings(count)')
    .eq('unnamed', false)
    .order('created_at', { ascending: false })

  // Observations de la semaine
  const { data: weekSightings } = await supabase
    .from('sightings')
    .select('cat_id')
    .gte('seen_at', weekAgo)

  // Dernière observation par chat
  const { data: lastSightings } = await supabase
    .from('sightings')
    .select('cat_id, seen_at')
    .order('seen_at', { ascending: false })

  const totalCats = cats?.length ?? 0

  // Compte par chat cette semaine
  const weekCounts: Record<string, number> = {}
  for (const s of weekSightings ?? []) {
    weekCounts[s.cat_id] = (weekCounts[s.cat_id] ?? 0) + 1
  }

  // Chat de la semaine
  const catOfTheWeek = cats
    ?.map(c => ({ ...c, weekCount: weekCounts[c.id] ?? 0 }))
    .sort((a, b) => b.weekCount - a.weekCount)
    .find(c => c.weekCount > 0) ?? null

  // Dernière vue par chat
  const lastSeenMap: Record<string, string> = {}
  for (const s of lastSightings ?? []) {
    if (!lastSeenMap[s.cat_id]) lastSeenMap[s.cat_id] = s.seen_at
  }

  // Chats disparus (pas vus depuis 10 jours)
  const missing = cats?.filter(c => {
    const last = lastSeenMap[c.id]
    return !last || last < tenAgo
  }) ?? []

  // Top 8 chats par observations totales
  const topCats = [...(cats ?? [])]
    .map(c => ({
      id: c.id,
      name: c.name,
      main_photo_url: c.main_photo_url,
      count: (c.sightings as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Total observations
  const allCatCounts = (cats ?? []).map(c => (c.sightings as unknown as { count: number }[])?.[0]?.count ?? 0)
  const totalSightings = allCatCounts.reduce((s, n) => s + n, 0)

  // Coordonnées moyennes par chat (pour la carte)
  const { data: geoSightings } = await supabase
    .from('sightings')
    .select('cat_id, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  const coordsMap: Record<string, { lats: number[]; lngs: number[] }> = {}
  for (const s of geoSightings ?? []) {
    if (!coordsMap[s.cat_id]) coordsMap[s.cat_id] = { lats: [], lngs: [] }
    coordsMap[s.cat_id].lats.push(s.lat)
    coordsMap[s.cat_id].lngs.push(s.lng)
  }

  const mapCats = (cats ?? [])
    .filter(c => coordsMap[c.id])
    .map(c => {
      const coords = coordsMap[c.id]
      const avg_lat = coords.lats.reduce((a, b) => a + b, 0) / coords.lats.length
      const avg_lng = coords.lngs.reduce((a, b) => a + b, 0) / coords.lngs.length
      return {
        id: c.id,
        name: c.name,
        main_photo_url: c.main_photo_url,
        category: c.category,
        sightings_count: (c.sightings as unknown as { count: number }[])?.[0]?.count ?? 0,
        avg_lat,
        avg_lng,
      }
    })

  return NextResponse.json({
    totalCats,
    totalSightings,
    catOfTheWeek: catOfTheWeek ? {
      id: catOfTheWeek.id,
      name: catOfTheWeek.name,
      main_photo_url: catOfTheWeek.main_photo_url,
      weekCount: catOfTheWeek.weekCount,
    } : null,
    missing: missing.map(c => ({
      id: c.id,
      name: c.name,
      main_photo_url: c.main_photo_url,
      lastSeen: lastSeenMap[c.id] ?? null,
    })),
    topCats,
    mapCats,
  })
}
