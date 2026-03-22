import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const expires_at = body.duration_days
    ? new Date(Date.now() + body.duration_days * 86400000).toISOString()
    : null
  const { data, error } = await supabase
    .from('news_items')
    .insert({ content: body.content, expires_at, is_auto: false })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  const { error } = await supabase.from('news_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
