'use client'

import { useEffect, useState } from 'react'

// Gouttes déterministes (pas d'hydration mismatch)
const DROPS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  left:     ((i * 1.43 + 3) % 105 - 3).toFixed(1),   // -3% à 102%
  delay:    ((i * 0.13) % 1.8).toFixed(2),
  duration: (0.45 + (i % 8) * 0.07).toFixed(2),
  opacity:  (0.18 + (i % 6) * 0.06).toFixed(2),
  height:   55 + (i % 5) * 18,
  width:    i % 4 === 0 ? 2 : 1,
}))

export default function WeatherOverlay() {
  const [weather, setWeather] = useState<string>('')

  useEffect(() => {
    const update = () =>
      setWeather(document.documentElement.getAttribute('data-weather') ?? '')
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-weather'] })
    return () => obs.disconnect()
  }, [])

  if (weather !== 'rain' && weather !== 'storm') return null

  const isStorm = weather === 'storm'

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[900] overflow-hidden"
      style={{ transform: 'rotate(-8deg) scale(1.15)', transformOrigin: 'top center' }}
    >
      {DROPS.map(d => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            top: `-${d.height}px`,
            left: `${d.left}%`,
            width: `${isStorm ? d.width + 1 : d.width}px`,
            height: `${d.height}px`,
            background: isStorm
              ? `linear-gradient(to bottom, transparent, rgba(190,215,255,${d.opacity}), rgba(210,230,255,0.7))`
              : `linear-gradient(to bottom, transparent, rgba(160,200,255,${d.opacity}))`,
            borderRadius: '0 0 2px 2px',
            animation: `rain-fall ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}

      {/* Voile ambiant léger */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isStorm
          ? 'linear-gradient(to bottom, rgba(80,100,160,0.06), transparent 60%)'
          : 'linear-gradient(to bottom, rgba(100,130,200,0.04), transparent 60%)',
      }} />

      {/* Éclair */}
      {isStorm && (
        <div style={{
          position: 'absolute',
          inset: 0,
          animation: 'lightning 7s ease infinite',
        }} />
      )}

      <style>{`
        @keyframes lightning {
          0%, 90%, 94%, 100% { opacity: 0; background: transparent; }
          91% { opacity: 1; background: rgba(220,235,255,0.18); }
          92% { opacity: 0; }
          93% { opacity: 1; background: rgba(220,235,255,0.12); }
        }
      `}</style>
    </div>
  )
}
