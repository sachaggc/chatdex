'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (res.ok) {
      // Rechargement complet pour que le cookie soit pris en compte par le proxy
      window.location.href = from
    } else {
      setError('Code incorrect.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh zellige-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-brand mb-4">
            <svg viewBox="0 0 60 60" className="w-10 h-10 fill-white">
              <ellipse cx="30" cy="36" rx="22" ry="18"/>
              <ellipse cx="30" cy="24" rx="14" ry="13"/>
              <polygon points="16,16 10,4 22,10"/>
              <polygon points="44,16 38,10 50,4"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-text tracking-tight">
            <span className="text-brand">Chat</span>dex
          </h1>
          <p className="text-muted text-sm mt-1 font-medium">Les chats de Rabat · المغرب</p>
        </div>

        {/* Carte */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-brand" />
            <h2 className="font-display font-bold text-text">Accès réservé</h2>
          </div>
          <p className="text-sm text-muted mb-5">
            Entre le code secret pour ajouter ou modifier des chats.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Code secret"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="input-field"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            <button type="submit" disabled={loading || !code} className="btn-primary w-full">
              {loading ? 'Vérification…' : 'Accéder'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-5">
          Tout le monde peut consulter le Chatdex.<br />
          Seuls les initiés peuvent ajouter des chats.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
