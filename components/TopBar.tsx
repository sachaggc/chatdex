'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Sun, Moon, Sunrise, Sunset, CloudSun, Cloud, CloudRain, CloudLightning } from 'lucide-react'

interface Props {
  title?: React.ReactNode
  backHref?: string
  action?: React.ReactNode
}

const TIME_CONFIG = {
  dawn:    { Icon: Sunrise,  label: 'Aube'    },
  day:     { Icon: Sun,      label: 'Jour'    },
  sunset:  { Icon: Sunset,   label: 'Coucher' },
  evening: { Icon: CloudSun, label: 'Soir'    },
  night:   { Icon: Moon,     label: 'Nuit'    },
} as const

const WEATHER_CONFIG = {
  cloudy: { Icon: Cloud,          label: 'Nuageux' },
  rain:   { Icon: CloudRain,      label: 'Pluie'   },
  storm:  { Icon: CloudLightning, label: 'Orage'   },
} as const

function TimeWeatherBadge() {
  const [time, setTime]       = useState<string>('')
  const [weather, setWeather] = useState<string>('')
  const [clock, setClock]     = useState('')

  useEffect(() => {
    const update = () => {
      setTime(document.documentElement.getAttribute('data-time') ?? 'day')
      setWeather(document.documentElement.getAttribute('data-weather') ?? '')
      const now = new Date()
      setClock(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }
    update()

    // Resync every minute
    const interval = setInterval(update, 60_000)

    // Watch for attribute changes (weather update)
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-time', 'data-weather'] })

    return () => { clearInterval(interval); obs.disconnect() }
  }, [])

  if (!time) return null

  const timeCfg  = TIME_CONFIG[time as keyof typeof TIME_CONFIG]
  const weatherCfg = WEATHER_CONFIG[weather as keyof typeof WEATHER_CONFIG]
  const TimeIcon = timeCfg?.Icon ?? Sun

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-muted">
      <TimeIcon size={12} strokeWidth={2} />
      {clock && <span className="text-[11px] font-semibold tabular-nums">{clock}</span>}
      {weatherCfg && (
        <>
          <span className="text-border">·</span>
          <weatherCfg.Icon size={12} strokeWidth={2} />
        </>
      )}
    </div>
  )
}

export default function TopBar({ title, backHref, action }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">

        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref} className="flex items-center justify-center h-8 w-8 rounded-full bg-surface border border-border text-muted hover:text-text transition-colors">
              <ArrowLeft size={16} strokeWidth={2} />
            </Link>
          )}
          <div className="font-display font-bold text-text text-lg tracking-tight">
            {title ?? (
              <>
                <span className="text-brand">Chat</span>
                <span>dex</span>
                <span className="text-gold ml-1 text-sm">◆</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicateur heure/météo — seulement sur la page d'accueil (pas de backHref) */}
          {!backHref && <TimeWeatherBadge />}
          {action && <div>{action}</div>}
        </div>
      </div>
    </header>
  )
}
