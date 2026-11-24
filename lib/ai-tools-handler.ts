/**
 * lib/ai-tools-handler.ts
 * Handler commun pour les routes /api/ai/tools/*.
 *
 * Ces routes sont appelées directement par watsonx Orchestrate via la
 * connexion OpenAPI configurée dans l'instance.
 *
 * Authentification : via le header Authorization Bearer (token de session
 * interne) ou via le cookie iron-session selon la méthode de connexion WXO.
 *
 * ⚠️  MODULE SERVEUR UNIQUEMENT.
 */
import 'server-only'
import { NextResponse } from 'next/server'
import { getCurrentUser } from './auth'
import { executeTool } from './ai-tools'
import crypto from 'crypto'

/**
 * Exécute un outil et retourne la réponse HTTP.
 * Gère l'authentification et génère un correlationId.
 */
export async function handleToolRequest(
  toolName: string,
  args: Record<string, unknown>,
  req: Request,
): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  // Vérifier que l'outil est dans la liste autorisée
  const ALLOWED_TOOLS = new Set([
    'search_formations', 'get_formation_details', 'get_formation_statistics',
    'compare_formations', 'get_alternative_formations', 'get_official_deadlines',
    'get_user_preferences', 'get_user_favorites', 'get_user_progress',
    'get_user_reminders', 'propose_add_favorite', 'propose_create_reminder',
    'propose_create_task', 'propose_update_choice_status',
  ])

  if (!ALLOWED_TOOLS.has(toolName)) {
    return NextResponse.json({ error: `Outil non autorisé : ${toolName}` }, { status: 403 })
  }

  const correlationId = (req.headers.get('X-Correlation-ID') || crypto.randomUUID())

  const result = await executeTool(toolName, args, user.id, correlationId)

  if (result.error && !result.data) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    ...result.data as object,
    // Les PendingActions sont retournées pour affichage côté client
    ...(result.pendingAction ? { pendingAction: result.pendingAction } : {}),
  })
}

/** Extrait les query params dans un objet pour les GET */
export function extractQueryArgs(url: string): Record<string, unknown> {
  const { searchParams } = new URL(url)
  const args: Record<string, unknown> = {}
  searchParams.forEach((v, k) => { args[k] = v })
  return args
}
