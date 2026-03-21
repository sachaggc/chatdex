'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, LogIn, LogOut, Lock, Tag, Palette, Info, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { CATEGORY_COLORS } from '@/lib/rarity'
import { useRouter } from 'next/navigation'

interface Category { key: string; label: string; color: string; icon: string }

const DEFAULT_KEYS = ['fou', 'pacha', 'marxiste', 'babos', 'parkour']

export default function SettingsPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isAuth, setIsAuth]         = useState(false)
  const [password, setPassword]     = useState('')
  const [authError, setAuthError]   = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [newLabel, setNewLabel]     = useState('')
  const [newColor, setNewColor]     = useState(CATEGORY_COLORS[0])
  const [adding, setAdding]         = useState(false)
  const [addError, setAddError]     = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {})
    fetch('/api/auth').then(r => setIsAuth(r.ok)).catch(() => {})
  }, [])

  async function login() {
    setAuthLoading(true); setAuthError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) { setIsAuth(true); setPassword('') }
    else setAuthError('Mauvais mot de passe')
    setAuthLoading(false)
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.refresh(); setIsAuth(false)
  }

  async function addCategory() {
    if (!newLabel.trim()) return
    setAdding(true); setAddError('')
    const key = newLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, label: newLabel.trim(), color: newColor, icon: 'Tag' }),
    })
    if (res.ok) {
      const newCat = await res.json()
      setCategories(prev => [...prev, newCat])
      setNewLabel(''); setShowAddForm(false)
    } else {
      const { error } = await res.json(); setAddError(error ?? 'Erreur')
    }
    setAdding(false)
  }

  async function deleteCategory(key: string) {
    if (!confirm('Supprimer cette catégorie ?')) return
    const res = await fetch('/api/categories', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (res.ok) setCategories(prev => prev.filter(c => c.key !== key))
  }

  return (
    <div className="min-h-svh pb-24">
      <TopBar title="Réglages" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* ── Compte ─────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-display font-bold text-muted uppercase tracking-widest mb-2 px-1">Compte</p>
          <div className="rounded-2xl bg-surface border border-border overflow-hidden">
            {isAuth ? (
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-teal/15 flex items-center justify-center">
                    <Lock size={15} className="text-teal" />
                  </div>
                  <div>
                    <p className="font-semibold text-text text-sm">Connecté</p>
                    <p className="text-xs text-muted">Tu peux ajouter et modifier des chats</p>
                  </div>
                </div>
                <button onClick={logout} className="flex items-center gap-1.5 text-sm text-muted hover:text-red-500 transition-colors font-semibold">
                  <LogOut size={14} /> Déco
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center">
                    <LogIn size={15} className="text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-text text-sm">Non connecté</p>
                    <p className="text-xs text-muted">Lecture seule — entre le code pour modifier</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Code secret"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && login()}
                    className="input-field flex-1 py-2.5 text-sm"
                  />
                  <button onClick={login} disabled={authLoading || !password}
                    className="btn-primary px-5 py-2.5 text-sm disabled:opacity-40">
                    {authLoading ? '…' : 'OK'}
                  </button>
                </div>
                {authError && <p className="text-xs text-red-500 font-semibold">{authError}</p>}
              </div>
            )}
          </div>
        </section>

        {/* ── Catégories ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[11px] font-display font-bold text-muted uppercase tracking-widest">Catégories</p>
            {isAuth && (
              <button onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 text-xs text-brand font-bold">
                <Plus size={13} /> Ajouter
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-surface border border-border overflow-hidden divide-y divide-border">
            {categories.map(c => (
              <div key={c.key} className="flex items-center gap-3 px-4 py-3">
                <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="font-semibold text-text text-sm flex-1">{c.label}</span>
                <span className="text-[11px] text-muted font-mono bg-parchment rounded px-1.5 py-0.5">{c.key}</span>
                {isAuth && !DEFAULT_KEYS.includes(c.key) && (
                  <button onClick={() => deleteCategory(c.key)} className="text-border hover:text-red-500 transition-colors ml-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="px-4 py-4 text-sm text-muted">Aucune catégorie</p>
            )}
          </div>

          {/* Formulaire ajout */}
          {isAuth && showAddForm && (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Tag size={14} className="text-brand" />
                <p className="font-display font-semibold text-sm text-text">Nouvelle catégorie</p>
              </div>
              <input
                type="text"
                placeholder="Ex: Chat Philosophe"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                className="input-field text-sm"
                autoFocus
              />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Palette size={12} className="text-muted" />
                  <p className="text-xs text-muted font-semibold">Couleur</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewColor(c)}
                      className="h-7 w-7 rounded-full transition-all"
                      style={{
                        background: c,
                        transform: newColor === c ? 'scale(1.3)' : 'scale(1)',
                        outline: newColor === c ? `2px solid ${c}` : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
              {addError && <p className="text-xs text-red-500">{addError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm text-muted font-semibold hover:bg-parchment transition-colors">
                  Annuler
                </button>
                <button onClick={addCategory} disabled={adding || !newLabel.trim()}
                  className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-40">
                  {adding ? 'Ajout…' : 'Créer'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Navigation rapide ──────────────────────────────── */}
        <section>
          <p className="text-[11px] font-display font-bold text-muted uppercase tracking-widest mb-2 px-1">Aller à</p>
          <div className="rounded-2xl bg-surface border border-border overflow-hidden divide-y divide-border">
            {[
              { href: '/stats', label: 'Statistiques globales', emoji: '📊' },
              { href: '/aura',  label: 'Aura Farm — classement', emoji: '🔥' },
              { href: '/map',   label: 'Carte des spots', emoji: '🗺️' },
            ].map(({ href, label, emoji }) => (
              <a key={href} href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-parchment/50 transition-colors">
                <span className="text-lg">{emoji}</span>
                <span className="font-semibold text-text text-sm flex-1">{label}</span>
                <ChevronRight size={15} className="text-muted" />
              </a>
            ))}
          </div>
        </section>

        {/* ── À propos ───────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-display font-bold text-muted uppercase tracking-widest mb-2 px-1">À propos</p>
          <div className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
              <Info size={20} className="text-brand" />
            </div>
            <div>
              <p className="font-display font-bold text-text">Chatdex <span className="text-muted font-normal text-xs">v1.1</span></p>
              <p className="text-xs text-muted mt-0.5">Le Pokédex des chats de Rabat 🇲🇦</p>
              <p className="text-xs text-muted">Fait avec du 🍵 atay b n3na3 — rue Adis Abeba, Océan</p>
            </div>
          </div>
        </section>

      </div>
      <BottomNav />
    </div>
  )
}
