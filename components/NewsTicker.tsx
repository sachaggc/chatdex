'use client'

import { useEffect, useState } from 'react'

interface Candidate { name: string; emoji: string; count: number; pct: number }

const STATIC_HEADLINES = [
  '🔴 BREAKING : Le MatouMètre™ s\'affole dans le quartier Océan — les chats votent !',
  '📊 SONDAGE EXCLUSIF : 3 chats sur 4 refusent de se prononcer — l\'abstention féline bat des records',
  '🚨 SOURCE BIEN PLACÉE : un chat aurait été aperçu en train de lire un tract politique rue Adis Abeba',
  '🐾 CONFLIT D\'INTÉRÊTS : le candidat préféré des chats promet des sardines gratuites si élu',
  '🎙️ LE GRAND DÉBAT : les chats du quartier restent muets face aux questions des journalistes',
  '📡 ALERTE CHATDEX : mouvement de troupes félines signalé côté Océan — situation à surveiller',
  '🗳️ INFO CHATDEX : la participation au premier tour s\'annonce record — les chats font la queue',
  '⚡ FLASH : un chat a mordu un sondeur — l\'incident diplomatique est en cours d\'évaluation',
  '🌊 TENDANCE : la vague féline déferle sur l\'Océan — les experts sont dépassés',
  '🤫 MURMURES DE RUE : un chat influent aurait changé de camp en échange d\'une boîte de thon',
]

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState<string[]>(STATIC_HEADLINES)

  useEffect(() => {
    fetch('/api/political/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const dynamic: string[] = []

        const top: Candidate = data.candidateStats?.[0]
        if (top?.count > 0) {
          dynamic.push(
            `${top.emoji ?? '🐾'} EN TÊTE : ${top.name} domine avec ${top.pct}% des votes félins de l'Océan — la concurrence est sonnée`,
            `📈 MATOU-MÈTRE : ${top.name} consolide son avance — ${top.count} chat${top.count > 1 ? 's' : ''} dans son camp`,
          )
        }

        const second: Candidate = data.candidateStats?.[1]
        if (second?.count > 0 && top?.count > 0) {
          dynamic.push(
            `⚔️ DUEL AU SOMMET : ${top.name} vs ${second.name} — l'écart se resserre dans le quartier Océan`,
          )
        }

        if (data.abstentions > 0) {
          dynamic.push(
            `🛋️ ABSTENTION RECORD : ${data.abstentions} chat${data.abstentions > 1 ? 's' : ''} refus${data.abstentions > 1 ? 'ent' : 'e'} de voter — "je préfère dormir" déclare l'un d'eux`,
          )
        }

        if (data.undecided > 0) {
          dynamic.push(
            `🤷 INDÉCIS : ${data.undecided} chat${data.undecided > 1 ? 's' : ''} encore sans affiliation politique — les courtisans s'agitent`,
          )
        }

        if (data.total > 0) {
          dynamic.push(
            `🗺️ CHATDEX LIVE : ${data.total} chats recensés dans le quartier Océan — le plus grand cadastre félin du Maroc`,
          )
        }

        setHeadlines([...dynamic, ...STATIC_HEADLINES])
      })
      .catch(() => {})
  }, [])

  if (headlines.length === 0) return null

  // Build a long repeated string for seamless loop
  const text = headlines.join('     ·     ') + '     ·     '

  return (
    <div className="news-ticker" role="marquee" aria-label="Breaking news Félitics">
      <div className="ticker-badge">
        <span className="ticker-dot" />
        LIVE
      </div>
      <div className="ticker-track-wrapper">
        <div className="ticker-track">
          <span>{text}{text}</span>
        </div>
      </div>
    </div>
  )
}
