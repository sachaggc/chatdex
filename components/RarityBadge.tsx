'use client'

import { Sparkles, Star, Diamond, Gem, Circle, Minus } from 'lucide-react'
import { getRarity } from '@/lib/rarity'

const ICONS = [Sparkles, Star, Diamond, Gem, Circle, Minus, Minus]

interface Props { count: number; size?: 'sm' | 'md' }

export default function RarityBadge({ count, size = 'md' }: Props) {
  const r = getRarity(count)
  const Icon = ICONS[r.level] ?? Minus
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold font-display tracking-wide ${px} ${r.isShiny ? 'shiny-shimmer' : ''}`}
      style={{ color: r.color, backgroundColor: r.isShiny ? undefined : r.bgColor, border: `1px solid ${r.color}55` }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {r.label}
    </span>
  )
}
