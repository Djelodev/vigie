/**
 * app/api/tasks/route.ts
 * Gestion des tâches de l'utilisateur connecté.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? ORDER BY done ASC, created_at ASC'
  ).all(user.id)

  return NextResponse.json({ tasks })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { label, note, dueDate, category } = body

  if (!label?.trim()) return NextResponse.json({ error: 'Label requis.' }, { status: 400 })

  const result = db.prepare(
    'INSERT INTO tasks (user_id, label, note, due_date, category) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, label.trim(), note || '', dueDate || null, category || 'general')

  return NextResponse.json({ ok: true, id: result.lastInsertRowid })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { id, done, label, note, dueDate } = body

  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  const updates: string[] = ["updated_at = datetime('now')"]
  const values: (string | number | null)[] = []

  if (done    !== undefined) { updates.push('done = ?');     values.push(done ? 1 : 0)   }
  if (label   !== undefined) { updates.push('label = ?');    values.push(label)           }
  if (note    !== undefined) { updates.push('note = ?');     values.push(note)            }
  if (dueDate !== undefined) { updates.push('due_date = ?'); values.push(dueDate || null) }

  if (values.length === 0) return NextResponse.json({ ok: true })

  db.prepare(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
  ).run(...values, id, user.id)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, user.id)
  return NextResponse.json({ ok: true })
}
