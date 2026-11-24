/**
 * app/api/reminders/route.ts
 * Rappels personnels.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const reminders = db.prepare(
    'SELECT * FROM reminders WHERE user_id = ? ORDER BY due_date ASC'
  ).all(user.id)

  return NextResponse.json({ reminders })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { label, note, dueDate } = body

  if (!label?.trim() || !dueDate) {
    return NextResponse.json({ error: 'Label et date requis.' }, { status: 400 })
  }

  const result = db.prepare(
    'INSERT INTO reminders (user_id, label, note, due_date) VALUES (?, ?, ?, ?)'
  ).run(user.id, label.trim(), note || '', dueDate)

  return NextResponse.json({ ok: true, id: result.lastInsertRowid })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(id, user.id)
  return NextResponse.json({ ok: true })
}
