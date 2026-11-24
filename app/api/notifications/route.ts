/**
 * app/api/notifications/route.ts
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserNotifications, markNotificationsRead, getUnreadCount } from '@/lib/notifications'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const notifications = getUserNotifications(user.id)
  const unread = getUnreadCount(user.id)

  return NextResponse.json({ notifications, unread })
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const body = await req.json()
  const { id, all } = body

  if (all) {
    markNotificationsRead(user.id)
  } else if (id) {
    markNotificationsRead(user.id, Number(id))
  }

  return NextResponse.json({ ok: true })
}
