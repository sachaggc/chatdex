'use client'

import { useEffect, useState } from 'react'

// Fixed drops — deterministic so no hydration mismatch
const DROPS = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  left:     ((i * 2.857) % 100).toFixed(2),
  delay:    ((i * 0.17) % 2.5).toFixed(2),
  duration: (0.55 + (i % 6) * 0.08).toFixed(2),
  opacity:  (0.12 + (i % 5) * 0.04).toFixed(2),
  height:   60 + (i % 4) * 15,
}))

export default function WeatherOverlay() {
  const [weather, setWeather] = useState<string>('')

  useEffect(() => {
    const update = () =>
      setWeather(document.documentElement.getAttribute('data-weather') ?? '')

    update()

    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-weather'],
    })
    return () => obs.disconnect()
  }, [])

  if (weather !== 'rain' && weather !== 'storm') return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[900] overflow-hidden">
      {DROPS.map(d => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${d.left}%`,
            width: weather === 'storm' ? '2px' : '1px',
            height: `${d.height}px`,
            background: weather === 'storm'
              ? 'rgba(180, 210, 255, 0.6)'
              : 'rgba(150, 190, 255, 0.45)',
            borderRadius: '1px',
            animation: `rain-fall ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
      {weather === 'storm' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(100, 120, 200, 0.04)',
            animation: 'lightning 8s ease infinite',
          }}
        />
      )}
      <style>{`
        @keyframes lightning {
          0%, 92%, 96%, 100% { opacity: 0; }
          93% { opacity: 1; background: rgba(200, 220, 255, 0.15); }
          94% { opacity: 0; }
          95% { opacity: 1; background: rgba(200, 220, 255, 0.1); }
        }
      `}</style>
    </div>
  )
}
