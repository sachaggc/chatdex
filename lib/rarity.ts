import { RarityInfo, Category } from '@/types'

export function getRarity(sightingsCount: number): RarityInfo {
  if (sightingsCount === 0) {
    return { label: 'Inconnu', level: 6, color: '#9CA3AF', bgColor: '#F3F4F6', isShiny: false, emoji: '❓' }
  }
  if (sightingsCount === 1) {
    return { label: 'Shiny Fantôme', level: 0, color: '#B8860B', bgColor: '#FFF9E6', isShiny: true, emoji: '✨' }
  }
  if (sightingsCount <= 3) {
    return { label: 'Légendaire', level: 1, color: '#7C3AED', bgColor: '#F5F3FF', isShiny: false, emoji: '💜' }
  }
  if (sightingsCount <= 6) {
    return { label: 'Ultra Rare', level: 2, color: '#1D4ED8', bgColor: '#EFF6FF', isShiny: false, emoji: '💙' }
  }
  if (sightingsCount <= 15) {
    return { label: 'Rare', level: 3, color: '#15803D', bgColor: '#F0FDF4', isShiny: false, emoji: '💚' }
  }
  if (sightingsCount <= 30) {
    return { label: 'Peu commun', level: 4, color: '#6B7280', bgColor: '#F9FAFB', isShiny: false, emoji: '🩶' }
  }
  return { label: 'Commun', level: 5, color: '#9CA3AF', bgColor: '#F3F4F6', isShiny: false, emoji: '⬜' }
}

export const CATEGORIES: Record<Category, { label: string; emoji: string; color: string; bg: string }> = {
  fou: { label: 'Chat Fou', emoji: '🌀', color: '#DC2626', bg: '#FEF2F2' },
  pacha: { label: 'Chat Pacha', emoji: '👑', color: '#D97706', bg: '#FFFBEB' },
  marxiste: { label: 'Chat Marxiste', emoji: '✊', color: '#B91C1C', bg: '#FFF1F2' },
  babos: { label: 'Chat Babos', emoji: '🌿', color: '#16A34A', bg: '#F0FDF4' },
  parkour: { label: 'Chat Parkour', emoji: '🏃', color: '#2563EB', bg: '#EFF6FF' },
}
