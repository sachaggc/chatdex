'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title?: React.ReactNode
  backHref?: string
  action?: React.ReactNode
}

export default function TopBar({ title, backHref, action }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">

        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref} className="flex items-center justify-center h-8 w-8 rounded-full bg-surface border border-border text-muted hover:text-text transition-colors">
              <ArrowLeft size={16} strokeWidth={2} />
            </Link>
          )}
          <div className="font-display font-bold text-text text-lg tracking-tight">
            {title ?? (
              <>
                <span className="text-brand">Chat</span>
                <span>dex</span>
                <span className="text-gold ml-1 text-sm">◆</span>
              </>
            )}
          </div>
        </div>

        {action && <div>{action}</div>}
      </div>
    </header>
  )
}
