import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const r = await fetch('https://wttr.in/Rabat?format=j1', {
      next: { revalidate: 600 },
      headers: { 'User-Agent': 'Chatdex/1.0' },
    })
    if (!r.ok) return NextResponse.json({ condition: 'clear' })
    const data = await r.json()
    const code = parseInt(data.current_condition?.[0]?.weatherCode ?? '113')

    // https://www.worldweatheronline.com/developer/api/docs/weather-icons.aspx
    // 113=Sunny, 116=Partly cloudy, 119=Cloudy, 122=Overcast, 143-185=Mist/fog/patchy
    // 176+=Rain, 200+=Storm
    const condition =
      code <= 113 ? 'clear' :       // uniquement ciel dégagé
      code <= 175 ? 'cloudy' :      // partiellement nuageux → brume → brouillard
      (code >= 200 && code <= 221) ? 'storm' :
      code <= 314 ? 'rain' :
      'clear'

    return NextResponse.json({ condition, code })
  } catch {
    return NextResponse.json({ condition: 'clear' })
  }
}
