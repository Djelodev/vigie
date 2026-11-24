/**
 * app/api/admin/process-reminders/route.ts
 * Commande de test : déclenche le traitement des rappels immédiatement.
 * Accès limité en prod (token requis).
 */
import { NextResponse } from 'next/server'
import { processReminders } from '@/lib/notifications'

export async function POST(req: Request) {
  // En développement, autorisé sans token
  if (process.env.NODE_ENV === 'production') {
    const auth = req.headers.get('x-admin-token')
    if (!auth || auth !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }
  }

  const result = processReminders()
  return NextResponse.json({ ok: true, ...result })
}
