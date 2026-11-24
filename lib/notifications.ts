/**
 * lib/notifications.ts
 * Moteur de génération des notifications basé sur des événements réels.
 * ⚠️  MODULE SERVEUR UNIQUEMENT — ne jamais importer depuis un Client Component.
 */
import 'server-only'
import { db } from './db'

export interface NotificationPayload {
  userId: number
  type: 'deadline' | 'reminder' | 'task' | 'info' | 'formation'
  title: string
  body: string
  link?: string
}

/** Crée une notification en évitant les doublons (même titre dans les 24h). */
export function createNotification(payload: NotificationPayload): void {
  const existing = db.prepare(`
    SELECT id FROM notifications
    WHERE user_id = ? AND title = ? AND created_at > datetime('now', '-1 day')
  `).get(payload.userId, payload.title)

  if (existing) return // doublon

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (?, ?, ?, ?, ?)
  `).run(payload.userId, payload.type, payload.title, payload.body, payload.link ?? '')
}

/**
 * Traite tous les rappels en attente et génère les notifications correspondantes.
 * Appelé par le cron ou via /api/admin/process-reminders (commande de test).
 */
export function processReminders(): { processed: number } {
  const dueReminders = db.prepare(`
    SELECT r.*, u.id as uid
    FROM reminders r
    JOIN users u ON u.id = r.user_id
    WHERE r.done = 0
      AND r.due_date <= datetime('now', '+1 day', 'localtime')
  `).all() as Array<{
    id: number; user_id: number; label: string; note: string; due_date: string; uid: number
  }>

  let processed = 0
  for (const r of dueReminders) {
    createNotification({
      userId: r.user_id,
      type:   'reminder',
      title:  `Rappel : ${r.label}`,
      body:   r.note || `Échéance : ${new Date(r.due_date).toLocaleDateString('fr-FR')}`,
      link:   '/mes-choix',
    })
    processed++
  }

  // Vérification des tâches en retard
  const overdueTasks = db.prepare(`
    SELECT t.*, u.id as uid
    FROM tasks t
    JOIN users u ON u.id = t.user_id
    WHERE t.done = 0
      AND t.due_date IS NOT NULL
      AND t.due_date <= datetime('now', 'localtime')
  `).all() as Array<{ id: number; user_id: number; label: string; uid: number }>

  for (const t of overdueTasks) {
    createNotification({
      userId: t.user_id,
      type:   'task',
      title:  `Tâche en retard : ${t.label}`,
      body:   'Cette tâche dépasse son échéance.',
      link:   '/mes-choix',
    })
    processed++
  }

  return { processed }
}

/** Récupère les notifications non lues d'un utilisateur. */
export function getUnreadCount(userId: number): number {
  const row = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0').get(userId) as { c: number }
  return row.c
}

/** Récupère les notifications d'un utilisateur (les 50 dernières). */
export function getUserNotifications(userId: number) {
  return db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(userId)
}

/** Marque une ou toutes les notifications comme lues. */
export function markNotificationsRead(userId: number, id?: number): void {
  if (id) {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, userId)
  } else {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId)
  }
}

// Calendrier Parcoursup 2025 — dates officielles publiées
export const PARCOURSUP_CALENDAR_2025 = [
  {
    date: '2025-01-15',
    title: 'Ouverture du service aux lycéens',
    desc: 'La plateforme Parcoursup ouvre pour la consultation des formations.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
  {
    date: '2025-01-22',
    title: 'Début de la saisie des vœux',
    desc: 'Les lycéens peuvent commencer à formuler leurs vœux sur Parcoursup.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
  {
    date: '2025-03-13',
    title: 'Date limite de saisie des vœux',
    desc: 'Dernier jour pour saisir les vœux sur Parcoursup.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
  {
    date: '2025-04-10',
    title: 'Date limite de confirmation des vœux',
    desc: 'Dernier jour pour confirmer les vœux et finaliser le dossier.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
  {
    date: '2025-05-30',
    title: 'Début de la phase principale d\'admission',
    desc: 'Les premières réponses des formations sont envoyées.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
  {
    date: '2025-07-11',
    title: 'Fin de la phase principale',
    desc: 'Clôture de la phase principale d\'admission.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
  {
    date: '2025-07-11',
    title: 'Début de la phase complémentaire',
    desc: 'Possibilité de formuler de nouveaux vœux pour des formations avec places disponibles.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
  {
    date: '2025-09-12',
    title: 'Fermeture de Parcoursup',
    desc: 'La plateforme Parcoursup 2025 ferme définitivement.',
    official: true,
    link: 'https://www.parcoursup.gouv.fr',
  },
]

export const CALENDAR_NOTE = 'Dates indicatives de la campagne Parcoursup 2025. Vérifiez toujours les dates officielles sur parcoursup.gouv.fr'
