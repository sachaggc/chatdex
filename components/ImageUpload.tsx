'use client'

import { useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { compressImage, extractGPS, extractDate } from '@/lib/compression'

interface Props {
  onImageReady: (file: File, gps: { lat: number; lng: number } | null, date: Date | null) => void
  onClear?: () => void
  label?: string
  required?: boolean
}

export default function ImageUpload({ onImageReady, onClear, label, required }: Props) {
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const [gps, date] = await Promise.all([extractGPS(file), extractDate(file)])
      const compressed  = await compressImage(file)
      setPreview(URL.createObjectURL(compressed))
      setFileName(file.name)
      onImageReady(compressed, gps, date)
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setPreview(null)
    setFileName(null)
    if (cameraRef.current)  cameraRef.current.value  = ''
    if (galleryRef.current) galleryRef.current.value = ''
    onClear?.()
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-text mb-2">
          {label}{required && <span className="text-brand ml-1">*</span>}
        </label>
      )}

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu" className="w-full max-h-72 object-contain bg-parchment" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X size={14} />
          </button>
          {fileName && (
            <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs px-3 py-1.5 truncate">
              {fileName}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border bg-surface overflow-hidden">
          {loading ? (
            <div className="flex h-36 items-center justify-center gap-2 text-muted">
              <div className="h-4 w-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-sm">Compression en cours…</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row">
              {/* Prendre une photo */}
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-muted hover:text-brand hover:bg-brand/5 transition-colors"
              >
                <Camera size={28} strokeWidth={1.5} />
                <span className="text-sm font-semibold font-display">Prendre une photo</span>
              </button>

              <div className="w-px bg-border sm:h-auto h-px mx-0 sm:mx-0" />

              {/* Importer depuis la galerie */}
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-muted hover:text-brand hover:bg-brand/5 transition-colors"
              >
                <ImagePlus size={28} strokeWidth={1.5} />
                <span className="text-sm font-semibold font-display">Depuis la galerie</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Caméra directe */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      {/* Galerie */}
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}
