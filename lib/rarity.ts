import { RarityInfo } from '@/types'

// Seuils fixes (utilisés quand on n'a pas le contexte de tous les chats)
export function getRarity(count: number): RarityInfo {
  if (count === 0)  return { label: 'Inconnu',       level: 6, color: '#9CA3AF', bgColor: '#F3F4F6', isShiny: false, emoji: '?' }
  if (count === 1)  return { label: 'Shiny Fantôme', level: 0, color: '#C98A2F', bgColor: '#FFF9E6', isShiny: true,  emoji: '✦' }
  if (count <= 3)   return { label: 'Légendaire',    level: 1, color: '#7C3AED', bgColor: '#F5F3FF', isShiny: false, emoji: '◆' }
  if (count <= 6)   return { label: 'Ultra Rare',    level: 2, color: '#1D4ED8', bgColor: '#EFF6FF', isShiny: false, emoji: '▲' }
  if (count <= 15)  return { label: 'Rare',          level: 3, color: '#15803D', bgColor: '#F0FDF4', isShiny: false, emoji: '●' }
  if (count <= 30)  return { label: 'Peu commun',    level: 4, color: '#6B7280', bgColor: '#F9FAFB', isShiny: false, emoji: '◉' }
  return              { label: 'Commun',          level: 5, color: '#9CA3AF', bgColor: '#F3F4F6', isShiny: false, emoji: '○' }
}

// Rareté relative : basée sur le rang du chat parmi tous les autres.
// Moins il est vu par rapport aux autres → plus il est rare.
// allCounts : tableau des sightings_count de TOUS les chats nommés.
export function getRarityRelative(count: number, allCounts: number[]): RarityInfo {
  if (count === 0) return { label: 'Inconnu', level: 6, color: '#9CA3AF', bgColor: '#F3F4F6', isShiny: false, emoji: '?' }

  const valid = allCounts.filter(c => c > 0)
  // Pas assez de données → seuils fixes
  if (valid.length < 3) return getRarity(count)

  // Percentile depuis le bas : % de chats ayant un count ≤ au sien
  // Bas percentile = peu de chats ont moins de sightings → très rare
  const below = valid.filter(c => c <= count).length
  const pct = below / valid.length  // 0 = le plus rare, 1 = le plus commun

  if (pct <= 0.05) return { label: 'Shiny Fantôme', level: 0, color: '#C98A2F', bgColor: '#FFF9E6', isShiny: true,  emoji: '✦' }
  if (pct <= 0.18) return { label: 'Légendaire',    level: 1, color: '#7C3AED', bgColor: '#F5F3FF', isShiny: false, emoji: '◆' }
  if (pct <= 0.35) return { label: 'Ultra Rare',    level: 2, color: '#1D4ED8', bgColor: '#EFF6FF', isShiny: false, emoji: '▲' }
  if (pct <= 0.55) return { label: 'Rare',          level: 3, color: '#15803D', bgColor: '#F0FDF4', isShiny: false, emoji: '●' }
  if (pct <= 0.80) return { label: 'Peu commun',    level: 4, color: '#6B7280', bgColor: '#F9FAFB', isShiny: false, emoji: '◉' }
  return                   { label: 'Commun',        level: 5, color: '#9CA3AF', bgColor: '#F3F4F6', isShiny: false, emoji: '○' }
}

// Icônes Lucide associées à chaque rareté
export const RARITY_ICONS: Record<number, string> = {
  0: 'Sparkles',
  1: 'Star',
  2: 'Diamond',
  3: 'Gem',
  4: 'Circle',
  5: 'Minus',
  6: 'HelpCircle',
}

export type CategoryDef = { label: string; color: string; icon: string; bg: string }

// Catégories par défaut (fallback si Supabase indisponible)
export const DEFAULT_CATEGORIES: Record<string, CategoryDef> = {
  fou:      { label: 'Chat Fou',     color: '#DC2626', bg: '#FEF2F2', icon: 'Zap'    },
  pacha:    { label: 'Chat Pacha',   color: '#D97706', bg: '#FFFBEB', icon: 'Crown'  },
  marxiste: { label: 'Chat Marxiste',color: '#B91C1C', bg: '#FFF1F2', icon: 'Flame'  },
  babos:    { label: 'Chat Babos',   color: '#16A34A', bg: '#F0FDF4', icon: 'Leaf'   },
  parkour:  { label: 'Chat Parkour', color: '#2563EB', bg: '#EFF6FF', icon: 'Wind'   },
}

// Couleurs Tailwind inline pour les catégories dynamiques
export const CATEGORY_COLORS = [
  '#DC2626', '#D97706', '#16A34A', '#2563EB', '#7C3AED',
  '#DB2777', '#0891B2', '#65A30D', '#EA580C', '#1B2D4A',
]
