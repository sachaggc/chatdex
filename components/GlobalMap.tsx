'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import Link from 'next/link'
import { Cat } from '@/types'
import 'leaflet/dist/leaflet.css'

// Fix l'icône Leaflet cassée dans Next.js
const catIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface CatWithCoords extends Cat {
  avg_lat: number
  avg_lng: number
}

interface Props {
  cats: CatWithCoords[]
}

// Centre sur Rabat par défaut
const RABAT_CENTER: [number, number] = [34.0209, -6.8416]

export default function GlobalMap({ cats }: Props) {
  useEffect(() => {
    // Fix icône Leaflet en mode SSR
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    delete (Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    Icon.Default.mergeOptions({
      iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  return (
    <MapContainer
      center={RABAT_CENTER}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      className="leaflet-container"
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {cats.map((cat) => (
        <Marker key={cat.id} position={[cat.avg_lat, cat.avg_lng]} icon={catIcon}>
          <Popup>
            <div className="text-center min-w-[120px]">
              {cat.main_photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.main_photo_url}
                  alt={cat.name}
                  className="w-20 h-20 object-cover rounded-lg mx-auto mb-2"
                />
              )}
              <p className="font-bold text-sm">{cat.name}</p>
              <p className="text-xs text-gray-500">{cat.sightings_count} observations</p>
              <Link
                href={`/cats/${cat.id}`}
                className="mt-1 text-xs text-terracotta underline block"
              >
                Voir la fiche →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
