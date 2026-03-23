'use client'

import TopBar from '@/components/TopBar'
import { SkeletonCandidateCard, SkeletonBox, SkeletonText, SkeletonCatGrid } from '@/components/Skeleton'

export default function PolitiqueLoading() {
  return (
    <div className="min-h-svh pb-24">
      <TopBar title="Félitics" backHref="/arenes" />

      {/* Onglets */}
      <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-border">
        {[90, 80, 110].map((w, i) => (
          <div key={i} className={`skeleton h-9 rounded-full ${i === 0 ? 'opacity-100' : 'opacity-60'}`}
            style={{ width: w }} />
        ))}
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">

        {/* Résumé total */}
        <div className="rounded-2xl border border-border bg-surface p-4 grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <SkeletonBox className="h-7 w-12 mx-auto rounded-lg" />
              <SkeletonText className="w-3/4 mx-auto" />
            </div>
          ))}
        </div>

        {/* Candidats */}
        <div className="space-y-2.5">
          <SkeletonText className="w-1/3 mb-3" />
          {[...Array(4)].map((_, i) => (
            <SkeletonCandidateCard key={i} />
          ))}
        </div>

        {/* Liste des chats */}
        <div className="pt-2 space-y-3">
          <SkeletonText className="w-1/2" />
          <SkeletonCatGrid n={6} />
        </div>
      </div>
    </div>
  )
}
