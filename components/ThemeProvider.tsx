'use client'

import { useEffect } from 'react'

export default function ThemeProvider() {
  useEffect(() => {
    async function fetchWeather() {
      try {
        const r = await fetch('/api/weather')
        if (!r.ok) return
        const { condition } = await r.json()
        document.documentElement.setAttribute('data-weather', condition)
      } catch { /* ignore */ }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return null
}
