'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Sighting } from '@/types'
import 'leaflet/dist/leaflet.css'

interface Props {
  sightings: Sighting[]
  catName: string
}

const RABAT_CENTER: [number, number] = [34.0209, -6.8416]

export default function CatMap({ sightings, catName }: Props) {
  const validSightings = sightings.filter((s) => s.lat && s.lng)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    delete (Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    Icon.Default.mergeOptions({
      iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  // Centre la carte sur la moyenne des observations
  const center: [number, number] =
    validSightings.length > 0
      ? [
          validSightings.reduce((a, s) => a + s.lat!, 0) / validSightings.length,
          validSightings.reduce((a, s) => a + s.lng!, 0) / validSightings.length,
        ]
      : RABAT_CENTER

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      className="leaflet-container"
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validSightings.map((s, i) => (
        <CircleMarker
          key={s.id}
          center={[s.lat!, s.lng!]}
          radius={8}
          pathOptions={{ color: '#C65D3C', fillColor: '#E07A5F', fillOpacity: 0.8, weight: 2 }}
        >
          <Popup>
            <div className="min-w-[140px]">
              <p className="font-bold text-xs mb-1">
                {catName} — obs. #{i + 1}
              </p>
              {s.street && <p className="text-xs text-gray-500">📍 {s.street}</p>}
              <p className="text-xs text-gray-400">
                {new Date(s.seen_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {s.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photo_url}
                  alt="Observation"
                  className="mt-2 w-full h-20 object-cover rounded"
                />
              )}
              {s.notes && <p className="mt-1 text-xs italic">{s.notes}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
