/**
 * lib/watsonx.ts
 * Client IBM watsonx Orchestrate — appels côté serveur uniquement.
 * Toutes les clés IBM restent exclusivement sur le serveur.
 *
 * Instance réelle confirmée :
 *   URL : https://api.ap-south-1.dl.watson-orchestrate.ibm.com/instances/20261124-2142-4212-4003-285293d59b0c
 *   Auth : mcsp (--type mcsp forcé, car mcsp_v2 est le défaut inféré)
 *   URL d'auth MCSP v2 (identique dans les deux cas) :
 *     https://account-iam.platform.saas.ibm.com/api/2.0/apikeys/token
 *   Modèle disponible : groq/openai/gpt-oss-120b (défaut ✔★)
 *
 * API réelle WXO (vérifiée dans ibm-watsonx-orchestrate-adk v2.19.1) :
 *
 *   Auth (MCSP v2) :
 *     POST https://account-iam.platform.saas.ibm.com/api/2.0/apikeys/token
 *     body: { apikey: "...", grant_type: "urn:ibm:params:oauth:grant-type:apikey" }
 *     → { access_token, token_type, expires_in }
 *
 *   Envoyer un message :
 *     POST {INSTANCE_URL}/v1/orchestrate/runs
 *     body: { message: { role: "user", content: "..." }, agent_id: "...", thread_id?: "..." }
 *     → { thread_id, run_id, task_id, message_id }
 *
 *   Attendre la réponse :
 *     GET {INSTANCE_URL}/v1/orchestrate/runs/{run_id}
 *     → { status: "completed"|"failed"|..., thread_id }
 *
 *   Lire la réponse :
 *     GET {INSTANCE_URL}/v1/orchestrate/threads/{thread_id}/messages
 *     → { data: [{ role: "assistant", content: "..." }, ...] }
 *
 * ⚠️  MODULE SERVEUR UNIQUEMENT.
 */
import 'server-only'

export interface WatsonxConfig {
  instanceUrl: string
  apiKey: string
  agentId: string
  enabled: boolean
}

export function getWatsonxConfig(): WatsonxConfig {
  return {
    instanceUrl: (process.env.WXO_INSTANCE_URL || '').replace(/\/$/, ''),
    apiKey:      process.env.WXO_API_KEY      || '',
    agentId:     process.env.WXO_AGENT_ID     || 'vigi_ai',
    enabled:     process.env.WXO_ENABLED      === 'true',
  }
}

export function isWatsonxConfigured(): boolean {
  const cfg = getWatsonxConfig()
  return cfg.enabled && !!cfg.instanceUrl && !!cfg.apiKey
}

/** Message d'une conversation */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCallId?: string
  toolName?: string
}

/** Résultat d'un tour de conversation */
export interface ChatTurnResult {
  reply: string
  conversationId: string   // thread_id dans WXO
  actions?: PendingAction[]
  toolCalls?: ToolCallRecord[]
  error?: string
  durationMs: number
}

/** Action en attente de confirmation utilisateur */
export interface PendingAction {
  id: string            // UUID unique généré côté serveur
  type: ActionType
  userId: number        // Défini par la session serveur, jamais par le modèle
  payload: ActionPayload
  expiresAt: string     // ISO 8601
  status: 'pending_confirmation'
}

export type ActionType =
  | 'add_favorite'
  | 'create_reminder'
  | 'create_task'
  | 'update_choice_status'
  | 'save_comparison'

export interface ActionPayload {
  codAff?: string
  formationNom?: string
  label?: string
  note?: string
  dueDate?: string
  category?: string
  status?: string
  priority?: number
  formations?: string[]
}

/** Enregistrement d'un appel d'outil pour l'observabilité */
export interface ToolCallRecord {
  tool: string
  success: boolean
  durationMs: number
  timestamp: string
}

// ── Cache token MCSP (durée de vie ~1h) ──────────────────────────

interface TokenCache {
  token: string
  expiresAt: number  // timestamp ms
}

let _tokenCache: TokenCache | null = null

/**
 * Génère un Bearer Token via l'endpoint MCSP v2 de IBM SaaS AWS.
 *
 * URL confirmée par l'ADK v2.19.1 au runtime :
 *   WARNING: Using 'mcsp_v2' Auth Type
 *   Invoking scopeless MCSP v2 token service:
 *   https://account-iam.platform.saas.ibm.com/api/2.0/apikeys/token
 *
 * Cache : 55 minutes (le token expire à 60 min côté IBM).
 */
export async function getMCSPToken(apiKey: string): Promise<string> {
  const now = Date.now()

  // Utiliser le cache si valide
  if (_tokenCache && _tokenCache.expiresAt > now + 60_000) {
    return _tokenCache.token
  }

  // Format confirmé : POST { apikey } uniquement — grant_type non supporté
  const res = await fetch(
    'https://account-iam.platform.saas.ibm.com/api/2.0/apikeys/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: apiKey }),
      signal: AbortSignal.timeout(10000),
    }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`MCSP v2 token error ${res.status}: ${body.slice(0, 300)}`)
  }

  const json = await res.json()
  // La réponse MCSP v2 retourne "token" (pas "access_token")
  const token = (json.token || json.access_token) as string
  if (!token) throw new Error('MCSP v2 response missing token')

  const expiresIn = (json.expires_in || 3600) * 1000
  _tokenCache = { token, expiresAt: now + expiresIn }

  return token
}

