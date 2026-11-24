/**
 * lib/auth.ts
 * Authentification iron-session + bcryptjs.
 * Pas de JWT externe, tout reste en SQLite + cookie chiffré.
 * ⚠️  MODULE SERVEUR UNIQUEMENT.
 */
import 'server-only'
import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId?: number
  email?: string
  name?: string
}

export const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET || 'vigie-dev-secret-change-in-prod-32chars!!',
  cookieName: 'vigie_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS)
}

export async function getCurrentUser(): Promise<{ id: number; email: string; name: string } | null> {
  const session = await getSession()
  if (!session.userId) return null
  
  try {
    const { db } = await import('./db')
    const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(session.userId) as
      { id: number; email: string; name: string } | undefined
    return user ?? null
  } catch {
    return null
  }
}
