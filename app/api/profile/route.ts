/**
 * app/api/profile/route.ts
 * Mise à jour du profil et des préférences utilisateur.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { name, niveau, typeBac, interets, domaines, regions, mobilite, budget, alternance } = body

  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: 'Nom invalide.' }, { status: 400 })
    db.prepare("UPDATE users SET name = ?, avatar_char = ?, updated_at = datetime('now') WHERE id = ?")
      .run(name.trim(), name.trim()[0]?.toUpperCase() || 'É', user.id)
  }

  // Mise à jour préférences
  const prefUpdates: string[] = ["updated_at = datetime('now')"]
  const prefValues: (string | number)[] = []

  if (niveau     !== undefined) { prefUpdates.push('niveau = ?');     prefValues.push(niveau)                }
  if (typeBac    !== undefined) { prefUpdates.push('type_bac = ?');   prefValues.push(typeBac)               }
  if (interets   !== undefined) { prefUpdates.push('interets = ?');   prefValues.push(JSON.stringify(interets))   }
  if (domaines   !== undefined) { prefUpdates.push('domaines = ?');   prefValues.push(JSON.stringify(domaines))   }
  if (regions    !== undefined) { prefUpdates.push('regions = ?');    prefValues.push(JSON.stringify(regions))    }
  if (mobilite   !== undefined) { prefUpdates.push('mobilite = ?');   prefValues.push(mobilite)              }
  if (budget     !== undefined) { prefUpdates.push('budget = ?');     prefValues.push(budget)                }
  if (alternance !== undefined) { prefUpdates.push('alternance = ?'); prefValues.push(alternance ? 1 : 0)   }

  if (prefValues.length > 0) {
    db.prepare(
      `INSERT INTO user_prefs (user_id) VALUES (?) ON CONFLICT(user_id) DO NOTHING`
    ).run(user.id)
    db.prepare(
      `UPDATE user_prefs SET ${prefUpdates.join(', ')} WHERE user_id = ?`
    ).run(...prefValues, user.id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  // Suppression en cascade (FK ON DELETE CASCADE)
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id)

  const { getSession } = await import('@/lib/auth')
  const session = await getSession()
  session.destroy()

  return NextResponse.json({ ok: true, message: 'Compte supprimé.' })
}
