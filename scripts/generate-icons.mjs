// Script pour générer les icônes PNG depuis l'SVG
// Lance avec : node scripts/generate-icons.mjs

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function generateIcons() {
  try {
    const sharp = (await import('sharp')).default
    const svgBuffer = readFileSync(join(root, 'public', 'icon.svg'))

    for (const size of [192, 512]) {
      const outPath = join(root, 'public', `icon-${size}.png`)
      await sharp(svgBuffer).resize(size, size).png().toFile(outPath)
      console.log(`✓ icon-${size}.png généré`)
    }
    console.log('Icônes générées avec succès !')
  } catch (e) {
    console.error('Erreur :', e.message)
    console.log('\nAlternative : convertis public/icon.svg en PNG manuellement sur https://svgtopng.com')
    console.log('Tailles requises : 192x192 et 512x512')
    console.log('Noms des fichiers : public/icon-192.png et public/icon-512.png')
  }
}

generateIcons()
