/**
 * app/api/auth/login/route.ts
 * Connexion d'un utilisateur existant.
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail et mot de passe requis.' }, { status: 400 })
    }

    const user = db.prepare('SELECT id, email, name, password FROM users WHERE email = ?')
      .get(email.toLowerCase().trim()) as
      { id: number; email: string; name: string; password: string } | undefined

    if (!user) {
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 })
    }

    const session = await getSession()
    session.userId = user.id
    session.email  = user.email
    session.name   = user.name
    await session.save()

    return NextResponse.json({ ok: true, userId: user.id, name: user.name })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
