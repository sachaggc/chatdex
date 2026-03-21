'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    if (res.ok) {
      router.push(from)
      router.refresh()
    } else {
      setError('Code incorrect. Réessaie.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh zellige-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐱</div>
          <h1 className="text-3xl font-bold text-dark-brown">
            <span className="text-terracotta">Chat</span>dex
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Les chats de Rabat 🇲🇦</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-terracotta/10">
          <h2 className="font-bold text-dark-brown mb-1">Accès réservé</h2>
          <p className="text-sm text-gray-500 mb-5">
            Entre le code secret pour ajouter des chats.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Code secret"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-moroccan"
                autoComplete="current-password"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !code}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Entrer 🚪'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Tout le monde peut consulter le Chatdex.
          <br />Seuls Sacha et son coloc peuvent ajouter des chats.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
