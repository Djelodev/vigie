/**
 * lib/ai-tools.ts
 * Outils métier exécutés localement pour le compte de l'agent Vigi AI.
 *
 * Architecture : ces fonctions sont appelées par /api/ai/chat/route.ts
 * dans la boucle de tool execution. Elles ont accès à la BDD locale
 * et aux API Parcoursup, ce que l'instance WXO cloud ne peut pas faire.
 *
 * Chaque outil :
 * - Valide ses entrées
 * - Vérifie les autorisations (userId)
 * - Limite les volumes de données retournées
 * - Gère les erreurs
 * - Ne retourne jamais de données d'un autre utilisateur
 *
 * ⚠️  MODULE SERVEUR UNIQUEMENT.
 */
import 'server-only'
import { db } from './db'
import { fetchFormations, fetchFormationById } from './parcoursup'
import { createPendingAction } from './ai-actions'
import type { ActionType, ActionPayload } from './watsonx'

// Calendrier Parcoursup 2025 (données officielles)
const PARCOURSUP_DEADLINES_2025 = [
  { label: 'Ouverture de la plateforme Parcoursup',       date: '2025-01-14', type: 'ouverture' },
  { label: 'Fin de saisie des vœux',                      date: '2025-03-13', type: 'voeux' },
  { label: 'Fin de finalisation des dossiers',            date: '2025-04-03', type: 'dossiers' },
  { label: 'Début des réponses des formations',           date: '2025-06-02', type: 'reponses' },
  { label: 'Fin de la phase principale',                  date: '2025-07-11', type: 'phase_principale' },
  { label: 'Ouverture de la phase complémentaire',        date: '2025-06-23', type: 'phase_complementaire' },
  { label: 'Fermeture de la plateforme Parcoursup 2025',  date: '2025-09-19', type: 'fermeture' },
]

export interface ToolResult {
  data: unknown
  pendingAction?: {
    id: string
    type: ActionType
    payload: ActionPayload
    expiresAt: string
    description: string
  }
  error?: string
}

