import imageCompression from 'browser-image-compression'

// Compresse une image avant upload
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.6,          // 600KB — bon équilibre vitesse/qualité
    maxWidthOrHeight: 1800,  // 1800px max
    useWebWorker: true,
    initialQuality: 0.85,
    fileType: 'image/webp',
  }
  try {
    return await imageCompression(file, options)
  } catch {
    // Si la compression échoue, on retourne l'original
    return file
  }
}

// Extrait les coordonnées GPS depuis les métadonnées EXIF d'une photo
export async function extractGPS(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    const exifr = await import('exifr')
    const gps = await exifr.gps(file)
    if (gps && gps.latitude && gps.longitude) {
      return { lat: gps.latitude, lng: gps.longitude }
    }
    return null
  } catch {
    return null
  }
}

// Extrait la date de prise de vue depuis les métadonnées EXIF
export async function extractDate(file: File): Promise<Date | null> {
  try {
    const exifr = await import('exifr')
    const data = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate', 'DateTime'])
    const raw = data?.DateTimeOriginal ?? data?.CreateDate ?? data?.DateTime
    if (!raw) return null
    // exifr retourne déjà un objet Date pour ces champs
    if (raw instanceof Date) return raw
    return null
  } catch {
    return null
  }
}
