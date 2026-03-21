'use client'

import { CATEGORIES } from '@/lib/rarity'
import { Category } from '@/types'

interface Props {
  category: Category | null
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'md' }: Props) {
  if (!category) return null
  const cat = CATEGORIES[category]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ color: cat.color, backgroundColor: cat.bg, border: `1px solid ${cat.color}44` }}
    >
      {cat.emoji} {cat.label}
    </span>
  )
}
