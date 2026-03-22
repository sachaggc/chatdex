// ── Daily Mission System ──────────────────────────────────────────────────────

export interface Mission {
  id: string
  emoji: string
  label: string
  description: string
  xpReward: number
  target: number
  triggers: string[]         // XP action names that count towards this mission
  category: 'obs' | 'special' | 'discovery'
}

// Sub-pools ensure variety: 1 from each category per day
const OBS_MISSIONS: Mission[] = [
  { id: 'm_obs2', category: 'obs', emoji: '👀', label: 'En balade',       description: 'Logge 2 observations aujourd\'hui', xpReward:  50, target: 2, triggers: ['CHECKIN', 'NEW_CAT'] },
  { id: 'm_obs3', category: 'obs', emoji: '👁️', label: 'Actif',           description: 'Logge 3 observations aujourd\'hui', xpReward:  80, target: 3, triggers: ['CHECKIN', 'NEW_CAT'] },
  { id: 'm_obs4', category: 'obs', emoji: '⚡',  label: 'En forme',        description: 'Logge 4 observations aujourd\'hui', xpReward: 120, target: 4, triggers: ['CHECKIN', 'NEW_CAT'] },
  { id: 'm_obs5', category: 'obs', emoji: '🔥',  label: 'Champion',        description: 'Logge 5 observations aujourd\'hui', xpReward: 160, target: 5, triggers: ['CHECKIN', 'NEW_CAT'] },
  { id: 'm_obs6', category: 'obs', emoji: '🏆',  label: 'Journée chargée', description: 'Logge 6 observations aujourd\'hui', xpReward: 210, target: 6, triggers: ['CHECKIN', 'NEW_CAT'] },
  { id: 'm_obs1', category: 'obs', emoji: '🐱',  label: 'Première balade', description: 'Ta première observation du jour',   xpReward:  20, target: 1, triggers: ['CHECKIN', 'NEW_CAT'] },
]

const SPECIAL_MISSIONS: Mission[] = [
  { id: 'm_nuit',    category: 'special', emoji: '🌙', label: 'Chasseur de nuit', description: 'Observe un chat après 21h',      xpReward:  80, target: 1, triggers: ['NIGHT_PHOTO'] },
  { id: 'm_rue',     category: 'special', emoji: '📍', label: 'Explorateur',      description: 'Découvre une nouvelle rue',      xpReward: 100, target: 1, triggers: ['NEW_STREET'] },
  { id: 'm_murmure', category: 'special', emoji: '💬', label: 'Chroniqueur',      description: 'Ajoute un murmure sur un chat', xpReward:  50, target: 1, triggers: ['ANECDOTE'] },
  { id: 'm_2rues',   category: 'special', emoji: '🗺️', label: 'Géographe',       description: 'Découvre 2 nouvelles rues',     xpReward: 180, target: 2, triggers: ['NEW_STREET'] },
]

const DISCOVERY_MISSIONS: Mission[] = [
  { id: 'm_newcat',  category: 'discovery', emoji: '✨', label: 'Découvreur',       description: 'Ajoute un nouveau chat au Chatdex', xpReward: 150, target: 1, triggers: ['NEW_CAT'] },
  { id: 'm_newcat2', category: 'discovery', emoji: '🎯', label: 'Double découverte', description: 'Ajoute 2 nouveaux chats',           xpReward: 260, target: 2, triggers: ['NEW_CAT'] },
  { id: 'm_newobs',  category: 'discovery', emoji: '🌟', label: 'Chasseur étoilé',  description: 'Observe un chat pour la 1ère fois', xpReward:  90, target: 1, triggers: ['NEW_CAT'] },
]

/** Génère 3 missions pour aujourd'hui — déterministe, même résultat pour Sacha et Antoine */
export function getDailyMissions(date: string = new Date().toISOString().slice(0, 10)): Mission[] {
  // LCG seeded by date string
  let s = date.split('').reduce((acc, c, i) => (acc + c.charCodeAt(0) * (i + 1)) | 0, 0)
  const next = () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) }

  const pick = (pool: Mission[]) => pool[next() % pool.length]

  return [pick(OBS_MISSIONS), pick(SPECIAL_MISSIONS), pick(DISCOVERY_MISSIONS)]
}

// ── localStorage persistence ──────────────────────────────────────────────────

export interface MissionState {
  progress: Record<string, number>   // missionId → count
  completed: string[]                // missionId[]
}

function storageKey(username: string, date: string) {
  return `chatdex_missions_${username}_${date}`
}

export function getMissionState(username: string, date: string): MissionState {
  if (typeof window === 'undefined') return { progress: {}, completed: [] }
  try {
    const raw = localStorage.getItem(storageKey(username, date))
    return raw ? JSON.parse(raw) : { progress: {}, completed: [] }
  } catch {
    return { progress: {}, completed: [] }
  }
}

/** Update progress when an XP action fires. Returns newly completed missions. */
export function updateMissionProgress(
  username: string,
  date: string,
  action: string,
  missions: Mission[],
): { newlyCompleted: Mission[]; state: MissionState } {
  const state = getMissionState(username, date)
  const newlyCompleted: Mission[] = []

  for (const m of missions) {
    if (state.completed.includes(m.id)) continue
    if (!m.triggers.includes(action)) continue

    state.progress[m.id] = (state.progress[m.id] ?? 0) + 1
    if (state.progress[m.id] >= m.target) {
      state.completed.push(m.id)
      newlyCompleted.push(m)
    }
  }

  try { localStorage.setItem(storageKey(username, date), JSON.stringify(state)) } catch { /* storage full */ }

  return { newlyCompleted, state }
}
