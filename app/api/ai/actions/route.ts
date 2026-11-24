/**
 * app/api/ai/actions/route.ts
 * Confirmation ou annulation d'une action proposée par Vigi AI.
 *
 * L'utilisateur confirme via l'UI → ce handler vérifie la session,
 * valide l'action et l'exécute via le service métier réel.
 *
 * Sécurité :
 * - L'action est liée à user_id extrait de la SESSION (jamais du body)
 * - L'action expire après 5 minutes
 * - Une action ne peut être exécutée qu'une seule fois (protection doublon)
 * - Le format de l'action est validé côté serveur
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { executeConfirmedAction, markActionCancelled } from '@/lib/ai-actions'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  let body: { actionId?: string; decision?: 'confirm' | 'cancel' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 })
  }

  const { actionId, decision } = body

  if (!actionId || typeof actionId !== 'string') {
    return NextResponse.json({ error: 'actionId requis.' }, { status: 400 })
  }

  if (decision !== 'confirm' && decision !== 'cancel') {
    return NextResponse.json({ error: 'decision doit être confirm ou cancel.' }, { status: 400 })
  }

  if (decision === 'cancel') {
    const ok = markActionCancelled(actionId, user.id)
    return NextResponse.json({ ok })
  }

  // Confirmation
  const result = await executeConfirmedAction(actionId, user.id)

  if (!result.ok) {
    const status = result.error === 'ACTION_NOT_FOUND_OR_EXPIRED' ? 404
                 : result.error === 'ALREADY_EXECUTED'            ? 409
                 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ ok: true, data: result.data })
}
