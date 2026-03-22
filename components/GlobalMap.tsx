'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { Cat } from '@/types'
import { getRarity } from '@/lib/rarity'
import 'leaflet/dist/leaflet.css'

interface CatWithCoords extends Cat {
  avg_lat: number
  avg_lng: number
}

interface Props { cats: CatWithCoords[] }

// Quartier Océan, Rabat — fallback si aucun marker
const OCEAN: [number, number] = [34.015, -6.855]

function FitBounds({ cats }: { cats: CatWithCoords[] }) {
  const map = useMap()
  useEffect(() => {
    if (cats.length === 0) return
    const bounds = cats.map(c => [c.avg_lat, c.avg_lng] as [number, number])
    map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 16 })
  }, [cats, map])
  return null
}

function rarityIcon(rarity: ReturnType<typeof getRarity>) {
  const color = rarity.isShiny ? '#C98A2F' : rarity.color
  const glow  = rarity.isShiny ? `box-shadow:0 0 10px ${color}99;` : ''
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
      ${glow}
    "></div>`,
    className: '',
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
    popupAnchor:[0, -10],
  })
}

export default function GlobalMap({ cats }: Props) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })
  }, [])

  return (
    <MapContainer center={OCEAN} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds cats={cats} />
      {cats.map((cat) => {
        const r = getRarity(cat.sightings_count ?? 0)
        return (
          <Marker key={cat.id} position={[cat.avg_lat, cat.avg_lng]} icon={rarityIcon(r)}>
            <Popup>
              <div className="text-center" style={{ minWidth: 120 }}>
                {cat.main_photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.main_photo_url} alt={cat.name} className="w-20 h-20 object-cover rounded-lg mx-auto mb-2" />
                )}
                <p className="font-bold text-sm">{cat.name}</p>
                <p className="text-xs" style={{ color: r.color }}>{r.label}</p>
                <Link href={`/cats/${cat.id}`} className="mt-1 text-xs text-brand underline block">
                  Voir la fiche →
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