/**
 * Dispatche l'appel d'outil vers la bonne fonction.
 * Valide le nom de l'outil et les autorisations.
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: number,
  correlationId: string,
): Promise<ToolResult> {
  console.info(`[Vigi AI Tools][${correlationId}] tool=${toolName} userId=${userId}`)

  try {
    switch (toolName) {
      case 'search_formations':        return await searchFormations(args)
      case 'get_formation_details':    return await getFormationDetails(args)
      case 'get_formation_statistics': return await getFormationStatistics(args)
      case 'compare_formations':       return await compareFormations(args)
      case 'get_alternative_formations': return await getAlternativeFormations(args)
      case 'get_official_deadlines':   return getOfficialDeadlines()
      case 'get_user_preferences':     return getUserPreferences(userId)
      case 'get_user_favorites':       return getUserFavorites(userId)
      case 'get_user_progress':        return getUserProgress(userId)
      case 'get_user_reminders':       return getUserReminders(userId)
      case 'propose_add_favorite':     return proposeAddFavorite(args, userId, correlationId)
      case 'propose_create_reminder':  return proposeCreateReminder(args, userId, correlationId)
      case 'propose_create_task':      return proposeCreateTask(args, userId, correlationId)
      case 'propose_update_choice_status': return proposeUpdateChoiceStatus(args, userId, correlationId)
      default:
        return { data: null, error: `Outil inconnu : ${toolName}` }
    }
  } catch (err) {
    console.error(`[Vigi AI Tools][${correlationId}] tool=${toolName} error:`, (err as Error).message)
    return { data: null, error: (err as Error).message }
  }
}

// ── Outils de recherche et d'analyse ──────────────────────────────

async function searchFormations(args: Record<string, unknown>): Promise<ToolResult> {
  const q           = sanitizeString(args.q)
  const filiere     = sanitizeString(args.filiere)
  const region      = sanitizeString(args.region)
  const ville       = sanitizeString(args.ville)
  const departement = sanitizeString(args.departement)
  const statut      = sanitizeEnum(args.statut, ['public', 'prive', '']) as 'public' | 'prive' | ''
  const selectivite = sanitizeEnum(args.selectivite, ['selective', 'non_selective', '']) as 'selective' | 'non_selective' | ''
  const limit       = Math.min(Number(args.limit) || 10, 20)

  if (!q && !filiere && !region && !ville && !departement) {
    return { data: null, error: 'Au moins un critère de recherche est requis.' }
  }

  const result = await fetchFormations({ q, filiere, region, ville, departement, statut, selectivite, limit })

  return {
    data: {
      total: result.total,
      fromCache: result.fromCache,
      formations: result.formations.map(f => ({
        id: f.id,
        nom: f.nom,
        etablissement: f.etablissement,
        filiere: f.filiere,
        ville: f.ville,
        region: f.region,
        statut: f.statut,
        selectivite: f.selectivite,
        capacite: f.capacite,
        tauxAcces: f.tauxAcces,
        lienParcoursup: f.lienParcoursup,
        session: f.session,
        sourceLabel: f.sourceLabel,
      })),
      source: result.fromCache
        ? 'Cache local Vigie'
        : 'Ministère de l\'Enseignement supérieur et de la Recherche — Session 2025',
    },
  }
}

async function getFormationDetails(args: Record<string, unknown>): Promise<ToolResult> {
  const id = sanitizeId(args.id)
  if (!id) return { data: null, error: 'id requis.' }

  const formation = await fetchFormationById(id)
  if (!formation) {
    return { data: { found: false, id }, error: `Aucune formation trouvée pour l'identifiant : ${id}` }
  }

  return { data: { found: true, formation, source: formation.sourceLabel } }
}

async function getFormationStatistics(args: Record<string, unknown>): Promise<ToolResult> {
  const id = sanitizeId(args.id)
  if (!id) return { data: null, error: 'id requis.' }

  const formation = await fetchFormationById(id)
  if (!formation) {
    return { data: { found: false }, error: `Formation introuvable : ${id}` }
  }

  return {
    data: {
      found: true,
      id: formation.id,
      nom: formation.nom,
      session: formation.session,
      statistiques: {
        capacite:    { valeur: formation.capacite,    unite: 'places', definition: 'Nombre de places disponibles' },
        voeux:       { valeur: formation.voeux,       unite: 'candidatures', definition: 'Total des vœux reçus' },
        admis:       { valeur: formation.admis,       unite: 'étudiants', definition: 'Nombre total d\'admis' },
        propositions:{ valeur: formation.propositions,unite: 'propositions', definition: 'Propositions d\'admission formulées' },
        tauxAcces:   { valeur: formation.tauxAcces,   unite: '%', definition: 'Taux d\'accès officiel : ratio admis/vœux. Ce n\'est pas une garantie individuelle d\'admission.' },
        pctFemmes:   { valeur: formation.pctFemmes,   unite: '%', definition: 'Pourcentage de femmes parmi les admis' },
        pctBacGen:   { valeur: formation.pctBacGen,   unite: '%', definition: 'Pourcentage de bacheliers généraux parmi les admis' },
        pctBacTech:  { valeur: formation.pctBacTech,  unite: '%', definition: 'Pourcentage de bacheliers technologiques parmi les admis' },
        pctBacPro:   { valeur: formation.pctBacPro,   unite: '%', definition: 'Pourcentage de bacheliers professionnels parmi les admis' },
      },
      avertissement: 'Ces statistiques sont historiques (session ' + formation.session + '). Elles ne constituent pas une prédiction individuelle d\'admission.',
      source: formation.sourceLabel,
    },
  }
}

async function compareFormations(args: Record<string, unknown>): Promise<ToolResult> {
  const ids = Array.isArray(args.ids) ? args.ids.slice(0, 4) : []
  if (ids.length < 2) return { data: null, error: 'Au moins 2 identifiants requis pour comparer.' }

  const formations = await Promise.all(
    ids.map((id: unknown) => fetchFormationById(sanitizeId(id)))
  )

  const found = formations.filter(Boolean)
  if (found.length < 2) return { data: null, error: 'Pas assez de formations trouvées pour comparer.' }

  return {
    data: {
      count: found.length,
      formations: found.map(f => f!),
      criteres: ['filiere', 'statut', 'selectivite', 'capacite', 'tauxAcces', 'region', 'ville'],
      source: 'Ministère de l\'Enseignement supérieur et de la Recherche — Session 2025',
      avertissement: 'Comparaison sur données historiques. Les taux d\'accès varient chaque année.',
    },
  }
}

async function getAlternativeFormations(args: Record<string, unknown>): Promise<ToolResult> {
  const filiere  = sanitizeString(args.filiere)
  const region   = sanitizeString(args.region)
  const q        = sanitizeString(args.q)
  const limit    = Math.min(Number(args.limit) || 8, 20)

  if (!filiere && !region && !q) {
    return { data: null, error: 'Au moins un critère est requis pour trouver des alternatives.' }
  }

  const result = await fetchFormations({ filiere, region, q, limit })

  return {
    data: {
      alternatives: result.formations,
      total: result.total,
      criteres: { filiere, region, q },
      source: 'Ministère de l\'Enseignement supérieur et de la Recherche — Session 2025',
    },
  }
}

function getOfficialDeadlines(): ToolResult {
  const now = new Date()
  const upcoming = PARCOURSUP_DEADLINES_2025
    .map(d => ({ ...d, passed: new Date(d.date) < now }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    data: {
      session: '2025',
      echeances: upcoming,
      source: 'Calendrier officiel Parcoursup 2025 — parcoursup.gouv.fr',
      avertissement: 'Vérifiez toujours les dates officielles sur parcoursup.gouv.fr',
    },
  }
}

// ── Outils utilisateur (lecture authentifiée) ─────────────────────

function getUserPreferences(userId: number): ToolResult {
  const prefs = db.prepare(
    'SELECT niveau, type_bac, interets, domaines, regions, mobilite, budget, alternance FROM user_prefs WHERE user_id = ?'
  ).get(userId) as Record<string, unknown> | undefined

  if (!prefs) return { data: { hasPreferences: false } }

  return {
    data: {
      hasPreferences: true,
      preferences: {
        niveau:     prefs.niveau,
        typeBac:    prefs.type_bac,
        interets:   tryParseJSON(prefs.interets as string, []),
        domaines:   tryParseJSON(prefs.domaines as string, []),
        regions:    tryParseJSON(prefs.regions as string, []),
        mobilite:   prefs.mobilite,
        budget:     prefs.budget,
        alternance: Boolean(prefs.alternance),
      },
    },
  }
}

function getUserFavorites(userId: number): ToolResult {
  const favorites = db.prepare(`
    SELECT cod_aff, status, notes, priority, list_name, created_at
    FROM favorites WHERE user_id = ?
    ORDER BY priority DESC, created_at DESC
    LIMIT 20
  `).all(userId) as Array<{ cod_aff: string; status: string; notes: string; priority: number; list_name: string }>

  return {
    data: {
      count: favorites.length,
      favorites: favorites.map(f => ({
        codAff: f.cod_aff,
        status: f.status,
        notes: f.notes,
        priority: f.priority,
        listName: f.list_name,
      })),
    },
  }
}

function getUserProgress(userId: number): ToolResult {
  const tasks = db.prepare(`
    SELECT id, label, done, due_date, category
    FROM tasks WHERE user_id = ?
    ORDER BY done ASC, due_date ASC
    LIMIT 20
  `).all(userId) as Array<{ id: number; label: string; done: number; due_date: string; category: string }>

  const done = tasks.filter(t => t.done).length
  const total = tasks.length

  return {
    data: {
      progression: total > 0 ? Math.round((done / total) * 100) : 0,
      taches: tasks.map(t => ({
        id: t.id,
        label: t.label,
        done: Boolean(t.done),
        dueDate: t.due_date,
        category: t.category,
      })),
      resume: `${done}/${total} tâches complétées`,
    },
  }
}

function getUserReminders(userId: number): ToolResult {
  const reminders = db.prepare(`
    SELECT id, label, note, due_date, done
    FROM reminders WHERE user_id = ? AND done = 0
    ORDER BY due_date ASC
    LIMIT 10
  `).all(userId) as Array<{ id: number; label: string; note: string; due_date: string; done: number }>

  return {
    data: {
      count: reminders.length,
      rappels: reminders.map(r => ({
        id: r.id,
        label: r.label,
        note: r.note,
        dueDate: r.due_date,
      })),
    },
  }
}

// ── Outils de proposition (write operations) ──────────────────────

function proposeAddFavorite(args: Record<string, unknown>, userId: number, correlationId: string): ToolResult {
  const codAff = sanitizeId(args.codAff)
  const formationNom = sanitizeString(args.formationNom)
  if (!codAff) return { data: null, error: 'codAff requis.' }

  // Vérifier si déjà en favori
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND cod_aff = ?').get(userId, codAff)
  if (existing) {
    return { data: { alreadyExists: true, codAff, message: 'Cette formation est déjà dans tes favoris.' } }
  }

  const payload: ActionPayload = { codAff, formationNom }
  const actionId = createPendingAction(userId, 'add_favorite', payload, correlationId)
  const expiresAt = new Date(Date.now() + 300_000).toISOString()

  return {
    data: {
      proposed: true,
      actionId,
      message: `Veux-tu ajouter "${formationNom || codAff}" à tes favoris ?`,
    },
    pendingAction: {
      id: actionId,
      type: 'add_favorite',
      payload,
      expiresAt,
      description: `Ajouter "${formationNom || codAff}" aux favoris`,
    },
  }
}

function proposeCreateReminder(args: Record<string, unknown>, userId: number, correlationId: string): ToolResult {
  const label   = sanitizeString(args.label)
  const note    = sanitizeString(args.note)
  const dueDate = sanitizeDate(args.dueDate)
  if (!label)   return { data: null, error: 'label requis.' }
  if (!dueDate) return { data: null, error: 'dueDate requis (format ISO 8601).' }

  const payload: ActionPayload = { label, note, dueDate }
  const actionId = createPendingAction(userId, 'create_reminder', payload, correlationId)
  const expiresAt = new Date(Date.now() + 300_000).toISOString()

  return {
    data: { proposed: true, actionId, label, dueDate },
    pendingAction: {
      id: actionId,
      type: 'create_reminder',
      payload,
      expiresAt,
      description: `Créer un rappel : "${label}" le ${dueDate}`,
    },
  }
}

function proposeCreateTask(args: Record<string, unknown>, userId: number, correlationId: string): ToolResult {
  const label    = sanitizeString(args.label)
  const note     = sanitizeString(args.note)
  const dueDate  = sanitizeDate(args.dueDate)
  const category = sanitizeEnum(args.category, ['general', 'orientation', 'parcoursup', 'admin', 'autre']) || 'general'
  if (!label) return { data: null, error: 'label requis.' }

  const payload: ActionPayload = { label, note, dueDate: dueDate || undefined, category }
  const actionId = createPendingAction(userId, 'create_task', payload, correlationId)
  const expiresAt = new Date(Date.now() + 300_000).toISOString()

  return {
    data: { proposed: true, actionId, label },
    pendingAction: {
      id: actionId,
      type: 'create_task',
      payload,
      expiresAt,
      description: `Créer une tâche : "${label}"`,
    },
  }
}

function proposeUpdateChoiceStatus(args: Record<string, unknown>, userId: number, correlationId: string): ToolResult {
  const codAff = sanitizeId(args.codAff)
  const status = sanitizeEnum(args.status, ['a_decouvrir', 'en_reflexion', 'favori', 'candidature_soumise', 'accepte', 'refuse'])
  if (!codAff) return { data: null, error: 'codAff requis.' }
  if (!status) return { data: null, error: `status invalide. Valeurs : a_decouvrir, en_reflexion, favori, candidature_soumise, accepte, refuse` }

  const payload: ActionPayload = { codAff, status }
  const actionId = createPendingAction(userId, 'update_choice_status', payload, correlationId)
  const expiresAt = new Date(Date.now() + 300_000).toISOString()

  return {
    data: { proposed: true, actionId },
    pendingAction: {
      id: actionId,
      type: 'update_choice_status',
      payload,
      expiresAt,
      description: `Mettre à jour le statut de ${codAff} → ${status}`,
    },
  }
}

// ── Helpers de validation ──────────────────────────────────────────

function sanitizeString(val: unknown): string {
  return typeof val === 'string' ? val.trim().slice(0, 200) : ''
}

function sanitizeId(val: unknown): string {
  if (typeof val !== 'string') return ''
  return val.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 50)
}

function sanitizeDate(val: unknown): string | null {
  if (typeof val !== 'string') return null
  // Accepte ISO 8601 (YYYY-MM-DD ou datetime)
  if (/^\d{4}-\d{2}-\d{2}(T[\d:Z.+-]+)?$/.test(val)) return val
  return null
}

function sanitizeEnum(val: unknown, allowed: string[]): string {
  if (typeof val !== 'string') return ''
  return allowed.includes(val) ? val : ''
}

function tryParseJSON(str: string, fallback: unknown): unknown {
  try { return JSON.parse(str) } catch { return fallback }
}
