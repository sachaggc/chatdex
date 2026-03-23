'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Barre de progression de navigation — un 🐱 court le long du chemin.
 * Démarre à chaque clic sur un lien interne, se termine quand le pathname change.
 */
export default function CatProgress() {
  const pathname   = usePathname()
  const [width, setWidth]   = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPath     = useRef(pathname)
  const loadingRef   = useRef(false)   // évite les doublons

  // Démarre la barre sur clic d'un lien interne
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      // Ignore : liens externes, ancres, target=_blank, même page
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return
      if (anchor.target === '_blank') return
      const dest = href.split('?')[0].split('#')[0]
      if (dest === window.location.pathname) return

      if (loadingRef.current) return
      loadingRef.current = true

      clearInterval(intervalRef.current!)
      clearTimeout(timeoutRef.current!)
      setVisible(true)

      // Part à 12% immédiatement puis ralentit en approchant 90%
      let w = 12
      setWidth(w)
      intervalRef.current = setInterval(() => {
        w += (90 - w) * 0.09 + 0.4
        if (w >= 90) { w = 90; clearInterval(intervalRef.current!) }
        setWidth(w)
      }, 90)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  // Quand le pathname change → barre à 100% puis fade out
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    loadingRef.current = false
    clearInterval(intervalRef.current!)
    setWidth(100)
    timeoutRef.current = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 380)
    return () => clearTimeout(timeoutRef.current!)
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div
        style={{
          height: 3,
          width: `${width}%`,
          background: 'linear-gradient(90deg, #C34B32, #C98A2F)',
          boxShadow: '0 0 10px #C98A2F90',
          transition: width === 100
            ? 'width 200ms ease-out'
            : 'width 90ms linear',
          position: 'relative',
        }}
      >
        {/* Chat à la pointe de la barre */}
        <span
          style={{
            position: 'absolute',
            right: -10,
            top: -8,
            fontSize: 16,
            lineHeight: 1,
            userSelect: 'none',
            transform: 'scaleX(-1)',   // chat orienté vers la droite
          }}
          aria-hidden
        >
          🐱
        </span>
      </div>
    </div>
  )
}
