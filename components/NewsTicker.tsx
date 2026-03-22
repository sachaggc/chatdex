'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewsItem { id: string; content: string; is_auto: boolean }

const FALLBACK = [
  '🔴 BREAKING : le MatouMètre™ de l\'Océan s\'affole — participation record attendue ce soir',
  '📊 SONDAGE EXCLUSIF : 3 chats sur 4 refusent de se prononcer sur la question catalane',
  '🐾 INFO CHATDEX : mouvement de troupes félines signalé rue Adis Abeba — la situation est tendue',
  '🎙️ LE GRAND DÉBAT : les chats du quartier restent muets face aux journalistes en embuscade',
  '🤫 MURMURES DE RUE : un chat influent aurait changé de camp en échange d\'une boîte de thon premium',
  '⚡ FLASH : un chat aurait mordu un sondeur — l\'incident diplomatique est en cours d\'évaluation',
  '🌊 TENDANCE : la vague féline déferle sur l\'Océan — les experts sont formellement dépassés',
  '🛋️ ABSTENTION RECORD : plusieurs chats refusent de voter, préférant dormir selon nos sources',
]

export default function NewsTicker() {
  const router = useRouter()
  const [text, setText] = useState(FALLBACK.join('  ·  '))

  useEffect(() => {
    fetch('/api/political/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const dynamic: string[] = []
        const top = data.candidateStats?.[0]
        if (top?.count > 0) {
          dynamic.push(`${top.emoji ?? '🐾'} EN TÊTE : ${top.name} domine avec ${top.pct}% des chats de l'Océan`)
        }
        const second = data.candidateStats?.[1]
        if (second?.count > 0 && top?.count > 0) {
          const gap = top.pct - second.pct
          dynamic.push(`⚔️ DUEL : ${top.name} vs ${second.name} — écart de ${gap} point${gap > 1 ? 's' : ''} seulement`)
        }
        if (data.abstentions > 0) {
          dynamic.push(`🛋️ ABSTENTION : ${data.abstentions} chat${data.abstentions > 1 ? 's' : ''} refus${data.abstentions > 1 ? 'ent' : 'e'} catégoriquement de voter`)
        }
        if (data.total > 0) {
          dynamic.push(`🗺️ ${data.total} chats recensés dans le quartier Océan · Rue Adis Abeba`)
        }
        const allNews = [...dynamic, ...FALLBACK]
        setText(allNews.join('  ·  '))
      })
      .catch(() => {})

    // Fetch aussi les news custom
    fetch('/api/news')
      .then(r => r.ok ? r.json() : [])
      .then((items: NewsItem[]) => {
        if (items.length > 0) {
          const custom = items.map(i => i.content)
          setText(() => [...custom, ...FALLBACK].join('  ·  '))
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div
      className="news-ticker cursor-pointer select-none"
      onClick={() => router.push('/news')}
      title="Cliquer pour gérer les breaking news"
    >
      <div className="ticker-badge">
        <span className="ticker-dot" />
        LIVE
      </div>
      <div className="ticker-track-wrapper">
        <div className="ticker-track" key={text}>
          <span aria-hidden="true">{text}  ·  {text}  ·  </span>
        </div>
      </div>
    </div>
  )
}
