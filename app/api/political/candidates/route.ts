import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const POLITICAL_ORDER = ['arthaud','melenchon','ruffin','tondelier','glucksmann','macron','attal','retailleau','lepen','knafo','soral']
function politicalIdx(name: string): number {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const i = POLITICAL_ORDER.findIndex(o => n.includes(o))
  return i === -1 ? 50 : i
}

export async function GET() {
  const { data, error } = await supabase
    .from('candidates')
    .select('*, alignment:political_alignments(id, name, color, position)')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sorted = [...(data ?? [])].sort((a, b) => politicalIdx(a.name) - politicalIdx(b.name))
  return NextResponse.json(sorted)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('candidates')
    .insert({
      name:         body.name,
      alignment_id: body.alignment_id ?? null,
      emoji:        body.emoji ?? '🐾',
      color:        body.color ?? '#888888',
    })
    .select('*, alignment:political_alignments(id, name, color, position)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', id)
    .select('*, alignment:political_alignments(id, name, color, position)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  const { error } = await supabase.from('candidates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
