'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Cat } from '@/types'
import { getRarity, CATEGORIES } from '@/lib/rarity'

interface Props {
  cat: Cat
}

export default function CatCard({ cat }: Props) {
  const count = cat.sightings_count ?? 0
  const rarity = getRarity(count)
  const category = cat.category ? CATEGORIES[cat.category] : null

  return (
    <Link href={`/cats/${cat.id}`} className="block">
      <div className={`cat-card ${rarity.isShiny ? 'shiny-glow' : ''}`}>

        {/* Bandeau couleur catégorie en haut */}
        <div
          className="h-1.5 w-full"
          style={{ background: category?.color ?? '#C65D3C' }}
        />

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
            <div className="flex h-full items-center justify-center text-6xl opacity-30">
              🐱
            </div>
          )}

          {/* Badge rareté en haut à droite */}
          <div className="absolute right-2 top-2">
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold shadow ${
                rarity.isShiny ? 'bg-yellow-400 text-yellow-900' : 'bg-white/90 text-gray-700'
              }`}
            >
              {rarity.emoji}
            </span>
          </div>

          {/* Shiny shimmer overlay */}
          {rarity.isShiny && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-yellow-400/20 pointer-events-none" />
          )}
        </div>

        {/* Infos */}
        <div className="p-3">
          <h3 className="font-bold text-dark-brown truncate text-base">{cat.name}</h3>

          <div className="mt-1 flex items-center justify-between">
            {category && (
              <span className="text-xs" style={{ color: category.color }}>
                {category.emoji} {category.label}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {count} {count <= 1 ? 'obs.' : 'obs.'}
            </span>
          </div>

          {/* Barre de rareté (inversée : pleine = rare) */}
          <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(10, 100 - Math.min(count * 5, 90))}%`,
                background: rarity.isShiny
                  ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                  : rarity.color,
              }}
            />
          </div>
        </div>

      </div>
    </Link>
  )
}
