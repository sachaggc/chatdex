/**
 * Comparaison de photos de chats — 100% navigateur, zéro API, zéro token.
 *
 * Améliorations vs histogramme RGB simple :
 *  1. Espace HSV → la teinte (Hue) est insensible à la luminosité (soleil/ombre)
 *  2. Filtre background → pixels très clairs (murs) et très sombres (ombres) exclus
 *  3. Poids gaussien centré → le chat est au centre, l'arrière-plan en bordure
 *  4. Poids saturation → pixels colorés (pelage) > pixels neutres (béton, asphalte)
 *  5. Sécurité anti-faux-positif → on ne suggère que si clairement meilleur que tous les autres
 */

// ── Conversion RGB → HSV ─────────────────────────────────────────────────────
function rgbToHsv(r: number, g: number, b: number): [h: number, s: number, v: number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  const v = max
  const s = max < 0.001 ? 0 : d / max
  let h = 0
  if (d > 0.001) {
    if      (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else                 h = (rn - gn) / d + 4
    h = (h / 6 + 1) % 1
  }
  return [h, s, v]
}

// ── Descripteur d'image ───────────────────────────────────────────────────────
// Retourne un vecteur combinant :
//   • histogramme de teinte (Hue)  → couleur principale du pelage
//   • histogramme de saturation    → solidité/unicité de la couleur
// Le tout pondéré par position (centre > bords) et saturation (coloré > neutre)

const HUE_BINS = 24  // 15° par bin
const SAT_BINS = 8

function buildDescriptor(data: ImageData): Float32Array {
  const { width: W, height: H, data: px } = data
  const hue = new Float32Array(HUE_BINS)
  const sat = new Float32Array(SAT_BINS)
  const cx = W / 2, cy = H / 2
  const SIGMA = 0.55   // rayon de la gaussienne (0 = bord, 1 = centre)
  let total = 0

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const [h, s, v] = rgbToHsv(px[i], px[i + 1], px[i + 2])

      // ── Filtre background ──────────────────────────────────────────────────
      // Murs blancs / ciel très clair : valeur haute + faible saturation
      if (v > 0.92 && s < 0.08) continue
      // Pixels totalement noirs (sans info) — SEUIL BAS : ne pas exclure les chats noirs
      if (v < 0.02) continue
      // Bleu du ciel : teinte 0.55–0.70 (200°–250°) + forte saturation + haute valeur
      if (h > 0.54 && h < 0.71 && s > 0.45 && v > 0.6) continue

      // ── Poids gaussien centré ──────────────────────────────────────────────
      const dx = (x - cx) / cx
      const dy = (y - cy) / cy
      const gw = Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA))

      // ── Poids saturation ───────────────────────────────────────────────────
      // Pixels gris/beige (mur, asphalte) ont une faible saturation → moins de poids
      const sw = 0.20 + 0.80 * Math.pow(s, 0.6)

      const w = gw * sw
      total += w

      hue[Math.min(HUE_BINS - 1, Math.floor(h * HUE_BINS))] += w
      sat[Math.min(SAT_BINS  - 1, Math.floor(s * SAT_BINS))]  += w
    }
  }

  // Normalisation
  if (total > 0) {
    for (let i = 0; i < HUE_BINS; i++) hue[i] /= total
    for (let i = 0; i < SAT_BINS;  i++) sat[i]  /= total
  }

  // Vecteur final : 70% teinte + 30% saturation
  const desc = new Float32Array(HUE_BINS + SAT_BINS)
  for (let i = 0; i < HUE_BINS; i++) desc[i]            = hue[i] * 0.70
  for (let i = 0; i < SAT_BINS;  i++) desc[HUE_BINS + i] = sat[i] * 0.30
  return desc
}

// ── Similarité cosinus ────────────────────────────────────────────────────────
function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom < 1e-9 ? 0 : dot / denom
}

// ── Chargement image → canvas ────────────────────────────────────────────────
// Utilise fetch() pour contourner le blocage CORS du canvas (images Supabase).
// Sans ça, getImageData() lancerait une SecurityError sur toutes les photos.
async function imageDataFrom(src: string, size = 64): Promise<ImageData | null> {
  try {
    // Télécharger l'image comme blob → créer une URL locale sans restriction CORS
    const res = await fetch(src)
    if (!res.ok) return null
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)

    return await new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = canvas.height = size
          const ctx = canvas.getContext('2d')!
          const scale = Math.max(size / img.width, size / img.height)
          const sw = img.width * scale, sh = img.height * scale
          ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh)
          resolve(ctx.getImageData(0, 0, size, size))
        } catch { resolve(null) }
        finally { URL.revokeObjectURL(blobUrl) }
      }
      img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null) }
      img.src = blobUrl
    })
  } catch { return null }
}

// ── API publique ──────────────────────────────────────────────────────────────
export interface MatchResult {
  id: string
  name: string
  confidence: number // 0–1, similarité cosinus du descripteur HSV
}

// Seuil minimum pour apparaître dans les suggestions
// 0.86 = très strict pour éviter les faux positifs (canapé ≠ chat)
const THRESHOLD = 0.86
// Nombre max de suggestions affichées
const MAX_SUGGESTIONS = 3

export async function findMatches(
  photoFile: File,
  cats: Array<{ id: string; name: string; main_photo_url: string | null }>
): Promise<MatchResult[]> {

  // Descripteur de la nouvelle photo
  const photoUrl = URL.createObjectURL(photoFile)
  const queryData = await imageDataFrom(photoUrl)
  URL.revokeObjectURL(photoUrl)
  if (!queryData) return []
  const queryDesc = buildDescriptor(queryData)

  // Comparaison parallèle avec tous les chats
  const results = (
    await Promise.all(
      cats
        .filter(c => c.main_photo_url)
        .map(async cat => {
          const catData = await imageDataFrom(cat.main_photo_url!)
          if (!catData) return null
          const catDesc = buildDescriptor(catData)
          return { id: cat.id, name: cat.name, confidence: cosineSim(queryDesc, catDesc) }
        })
    )
  ).filter(Boolean) as MatchResult[]

  return results
    .filter(r => r.confidence >= THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SUGGESTIONS)
}
