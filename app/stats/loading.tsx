'use client'

import TopBar from '@/components/TopBar'
import { SkeletonStatCard, SkeletonBox, SkeletonText, SkeletonCatGrid } from '@/components/Skeleton'

export default function StatsLoading() {
  return (
    <div className="min-h-svh pb-24">
      <TopBar title="Statistiques" backHref="/" />

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">

        {/* Rivalry skeleton */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex divide-x divide-border">
            {[0, 1].map(i => (
              <div key={i} className="flex-1 flex flex-col items-center py-4 px-3 gap-2">
                <SkeletonBox className="h-12 w-12 rounded-2xl" />
                <SkeletonText className="w-2/3" />
                <div className="w-full space-y-1.5 mt-1">
                  {[...Array(3)].map((_, j) => (
                    <SkeletonBox key={j} className="h-8 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-8 rounded-none" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Section header */}
        <SkeletonBox className="h-10 rounded-xl" />

        {/* Cat grid */}
        <SkeletonCatGrid n={6} />

        {/* Carte */}
        <SkeletonBox className="h-64 rounded-2xl" />
      </div>
    </div>
  )
}
