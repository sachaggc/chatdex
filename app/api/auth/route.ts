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

// GET — vérifie si l'utilisateur est connecté
export async function GET(request: NextRequest) {
  const auth = request.cookies.get('chatdex_auth')
  if (auth?.value === '1') return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: false }, { status: 401 })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('chatdex_auth')
  return response
}
