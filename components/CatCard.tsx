'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Cat, RarityInfo } from '@/types'
import { getRarity, DEFAULT_CATEGORIES } from '@/lib/rarity'

interface CandidateInfo { name: string; emoji: string; color: string }
interface Props {
  cat: Cat & { candidate?: CandidateInfo | null }
  index?: number
  rarityOverride?: RarityInfo
  categoryMap?: Record<string, { label: string; color: string; bg?: string }>
}

export default function CatCard({ cat, index = 0, rarityOverride, categoryMap }: Props) {
  const count  = Number(cat.sightings_count ?? 0)
  const rarity = rarityOverride ?? getRarity(count)
  const catDef = cat.category
    ? (categoryMap?.[cat.category] ?? DEFAULT_CATEGORIES[cat.category] ?? null)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35), ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
    >
      <Link href={`/cats/${cat.id}`} className="block">
        <div
          className={`relative rounded-2xl overflow-hidden aspect-square ${rarity.level <= 1 ? 'legendary-glow' : ''}`}
          style={{
            ...(rarity.level <= 1 ? { '--glow-color': rarity.color } as React.CSSProperties : {}),
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
          }}
        >
          {/* Photo background */}
          {cat.main_photo_url ? (
            <Image
              src={cat.main_photo_url}
              alt={cat.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-parchment zellige-bg flex items-center justify-center">
              <svg viewBox="0 0 60 60" className="w-12 h-12 fill-muted opacity-15">
                <ellipse cx="30" cy="36" rx="22" ry="18"/>
                <ellipse cx="30" cy="24" rx="14" ry="13"/>
                <polygon points="16,16 10,4 22,10"/>
                <polygon points="44,16 38,10 50,4"/>
              </svg>
            </div>
          )}

          {/* Gradient overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* Category bar — thin top strip */}
          {catDef && (
            <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: catDef.color }} />
          )}

          {/* Rarity badge — top right */}
          <div
            className={`absolute top-2 right-2 flex items-center gap-0.5 rounded-full px-1.5 py-[3px] text-[11px] backdrop-blur-sm ${rarity.isShiny ? 'shiny-shimmer' : ''}`}
            style={{
              background: rarity.isShiny ? 'rgba(201,138,47,0.25)' : rarity.color + '28',
              border: `1px solid ${rarity.color}50`,
            }}
          >
            <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>{rarity.emoji}</span>
          </div>

          {/* Candidate badge — top left (politique) */}
          {cat.candidate && (
            <div
              className="absolute top-2 left-2 rounded-full px-1.5 py-[3px] text-[9px] font-bold text-white backdrop-blur-sm"
              style={{ background: cat.candidate.color + '80', border: `1px solid ${cat.candidate.color}60` }}
            >
              {cat.candidate.emoji}
            </div>
          )}

          {/* Name + observations — bottom overlay */}
          <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2.5">
            <h3 className="font-display font-bold text-white text-sm leading-tight truncate" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {cat.name}
            </h3>
            <p className="text-white/55 text-[10px] mt-0.5 leading-none">
              {count} obs.{catDef ? ` · ${catDef.label}` : ''}
            </p>
          </div>

          {/* Rain umbrella */}
          <div className="rain-umbrella" aria-hidden="true">☂️</div>
        </div>
      </Link>
    </motion.div>
  )
}
