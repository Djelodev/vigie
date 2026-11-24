/**
 * app/api/auth/me/route.ts
 * Retourne les infos de l'utilisateur connecté.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null })

  const prefs = db.prepare('SELECT * FROM user_prefs WHERE user_id = ?').get(user.id) as Record<string, unknown> | undefined
  const avatarRow = db.prepare('SELECT avatar_char FROM users WHERE id = ?').get(user.id) as { avatar_char: string } | undefined

  return NextResponse.json({
    user: {
      ...user,
      avatarChar: avatarRow?.avatar_char || user.name[0]?.toUpperCase() || 'É',
      prefs: prefs ? {
        ...prefs,
        interets: JSON.parse((prefs.interets as string) || '[]'),
        domaines: JSON.parse((prefs.domaines as string) || '[]'),
        regions:  JSON.parse((prefs.regions  as string) || '[]'),
      } : null,
    }
  })
}
