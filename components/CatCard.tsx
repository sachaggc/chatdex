'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, Star, Diamond, Gem, Circle, Minus } from 'lucide-react'
import { Cat, RarityInfo } from '@/types'
import { getRarity, DEFAULT_CATEGORIES } from '@/lib/rarity'

interface CandidateInfo { name: string; emoji: string; color: string }

const STAMP_ICONS = [Sparkles, Star, Diamond, Gem, Circle, Minus, Minus]

interface Props { cat: Cat & { candidate?: CandidateInfo | null }; index?: number; rarityOverride?: RarityInfo; categoryMap?: Record<string, {label: string; color: string; bg?: string}> }

export default function CatCard({ cat, index = 0, rarityOverride, categoryMap }: Props) {
  const count  = cat.sightings_count ?? 0
  const rarity = rarityOverride ?? getRarity(count)
  const catDef = cat.category
    ? (categoryMap?.[cat.category] ?? DEFAULT_CATEGORIES[cat.category] ?? null)
    : null
  const StampIcon = STAMP_ICONS[rarity.level] ?? Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}
    >
      <Link href={`/cats/${cat.id}`} className="block">
        <div className={`cat-card ${rarity.isShiny ? 'shiny-card' : ''} ${rarity.level <= 1 ? 'legendary-glow' : ''}`}
          style={rarity.level <= 1 ? { '--glow-color': rarity.color } as React.CSSProperties : undefined}
        >

          {/* Bande catégorie en haut */}
          <div className="h-[3px]" style={{ background: catDef?.color ?? '#DFC9AE' }} />

          {/* Photo */}
          <div className="relative aspect-square bg-parchment zellige-bg">
            {cat.main_photo_url ? (
              <Image
                src={cat.main_photo_url}
                alt={cat.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center opacity-20">
                <svg viewBox="0 0 60 60" className="w-16 h-16 fill-muted">
                  <ellipse cx="30" cy="36" rx="22" ry="18"/>
                  <ellipse cx="30" cy="24" rx="14" ry="13"/>
                  <polygon points="16,16 10,4 22,10"/>
                  <polygon points="44,16 38,10 50,4"/>
                </svg>
              </div>
            )}

            {/* Stamp rareté */}
            <div
              className={`rarity-stamp ${rarity.isShiny ? 'shiny-shimmer' : ''}`}
              style={{ color: rarity.color, borderColor: rarity.color + '55' }}
            >
              <StampIcon size={9} strokeWidth={2.5} />
              <span>{count}</span>
            </div>

            {/* Badge candidat politique */}
            {cat.candidate && (
              <div className="cat-card-candidate" style={{ borderLeft: `2px solid ${cat.candidate.color}` }}>
                {cat.candidate.emoji} {cat.candidate.name.split(' ').pop()}
              </div>
            )}

            {/* Parapluie par temps de pluie */}
            <div className="rain-umbrella" aria-hidden="true">☂️</div>
          </div>

          {/* Infos — style carte postale */}
          <div className="p-3 pt-2.5">
            <h3 className="font-display font-bold text-text truncate text-sm tracking-wide uppercase">
              {cat.name}
            </h3>

            {/* Lignes postale décoratives */}
            <div className="postcard-lines mt-1.5 mb-2">
              <span /><span />
            </div>

            <div className="flex items-center justify-between">
              {catDef ? (
                <span className="text-xs font-semibold" style={{ color: catDef.color }}>
                  {catDef.label}
                </span>
              ) : <span />}
              <span className="text-xs text-muted">{rarity.label}</span>
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  )
}
