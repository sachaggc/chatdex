// ── Système de niveaux Chatdex ───────────────────────────────────────────────

export interface Level {
  level: number
  title: string
  minXp: number   // XP nécessaire pour atteindre ce niveau
  color: string   // couleur de l'insigne
}

// 50 niveaux avec titres progressifs
export const LEVELS: Level[] = [
  { level:  1, title: 'Curieux',                minXp:       0, color: '#9ca3af' },
  { level:  2, title: 'Guetteur',               minXp:      80, color: '#9ca3af' },
  { level:  3, title: 'Apprenti Felino',        minXp:     200, color: '#9ca3af' },
  { level:  4, title: 'Flâneur de l\'Océan',   minXp:     380, color: '#60a5fa' },
  { level:  5, title: 'Observateur',            minXp:     600, color: '#60a5fa' },
  { level:  6, title: 'Pisteur Urbain',         minXp:     880, color: '#60a5fa' },
  { level:  7, title: 'Habitué du Quartier',    minXp:    1220, color: '#60a5fa' },
  { level:  8, title: 'Veilleur de l\'Océan',  minXp:    1620, color: '#34d399' },
  { level:  9, title: 'Ami des Chats',          minXp:    2080, color: '#34d399' },
  { level: 10, title: 'Explorateur Félin',      minXp:    2600, color: '#34d399' },
  { level: 11, title: 'Chroniqueur Urbain',     minXp:    3200, color: '#34d399' },
  { level: 12, title: 'Détective Pelucheux',    minXp:    3880, color: '#34d399' },
  { level: 13, title: 'Cartographe Félin',      minXp:    4640, color: '#a78bfa' },
  { level: 14, title: 'Correspondant de Rue',   minXp:    5480, color: '#a78bfa' },
  { level: 15, title: 'Conteur de Ruelle',      minXp:    6400, color: '#a78bfa' },
  { level: 16, title: 'Gardien du Quartier',    minXp:    7400, color: '#a78bfa' },
  { level: 17, title: 'Sage des Terrasses',     minXp:    8480, color: '#a78bfa' },
  { level: 18, title: 'Photographe Errant',     minXp:    9640, color: '#f59e0b' },
  { level: 19, title: 'Chasseur de Silhouettes',minXp:   10880, color: '#f59e0b' },
  { level: 20, title: 'Maître des Murmures',    minXp:   12200, color: '#f59e0b' },
  { level: 21, title: 'Archiviste Félin',       minXp:   13600, color: '#f59e0b' },
  { level: 22, title: 'Émissaire des Ruelles',  minXp:   15080, color: '#f59e0b' },
  { level: 23, title: 'Mémoire de l\'Océan',    minXp:   16640, color: '#f59e0b' },
  { level: 24, title: 'Passeur de Secrets',     minXp:   18280, color: '#f97316' },
  { level: 25, title: 'Connétable des Chats',   minXp:   20000, color: '#f97316' },
  { level: 26, title: 'Seigneur des Médinas',   minXp:   21800, color: '#f97316' },
  { level: 27, title: 'Tisserand de l\'Errant', minXp:   23680, color: '#f97316' },
  { level: 28, title: 'Oracle du Bitume',       minXp:   25640, color: '#f97316' },
  { level: 29, title: 'Pèlerin de Nuit',        minXp:   27680, color: '#ef4444' },
  { level: 30, title: 'Ambassadeur Félin',      minXp:   29800, color: '#ef4444' },
  { level: 31, title: 'Prophète des Sardines',  minXp:   32000, color: '#ef4444' },
  { level: 32, title: 'Voyant du Quartier',     minXp:   34280, color: '#ef4444' },
  { level: 33, title: 'Archonte de l\'Océan',   minXp:   36640, color: '#ef4444' },
  { level: 34, title: 'Héros des Toits',        minXp:   39080, color: '#ef4444' },
  { level: 35, title: 'Paladin Pelucheux',      minXp:   41600, color: '#ec4899' },
  { level: 36, title: 'Protecteur des Errants', minXp:   44200, color: '#ec4899' },
  { level: 37, title: 'Centurion Félin',        minXp:   46880, color: '#ec4899' },
  { level: 38, title: 'Grand Pisteur',          minXp:   49640, color: '#ec4899' },
  { level: 39, title: 'Wali des Chats',         minXp:   52480, color: '#ec4899' },
  { level: 40, title: 'Sultan des Matous',      minXp:   55400, color: '#d97706' },
  { level: 41, title: 'Maharaja des Ruelles',   minXp:   58400, color: '#d97706' },
  { level: 42, title: 'Commandeur de l\'Aube',  minXp:   61480, color: '#d97706' },
  { level: 43, title: 'Vizir des Terrasses',    minXp:   64640, color: '#d97706' },
  { level: 44, title: 'Élu des Miaulements',    minXp:   67880, color: '#d97706' },
  { level: 45, title: 'Gardien de l\'Aura',     minXp:   71200, color: '#7c3aed' },
  { level: 46, title: 'Imam des Errants',       minXp:   74600, color: '#7c3aed' },
  { level: 47, title: 'Lumière de l\'Océan',    minXp:   78080, color: '#7c3aed' },
  { level: 48, title: 'Mythe de la Rue',        minXp:   81640, color: '#7c3aed' },
  { level: 49, title: 'Légende de l\'Océan',    minXp:   85280, color: '#7c3aed' },
  { level: 50, title: '✨ Dieu des Chats ✨',   minXp:   90000, color: '#fbbf24' },
]

// XP par action
export const XP_REWARDS = {
  NEW_CAT:      100,  // nouveau chat découvert
  CHECKIN:       15,  // observation sur un chat existant
  NIGHT_PHOTO:   40,  // photo prise entre 21h et 6h
  NEW_STREET:    60,  // premier chat sur une nouvelle rue
  ANECDOTE:       5,  // ajout d'un murmure/anecdote
} as const

export type XpAction = keyof typeof XP_REWARDS

// Retourne le niveau et le titre pour un total XP donné
export function getLevelInfo(totalXp: number): { current: Level; next: Level | null; progress: number } {
  let current = LEVELS[0]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].minXp) { current = LEVELS[i]; break }
  }
  const next = current.level < 50 ? LEVELS[current.level] : null
  const progress = next
    ? (totalXp - current.minXp) / (next.minXp - current.minXp)
    : 1
  return { current, next, progress: Math.min(progress, 1) }
}
