'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, LogOut } from 'lucide-react'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { CATEGORY_COLORS } from '@/lib/rarity'
import { useRouter } from 'next/navigation'

interface Category { key: string; label: string; color: string; icon: string }

const DEFAULT_KEYS = ['fou', 'pacha', 'marxiste', 'babos', 'parkour']

export default function SettingsPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isAuth, setIsAuth]     = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0])
  const [adding, setAdding]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
    // Vérifie si connecté
    fetch('/api/auth', { method: 'GET' }).then(r => setIsAuth(r.ok)).catch(() => {})
  }, [])

  async function addCategory() {
    if (!newLabel.trim()) return
    setAdding(true); setError('')
    const key = newLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, label: newLabel.trim(), color: newColor, icon: 'Tag' }),
    })
    if (res.ok) {
      const cat = await res.json()
      setCategories(prev => [...prev, cat])
      setNewLabel('')
    } else {
      const { error } = await res.json()
      setError(error ?? 'Erreur')
    }
    setAdding(false)
  }

  async function deleteCategory(key: string) {
    if (!confirm('Supprimer cette catégorie ?')) return
    const res = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (res.ok) setCategories(prev => prev.filter(c => c.key !== key))
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.refresh()
    setIsAuth(false)
  }

  return (
    <div className="min-h-svh pb-24">
      <TopBar title="Réglages" />

      <div className="px-4 py-5 max-w-lg mx-auto space-y-8">

        {/* Catégories */}
        <section>
          <h2 className="font-display font-bold text-text text-lg mb-4">Catégories</h2>

          <div className="space-y-2 mb-4">
            {categories.map(c => (
              <div key={c.key} className="flex items-center gap-3 rounded-xl bg-surface border border-border p-3">
                <div className="h-4 w-4 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="font-semibold text-text flex-1">{c.label}</span>
                <span className="text-xs text-muted font-mono">{c.key}</span>
                {!DEFAULT_KEYS.includes(c.key) && (
                  <button onClick={() => deleteCategory(c.key)} className="text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Ajouter une catégorie */}
          <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
            <p className="font-display font-semibold text-sm text-text">Nouvelle catégorie</p>
            <input
              type="text"
              placeholder="Ex: Chat Philosophe"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="input-field"
            />
            <div>
              <p className="text-xs text-muted mb-2">Couleur</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="h-7 w-7 rounded-full transition-transform"
                    style={{
                      background: c,
                      transform: newColor === c ? 'scale(1.25)' : 'scale(1)',
                      outline: newColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={addCategory}
              disabled={adding || !newLabel.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-40"
            >
              <Plus size={16} /> {adding ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </section>

        {/* Compte */}
        <section>
          <h2 className="font-display font-bold text-text text-lg mb-4">Compte</h2>
          <div className="rounded-xl bg-surface border border-border p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-text text-sm">Statut</p>
              <p className="text-xs text-muted mt-0.5">
                {isAuth ? 'Connecté — tu peux ajouter des chats' : 'Non connecté — lecture seule'}
              </p>
            </div>
            {isAuth && (
              <button onClick={logout} className="flex items-center gap-1.5 text-sm text-muted hover:text-red-500 transition-colors font-semibold">
                <LogOut size={15} /> Déconnexion
              </button>
            )}
          </div>
        </section>

        {/* À propos */}
        <section>
          <h2 className="font-display font-bold text-text text-lg mb-4">À propos</h2>
          <div className="rounded-xl bg-surface border border-border p-4 space-y-1 text-sm text-muted">
            <p><span className="font-semibold text-text">Chatdex</span> v1.0</p>
            <p>Le Pokédex des chats de Rabat 🇲🇦</p>
          </div>
        </section>

      </div>

      <BottomNav />
    </div>
  )
}
