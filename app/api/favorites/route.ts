/**
 * app/api/favorites/route.ts
 * Gestion des favoris de l'utilisateur connecté.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const favorites = db.prepare(
    'SELECT * FROM favorites WHERE user_id = ? ORDER BY priority DESC, created_at DESC'
  ).all(user.id)

  return NextResponse.json({ favorites })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { codAff, notes, listName } = body

  if (!codAff) return NextResponse.json({ error: 'codAff requis.' }, { status: 400 })

  try {
    db.prepare(`
      INSERT INTO favorites (user_id, cod_aff, notes, list_name)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, cod_aff) DO UPDATE SET
        notes    = excluded.notes,
        list_name = excluded.list_name,
        updated_at = datetime('now')
    `).run(user.id, codAff, notes || '', listName || 'principale')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[favorites POST]', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const codAff = searchParams.get('codAff')
  if (!codAff) return NextResponse.json({ error: 'codAff requis.' }, { status: 400 })

  db.prepare('DELETE FROM favorites WHERE user_id = ? AND cod_aff = ?').run(user.id, codAff)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { codAff, status, notes, priority } = body

  if (!codAff) return NextResponse.json({ error: 'codAff requis.' }, { status: 400 })

  const updates: string[] = ["updated_at = datetime('now')"]
  const values: (string | number)[] = []

  if (status   !== undefined) { updates.push('status = ?');   values.push(status)   }
  if (notes    !== undefined) { updates.push('notes = ?');    values.push(notes)    }
  if (priority !== undefined) { updates.push('priority = ?'); values.push(priority) }

  if (values.length === 0) return NextResponse.json({ ok: true })

  db.prepare(
    `UPDATE favorites SET ${updates.join(', ')} WHERE user_id = ? AND cod_aff = ?`
  ).run(...values, user.id, codAff)

  return NextResponse.json({ ok: true })
}
