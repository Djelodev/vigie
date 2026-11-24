/**
 * app/api/ai/conversations/route.ts
 * Gestion des conversations Vigi AI de l'utilisateur connecté.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

/** Liste les conversations de l'utilisateur */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const conversations = db.prepare(`
    SELECT id, title, created_at, updated_at
    FROM ai_conversations
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 20
  `).all(user.id)

  return NextResponse.json({ conversations })
}

/** Supprime une conversation */
export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis.' }, { status: 400 })

  db.prepare('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?').run(id, user.id)
  return NextResponse.json({ ok: true })
}
