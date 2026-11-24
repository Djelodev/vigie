/**
 * app/api/newsletter/route.ts
 * Abonnements newsletter.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const sub = db.prepare('SELECT * FROM newsletter_subs WHERE user_id = ?').get(user.id)
  return NextResponse.json({ sub: sub || null })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { email, frequency, prefs } = body

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })
  }

  const user = await getCurrentUser()
  const token = crypto.randomBytes(32).toString('hex')

  try {
    db.prepare(`
      INSERT INTO newsletter_subs (email, user_id, token, frequency, prefs)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        user_id   = excluded.user_id,
        token     = excluded.token,
        frequency = excluded.frequency,
        prefs     = excluded.prefs,
        updated_at = datetime('now')
    `).run(
      email.toLowerCase().trim(),
      user?.id ?? null,
      token,
      frequency || 'hebdo',
      JSON.stringify(prefs || {})
    )

    return NextResponse.json({ ok: true, message: 'Abonnement enregistré. Vérifiez votre e-mail pour confirmer.' })
  } catch (err) {
    console.error('[newsletter POST]', err)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

// Confirmation via token
export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })

  const result = db.prepare(
    "UPDATE newsletter_subs SET confirmed = 1, token = NULL, updated_at = datetime('now') WHERE token = ?"
  ).run(token)

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Token invalide ou déjà utilisé.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, message: 'Abonnement confirmé !' })
}

// Désabonnement
export async function DELETE(req: Request) {
  const user = await getCurrentUser()
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (user) {
    db.prepare('DELETE FROM newsletter_subs WHERE user_id = ?').run(user.id)
  } else if (email) {
    db.prepare('DELETE FROM newsletter_subs WHERE email = ?').run(email.toLowerCase())
  } else {
    return NextResponse.json({ error: 'Paramètre manquant.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, message: 'Désabonnement effectué.' })
}
