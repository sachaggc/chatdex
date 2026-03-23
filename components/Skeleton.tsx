/**
 * Composants skeleton réutilisables — shimmer en forme du contenu réel.
 * Utilisent la classe .skeleton définie dans globals.css.
 */

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

export function SkeletonText({ className = 'w-full' }: { className?: string }) {
  return <div className={`skeleton h-3 rounded-full ${className}`} />
}

/** Carte chat 2-colonnes (photo + nom + badge) */
export function SkeletonCatCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-surface">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <SkeletonText className="w-3/4" />
        <SkeletonText className="w-2/5" />
      </div>
    </div>
  )
}

/** Grille de N cartes chats */
export function SkeletonCatGrid({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <SkeletonCatCard key={i} />
      ))}
    </div>
  )
}

/** En-tête de section (titre + compte) */
export function SkeletonSectionHeader() {
  return (
    <div className="flex items-center gap-2 mb-3 -mx-1">
      <div className="skeleton h-9 w-full rounded-xl" />
    </div>
  )
}

/** Carte de stat numérique */
export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-9 w-9 rounded-xl shrink-0" />
        <SkeletonText className="w-2/5" />
      </div>
      <SkeletonText className="w-3/4 h-7" />
      <SkeletonText className="w-1/2" />
    </div>
  )
}

/** Barre de profil */
export function SkeletonProfileBar() {
  return (
    <div className="px-4 pt-2 pb-1">
      <div className="flex items-center gap-3 rounded-2xl bg-surface border border-border px-3 py-2.5">
        <div className="skeleton h-9 w-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <SkeletonText className="w-2/5" />
            <SkeletonText className="w-1/5" />
          </div>
          <div className="skeleton h-1.5 w-full rounded-full" />
          <SkeletonText className="w-1/3" />
        </div>
      </div>
    </div>
  )
}

/** Carte candidat Félitics */
export function SkeletonCandidateCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 flex items-center gap-3">
      <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-2/3" />
        <SkeletonBox className="h-2 w-full rounded-full" />
      </div>
      <SkeletonText className="w-10 shrink-0" />
    </div>
  )
}
