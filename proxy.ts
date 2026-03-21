import { NextRequest, NextResponse } from 'next/server'

// Pages qui nécessitent d'être connecté
const PROTECTED_PAGES = ['/cats/new', '/cats/edit']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PAGES.some((p) => pathname.startsWith(p))

  if (isProtected) {
    const auth = request.cookies.get('chatdex_auth')
    if (auth?.value !== '1') {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cats/new', '/cats/edit/:path*'],
}
