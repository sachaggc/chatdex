import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (code !== process.env.SECRET_CODE) {
    return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })

  // Cookie valide 30 jours
  response.cookies.set('chatdex_auth', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('chatdex_auth')
  return response
}
