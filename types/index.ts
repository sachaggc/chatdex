export type Category = 'fou' | 'pacha' | 'marxiste' | 'babos' | 'parkour'

export interface Cat {
  id: string
  name: string
  description: string | null
  category: Category | null
  character_traits: string[]
  main_photo_url: string | null
  created_at: string
  sightings_count?: number
}

export interface Sighting {
  id: string
  cat_id: string
  photo_url: string | null
  lat: number | null
  lng: number | null
  street: string | null
  notes: string | null
  seen_at: string
  created_at: string
}

export interface CatWithSightings extends Cat {
  sightings: Sighting[]
  avg_lat: number | null
  avg_lng: number | null
}

export interface RarityInfo {
  label: string
  level: number
  color: string
  bgColor: string
  isShiny: boolean
  emoji: string
}