/**
 * Envoie un message à l'agent WXO et attend la réponse.
 *
 * Flux : POST /runs → polling GET /runs/{id} → GET /threads/{id}/messages
 *
 * L'historique des messages est géré par WXO via le thread_id.
 * Le tool calling est géré par l'agent lui-même (outils OpenAPI Vigie).
 */
export async function sendChatTurn(
  messages: ChatMessage[],
  conversationId: string | null,
  userId: number,
  correlationId: string,
): Promise<ChatTurnResult> {
  const cfg = getWatsonxConfig()
  const start = Date.now()

  if (!isWatsonxConfigured()) {
    return { reply: '', conversationId: conversationId || '', error: 'WXO_NOT_CONFIGURED', durationMs: 0 }
  }

  // Récupérer uniquement le dernier message utilisateur
  // (l'historique est géré par WXO via thread_id)
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMsg) {
    return { reply: '', conversationId: conversationId || '', error: 'NO_USER_MESSAGE', durationMs: 0 }
  }

  let token: string
  try {
    token = await getMCSPToken(cfg.apiKey)
  } catch (err) {
    console.error(`[Vigi AI][${correlationId}] MCSP auth error:`, (err as Error).message)
    return { reply: '', conversationId: conversationId || '', error: 'AUTH_ERROR', durationMs: Date.now() - start }
  }

  // L'ADK ajoute /v1/orchestrate pour les instances non-localhost
  // Source : BaseWXOClient.__init__ dans ibm_watsonx_orchestrate_clients
  const baseUrl = `${cfg.instanceUrl}/v1/orchestrate`
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId,
  }

  // ── Étape 1 : Créer le run ───────────────────────────────────────
  const runPayload: Record<string, unknown> = {
    message: {
      role: 'user',
      content: lastUserMsg.content,
    },
    agent_id: cfg.agentId,
  }

  if (conversationId) {
    runPayload.thread_id = conversationId
  }

  let runData: { thread_id: string; run_id: string; task_id?: string }
  try {
    const runRes = await fetch(`${baseUrl}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(runPayload),
      signal: AbortSignal.timeout(15000),
    })

    if (!runRes.ok) {
      const body = await runRes.text().catch(() => '')
      console.error(`[Vigi AI][${correlationId}] POST /runs error ${runRes.status}:`, body.slice(0, 400))
      return { reply: '', conversationId: conversationId || '', error: `WXO_HTTP_${runRes.status}`, durationMs: Date.now() - start }
    }

    runData = await runRes.json()
  } catch (err) {
    const isTimeout = (err as Error).name === 'TimeoutError'
    console.error(`[Vigi AI][${correlationId}] POST /runs fetch error:`, (err as Error).message)
    return { reply: '', conversationId: conversationId || '', error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR', durationMs: Date.now() - start }
  }

  const threadId = runData.thread_id
  const runId    = runData.run_id

  console.info(`[Vigi AI][${correlationId}] run created — runId=${runId} threadId=${threadId}`)

  // ── Étape 2 : Polling GET /runs/{runId} ──────────────────────────
  // Les runs avec tool calling prennent plus de temps (l'agent appelle les outils Python)
  const MAX_POLLS = 60         // 60 × 2s = 120s max
  const POLL_INTERVAL_MS = 2000
  let finalStatus = ''

  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL_MS)

    try {
      const statusRes = await fetch(`${baseUrl}/runs/${runId}`, {
        headers,
        signal: AbortSignal.timeout(8000),
      })

      if (!statusRes.ok) {
        console.warn(`[Vigi AI][${correlationId}] GET /runs/${runId} error ${statusRes.status}`)
        continue
      }

      const statusData = await statusRes.json()
      finalStatus = (statusData.status || '').toLowerCase()

      if (finalStatus === 'completed' || finalStatus === 'failed' || finalStatus === 'cancelled') {
        console.info(`[Vigi AI][${correlationId}] run ${finalStatus} in ${Date.now() - start}ms`)
        break
      }
    } catch (err) {
      console.warn(`[Vigi AI][${correlationId}] polling error:`, (err as Error).message)
    }
  }

  if (finalStatus !== 'completed') {
    return {
      reply: '',
      conversationId: threadId || conversationId || '',
      error: finalStatus === 'failed' ? 'WXO_RUN_FAILED' : 'TIMEOUT',
      durationMs: Date.now() - start,
    }
  }

  // ── Étape 3 : Lire les messages du thread ──────────────────────
  let reply = ''
  try {
    const msgsRes = await fetch(`${baseUrl}/threads/${threadId}/messages`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    if (msgsRes.ok) {
      const msgsData = await msgsRes.json()
      const msgs: Array<{ role: string; content: unknown }> = msgsData.data || msgsData || []

      // Prendre le dernier message assistant
      const assistantMsgs = msgs.filter(m => m.role === 'assistant')
      const lastAssistant = assistantMsgs[assistantMsgs.length - 1]

      if (lastAssistant) {
        const content = lastAssistant.content
        if (typeof content === 'string') {
          reply = content
        } else if (Array.isArray(content)) {
          // Format WXO réel : [{ response_type: "text", text: "..." }]
          // Format alternatif : [{ type: "text", text: "..." }]
          reply = content
            .filter((c: unknown) => {
              const item = c as { type?: string; response_type?: string }
              return item.type === 'text' || item.response_type === 'text'
            })
            .map((c: unknown) => (c as { text?: string }).text || '')
            .join('\n')
            .trim()
        }
      }
    }
  } catch (err) {
    console.error(`[Vigi AI][${correlationId}] GET /threads messages error:`, (err as Error).message)
  }

  return {
    reply,
    conversationId: threadId || conversationId || '',
    durationMs: Date.now() - start,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
