/**
 * lib/ai-actions.ts
 * Gestion des actions en attente de confirmation utilisateur.
 * Les actions proposées par Vigi AI sont stockées en base, avec expiration,
 * pour éviter toute double exécution et garantir que l'utilisateur confirme
 * explicitement chaque écriture.
 *
 * ⚠️  MODULE SERVEUR UNIQUEMENT.
 */
import 'server-only'
import { db } from './db'
import type { ActionType, ActionPayload } from './watsonx'

const ACTION_TTL_SECONDS = 300 // 5 minutes

/** Crée une action en attente de confirmation */
export function createPendingAction(
  userId: number,
  type: ActionType,
  payload: ActionPayload,
  correlationId: string,
): string {
  const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const expiresAt = new Date(Date.now() + ACTION_TTL_SECONDS * 1000).toISOString()

  db.prepare(`
    INSERT INTO ai_pending_actions
      (id, user_id, type, payload, correlation_id, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, userId, type, JSON.stringify(payload), correlationId, expiresAt)

  return id
}

/** Récupère une action et vérifie qu'elle appartient bien à l'utilisateur */
export function getPendingAction(actionId: string, userId: number) {
  const row = db.prepare(
    `SELECT * FROM ai_pending_actions WHERE id = ? AND user_id = ? AND status = 'pending'`
  ).get(actionId, userId) as {
    id: string
    user_id: number
    type: ActionType
    payload: string
    correlation_id: string
    expires_at: string
    status: string
  } | undefined

  if (!row) return null

  // Vérification expiration
  if (new Date(row.expires_at) < new Date()) {
    db.prepare(`UPDATE ai_pending_actions SET status = 'expired' WHERE id = ?`).run(actionId)
    return null
  }

  return {
    ...row,
    payload: JSON.parse(row.payload) as ActionPayload,
  }
}

/** Marque une action comme exécutée (prévient la double exécution) */
export function markActionExecuted(actionId: string): boolean {
  const result = db.prepare(`
    UPDATE ai_pending_actions
    SET status = 'executed', executed_at = datetime('now')
    WHERE id = ? AND status = 'pending'
  `).run(actionId)
  return result.changes > 0
}

/** Marque une action comme annulée */
export function markActionCancelled(actionId: string, userId: number): boolean {
  const result = db.prepare(`
    UPDATE ai_pending_actions
    SET status = 'cancelled'
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `).run(actionId, userId)
  return result.changes > 0
}

/** Exécute réellement l'action après confirmation utilisateur */
export async function executeConfirmedAction(
  actionId: string,
  userId: number,
): Promise<{ ok: boolean; error?: string; data?: unknown }> {
  const action = getPendingAction(actionId, userId)
  if (!action) return { ok: false, error: 'ACTION_NOT_FOUND_OR_EXPIRED' }

  // Marquer comme exécutée en premier (protection double exécution)
  const claimed = markActionExecuted(actionId)
  if (!claimed) return { ok: false, error: 'ALREADY_EXECUTED' }

  try {
    switch (action.type) {
      case 'add_favorite': {
        const { codAff } = action.payload
        if (!codAff) throw new Error('codAff manquant')

        // Vérifier que la formation existe (appel API Parcoursup)
        const { fetchFormationById } = await import('./parcoursup')
        const formation = await fetchFormationById(codAff)
        if (!formation) throw new Error(`Formation introuvable : ${codAff}`)

        db.prepare(`
          INSERT INTO favorites (user_id, cod_aff, notes, list_name)
          VALUES (?, ?, '', 'principale')
          ON CONFLICT(user_id, cod_aff) DO NOTHING
        `).run(userId, codAff)

        // Notification de confirmation
        db.prepare(`
          INSERT INTO notifications (user_id, type, title, body, link)
          VALUES (?, 'info', 'Formation ajoutée aux favoris', ?, ?)
        `).run(userId, `${formation.nom} a été ajoutée à tes favoris.`, `/explorer/${codAff}`)

        return { ok: true, data: { codAff, nom: formation.nom } }
      }

      case 'create_reminder': {
        const { label, note, dueDate } = action.payload
        if (!label) throw new Error('label manquant')

        const result = db.prepare(`
          INSERT INTO reminders (user_id, label, note, due_date)
          VALUES (?, ?, ?, ?)
        `).run(userId, label, note || '', dueDate || null)

        return { ok: true, data: { id: result.lastInsertRowid } }
      }

      case 'create_task': {
        const { label, note, dueDate, category } = action.payload
        if (!label) throw new Error('label manquant')

        const result = db.prepare(`
          INSERT INTO tasks (user_id, label, note, due_date, category)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, label, note || '', dueDate || null, category || 'general')

        return { ok: true, data: { id: result.lastInsertRowid } }
      }

      case 'update_choice_status': {
        const { codAff, status } = action.payload
        if (!codAff || !status) throw new Error('codAff ou status manquant')

        const VALID_STATUSES = ['a_decouvrir', 'en_reflexion', 'favori', 'candidature_soumise', 'accepte', 'refuse']
        if (!VALID_STATUSES.includes(status)) throw new Error(`Statut invalide : ${status}`)

        db.prepare(`
          UPDATE favorites SET status = ?, updated_at = datetime('now')
          WHERE user_id = ? AND cod_aff = ?
        `).run(status, userId, codAff)

        return { ok: true, data: { codAff, status } }
      }

      case 'save_comparison': {
        const { formations } = action.payload
        if (!formations?.length) throw new Error('formations manquantes')
        // La comparaison est stockée en session dans le comparateur existant
        return { ok: true, data: { formations } }
      }

      default:
        throw new Error(`Type d'action inconnu : ${action.type}`)
    }
  } catch (err) {
    // Remettre le statut à 'pending' pour permettre une nouvelle tentative ?
    // Non : on marque comme 'failed' pour éviter les doublons accidentels
    db.prepare(`UPDATE ai_pending_actions SET status = 'failed', error = ? WHERE id = ?`)
      .run((err as Error).message, actionId)

    console.error(`[Vigi AI] executeConfirmedAction failed:`, (err as Error).message)
    return { ok: false, error: (err as Error).message }
  }
}
