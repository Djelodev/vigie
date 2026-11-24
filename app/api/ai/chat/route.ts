/**
 * app/api/ai/chat/route.ts
 * Point d'entrée principal de Vigi AI.
 *
 * Ce route handler est le SEUL endroit où les secrets IBM sont utilisés.
 * L'interface frontend ne voit jamais WXO_API_KEY.
 *
 * Architecture du flux :
 *   Browser → POST /api/ai/chat → lib/watsonx.ts → IBM WXO → retour JSON
 *
 * Résolution du problème localhost → cloud :
 *   watsonx Orchestrate (cloud) ne peut pas appeler localhost:3000.
 *   Solution retenue : les outils de l'agent sont exécutés LOCALEMENT
 *   dans ce route handler grâce au mécanisme de "tool execution" :
 *     1. WXO répond avec un appel d'outil structuré
 *     2. Ce handler exécute l'outil localement (accès à la BDD locale)
 *     3. Le résultat est renvoyé à WXO pour continuer la conversation
 *
 *   Cette approche est compatible avec l'architecture "tool execution" de l'ADK.
 *   Elle ne nécessite pas d'exposer localhost publiquement.
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isWatsonxConfigured, sendChatTurn, type ChatMessage } from '@/lib/watsonx'
import { executeTool } from '@/lib/ai-tools'
import { db } from '@/lib/db'
import crypto from 'crypto'

const MAX_MESSAGES = 20       // Limite historique par conversation
const MAX_TOOL_ROUNDS = 5     // Limite des tours d'appels d'outils

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  // Feature flag
  if (!isWatsonxConfigured()) {
    return NextResponse.json({ error: 'VIGI_AI_DISABLED' }, { status: 503 })
  }

  let body: {
    message?: string
    conversationId?: string
    context?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 })
  }

  const { message, conversationId, context } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'message requis.' }, { status: 400 })
  }

  // Sanitisation du message (longueur max)
  const safeMessage = message.trim().slice(0, 2000)

  // Identifiant de corrélation pour l'observabilité
  const correlationId = crypto.randomUUID()

  // Récupérer l'historique de la conversation (si existante)
  let messages: ChatMessage[] = []
  let wxoConvId: string | null = null

  if (conversationId) {
    const conv = db.prepare(
      'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?'
    ).get(conversationId, user.id) as {
      id: string; wxo_conv_id: string | null
    } | undefined

    if (conv) {
      wxoConvId = conv.wxo_conv_id
      // Récupérer l'historique des messages (limité)
      const history = db.prepare(`
        SELECT role, content FROM ai_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT ?
      `).all(conversationId, MAX_MESSAGES) as { role: string; content: string }[]

      messages = history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }))
    }
  }

  // Ajouter le contexte de la page si fourni (enrichissement non sensible)
  let enrichedMessage = safeMessage
  if (context?.pageType) {
    const ctxStr = buildContextString(context)
    if (ctxStr) enrichedMessage = `[Contexte: ${ctxStr}]\n\n${safeMessage}`
  }

  // Ajouter le nouveau message utilisateur
  messages.push({ role: 'user', content: enrichedMessage })

  // Boucle d'exécution des outils (tool execution loop)
  let currentWxoConvId = wxoConvId
  let finalReply = ''
  let pendingActions: unknown[] = []
  let allToolCalls: unknown[] = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await sendChatTurn(messages, currentWxoConvId, user.id, correlationId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error, correlationId },
        { status: result.error === 'AUTH_ERROR' ? 401 : 503 }
      )
    }

    currentWxoConvId = result.conversationId
    if (result.toolCalls) allToolCalls.push(...result.toolCalls)

    // Vérifier si l'agent demande des appels d'outils
    const pendingToolCalls = (result as { pendingToolCalls?: Array<{id: string; name: string; arguments: Record<string, unknown>}> }).pendingToolCalls
    if (!pendingToolCalls || pendingToolCalls.length === 0) {
      finalReply = result.reply
      break
    }

    // Exécuter chaque outil localement
    for (const toolCall of pendingToolCalls) {
      const toolResult = await executeTool(
        toolCall.name,
        toolCall.arguments,
        user.id,
        correlationId,
      )

      // Les actions proposées (write operations) ne s'exécutent pas directement
      if (toolResult.pendingAction) {
        pendingActions.push(toolResult.pendingAction)
      }

      // Ajouter le résultat de l'outil à l'historique
      messages.push({
        role: 'tool',
        content: JSON.stringify(toolResult.data),
        toolCallId: toolCall.id,
        toolName: toolCall.name,
      })
    }
  }

  // Sauvegarder/créer la conversation
  let activeConvId = conversationId
  if (!activeConvId) {
    activeConvId = crypto.randomUUID()
    db.prepare(`
      INSERT INTO ai_conversations (id, user_id, wxo_conv_id, title)
      VALUES (?, ?, ?, ?)
    `).run(activeConvId, user.id, currentWxoConvId || null, safeMessage.slice(0, 60))
  } else if (currentWxoConvId && currentWxoConvId !== wxoConvId) {
    db.prepare(`
      UPDATE ai_conversations SET wxo_conv_id = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(currentWxoConvId, activeConvId, user.id)
  }

  // Sauvegarder les messages (si la table existe — créée par la migration db.ts)
  try {
    db.prepare(`
      INSERT INTO ai_messages (conversation_id, role, content)
      VALUES (?, 'user', ?)
    `).run(activeConvId, safeMessage)

    if (finalReply) {
      db.prepare(`
        INSERT INTO ai_messages (conversation_id, role, content)
        VALUES (?, 'assistant', ?)
      `).run(activeConvId, finalReply)
    }
  } catch {
    // La table ai_messages peut ne pas exister encore — non bloquant
  }

  return NextResponse.json({
    reply: finalReply,
    conversationId: activeConvId,
    pendingActions,
    toolCalls: allToolCalls,
    correlationId,
  })
}

/** Construit une chaîne de contexte non-sensible à partir du contexte de page */
function buildContextString(context: Record<string, unknown>): string {
  const parts: string[] = []
  if (context.pageType) parts.push(`page=${context.pageType}`)
  if (context.formationId) parts.push(`formation=${context.formationId}`)
  if (context.formationNom) parts.push(`formation_nom=${String(context.formationNom).slice(0, 100)}`)
  return parts.join(', ')
}
