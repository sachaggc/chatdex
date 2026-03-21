'use client'

import Link from 'next/link'

interface Props {
  title?: string
  backHref?: string
  action?: React.ReactNode
}

export default function TopBar({ title, backHref, action }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-terracotta/10">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref} className="text-terracotta text-xl font-bold">
              ←
            </Link>
          )}
          <span className="font-bold text-dark-brown text-lg">
            {title ?? (
              <>
                <span className="text-terracotta">Chat</span>dex
                <span className="text-saffron"> 🐾</span>
              </>
            )}
          </span>
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  )
}
