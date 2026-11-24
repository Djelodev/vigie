/**
 * app/api/comparer/route.ts
 * Sauvegarde et récupération de la sélection du comparateur.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ selection: [] })

  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(`comparer_${user.id}`) as { value: string } | undefined
  const selection = row ? JSON.parse(row.value) : []
  return NextResponse.json({ selection })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { selection } = body

  if (!Array.isArray(selection)) return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })
  const limited = selection.slice(0, 4)

  db.prepare(`
    INSERT INTO meta (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(`comparer_${user.id}`, JSON.stringify(limited))

  return NextResponse.json({ ok: true })
}
