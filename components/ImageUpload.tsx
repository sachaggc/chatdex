'use client'

import { useRef, useState } from 'react'
import { compressImage, extractGPS, extractDate } from '@/lib/compression'

interface Props {
  onImageReady: (file: File, gps: { lat: number; lng: number } | null, date: Date | null) => void
  label?: string
}

export default function ImageUpload({ onImageReady, label = 'Photo' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // On extrait les données EXIF AVANT la compression (la compression peut les supprimer)
      const [gps, date] = await Promise.all([extractGPS(file), extractDate(file)])

      // Compression
      const compressed = await compressImage(file)

      // Aperçu
      setPreview(URL.createObjectURL(compressed))

      // On remonte le fichier compressé + métadonnées
      onImageReady(compressed, gps, date)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-dark-brown mb-2">{label}</label>

      <div
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer rounded-xl border-2 border-dashed border-terracotta/30 bg-parchment hover:border-terracotta/60 transition-colors overflow-hidden"
        style={{ minHeight: 160 }}
      >
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <span className="text-2xl animate-spin">⟳</span>
            <span className="ml-2 text-sm text-gray-500">Compression...</span>
          </div>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Aperçu" className="w-full max-h-64 object-contain" />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-4xl">📸</span>
            <span className="text-sm">Toucher pour ajouter une photo</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment" // Ouvre la caméra arrière sur mobile
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
