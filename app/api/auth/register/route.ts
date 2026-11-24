/**
 * app/api/auth/register/route.ts
 * Inscription d'un nouvel utilisateur.
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db, DEFAULT_TASKS } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 8 caractères.' }, { status: 400 })
    }

    // Vérifier doublon
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
    if (existing) {
      return NextResponse.json({ error: 'Cette adresse e-mail est déjà utilisée.' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)
    const avatarChar = name.trim()[0]?.toUpperCase() || 'É'

    const insert = db.prepare(
      'INSERT INTO users (email, password, name, avatar_char) VALUES (?, ?, ?, ?)'
    )
    const result = insert.run(email.toLowerCase().trim(), hash, name.trim(), avatarChar)
    const userId = result.lastInsertRowid as number

    // Préférences par défaut
    db.prepare('INSERT INTO user_prefs (user_id) VALUES (?)').run(userId)

    // Tâches par défaut
    const insertTask = db.prepare(
      'INSERT INTO tasks (user_id, label, note, category) VALUES (?, ?, ?, ?)'
    )
    for (const t of DEFAULT_TASKS) {
      insertTask.run(userId, t.label, t.note, t.category)
    }

    // Connexion automatique
    const session = await getSession()
    session.userId = userId
    session.email  = email.toLowerCase().trim()
    session.name   = name.trim()
    await session.save()

    return NextResponse.json({ ok: true, userId, name: name.trim() })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
