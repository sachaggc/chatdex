'use client'

import { Zap, Crown, Flame, Leaf, Wind, Tag } from 'lucide-react'
import { DEFAULT_CATEGORIES } from '@/lib/rarity'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Zap, Crown, Flame, Leaf, Wind, Tag,
}

interface Props {
  categoryKey: string | null
  label?: string
  color?: string
  icon?: string
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ categoryKey, label, color, icon, size = 'md' }: Props) {
  const def = categoryKey ? DEFAULT_CATEGORIES[categoryKey] : null
  const resolvedLabel = label ?? def?.label ?? categoryKey ?? ''
  const resolvedColor = color ?? def?.color ?? '#6B7280'
  const resolvedIcon  = icon  ?? def?.icon  ?? 'Tag'
  const Icon = ICON_MAP[resolvedIcon] ?? Tag

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold ${px}`}
      style={{
        color: resolvedColor,
        backgroundColor: resolvedColor + '18',
        border: `1px solid ${resolvedColor}44`,
      }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {resolvedLabel}
    </span>
  )
}
