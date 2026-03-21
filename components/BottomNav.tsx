'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Galerie', icon: '🐱' },
  { href: '/map', label: 'Carte', icon: '🗺️' },
  { href: '/cats/new', label: 'Ajouter', icon: '➕', primary: true },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 -mt-5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-2xl shadow-lg shadow-terracotta/30 border-4 border-cream">
                  {item.icon}
                </span>
                <span className="text-xs font-medium text-terracotta">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
                isActive ? 'text-terracotta' : 'text-gray-400'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
