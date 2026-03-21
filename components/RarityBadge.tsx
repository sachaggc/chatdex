'use client'

import { getRarity } from '@/lib/rarity'

interface Props {
  count: number
  size?: 'sm' | 'md'
}

export default function RarityBadge({ count, size = 'md' }: Props) {
  const rarity = getRarity(count)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${rarity.isShiny ? 'shiny-card' : ''}`}
      style={{
        color: rarity.color,
        backgroundColor: rarity.isShiny ? undefined : rarity.bgColor,
        border: `1px solid ${rarity.color}44`,
      }}
    >
      {rarity.emoji} {rarity.label}
    </span>
  )
}
