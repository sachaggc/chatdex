import imageCompression from 'browser-image-compression'

// Compresse une image à ~200KB max avant upload
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2,        // 200KB max
    maxWidthOrHeight: 1200, // 1200px max
    useWebWorker: true,
    fileType: 'image/webp', // WebP = meilleur rapport qualité/taille
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
    const data = await exifr.parse(file, ['DateTimeOriginal'])
    return data?.DateTimeOriginal ?? null
  } catch {
    return null
  }
}
