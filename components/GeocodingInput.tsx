'use client'

import { useState, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

interface Props {
  value: string
  onChange: (street: string) => void
  onGeocode: (lat: number, lng: number, label: string) => void
  placeholder?: string
  label?: string
}

export default function GeocodingInput({ value, onChange, onGeocode, placeholder, label }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [geocoded, setGeocoded] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  function handleChange(val: string) {
    onChange(val)
    setGeocoded(false)
    clearTimeout(timeout.current)
    if (val.length < 4) { setSuggestions([]); return }

    timeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const query = encodeURIComponent(`${val}, Rabat, Maroc`)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=4&countrycodes=ma`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }, 500)
  }

  function select(s: Suggestion) {
    const label = s.display_name.split(',').slice(0, 2).join(', ')
    onChange(label)
    onGeocode(parseFloat(s.lat), parseFloat(s.lon), label)
    setSuggestions([])
    setGeocoded(true)
  }

  return (
    <div className="relative">
      {label && <p className="block text-sm font-semibold text-text mb-1">{label}</p>}
      <div className="relative">
        <MapPin size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${geocoded ? 'text-teal' : 'text-muted'}`} />
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder ?? 'Rue, quartier…'}
          className="input-field pl-9 pr-8"
        />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />}
        {geocoded && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-teal font-bold">✓</span>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl bg-surface border border-border shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => select(s)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-parchment border-b border-border last:border-0 transition-colors"
            >
              <MapPin size={13} className="shrink-0 mt-0.5 text-brand" />
              <span className="text-text line-clamp-2">
                {s.display_name.split(',').slice(0, 3).join(', ')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
