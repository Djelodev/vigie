'use client'

/**
 * components/VigiaChat.tsx
 * Interface conversationnelle Vigi AI — intégrée dans le design system Vigie.
 *
 * Respecte la charte graphique Vigie et utilise les tokens CSS officiels.
 * Ne contient aucune clé IBM — tous les appels passent par /api/ai/chat.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, X, Plus, RotateCcw, ChevronDown, Sparkles, MessageSquare, Check, XCircle } from 'lucide-react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  pendingActions?: PendingAction[]
  isStreaming?: boolean
}

interface PendingAction {
  id: string
  type: string
  payload: Record<string, unknown>
  expiresAt: string
  description: string
}

interface VigiaContext {
  pageType?: string
  formationId?: string
  formationNom?: string
}

interface Props {
  /** Contexte de la page courante — permet à Vigi de comprendre le contexte */
  context?: VigiaContext
  /** Mode compact : bouton flottant uniquement */
  compact?: boolean
}

// ── Suggestions de démarrage ──────────────────────────────────────

const SUGGESTIONS = [
  'Aide-moi à trouver ma future formation',
  'Trouve-moi des formations en informatique près de chez moi',
  'Quelles sont mes prochaines échéances Parcoursup ?',
  'Compare mes formations favorites',
  'Qu\'est-ce qu\'il me reste à faire ?',
  'Trouve-moi des alternatives en alternance',
  'Fais-moi un bilan de mes choix',
]

// ── Composant principal ────────────────────────────────────────────

export function VigiaChat({ context, compact = false }: Props) {
  const [isOpen, setIsOpen]       = useState(!compact)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [convId, setConvId]       = useState<string | null>(null)

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLTextAreaElement>(null)

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus l'input quand on ouvre le chat
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
    }])
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setInput('')
    setError(null)

    // Ajouter le message utilisateur immédiatement
    addMessage({ role: 'user', content: trimmed })

    // Indicateur de chargement
    const loadingId = `loading_${Date.now()}`
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationId: convId,
          context,
        }),
      })

      const data = await res.json()

      // Retirer le message de chargement
      setMessages(prev => prev.filter(m => m.id !== loadingId))

      if (!res.ok) {
        const errMsg = getErrorMessage(data.error || res.status.toString())
        setError(errMsg)
        addMessage({ role: 'system', content: errMsg })
        return
      }

      if (data.conversationId) setConvId(data.conversationId)

      // Message de Vigi avec les actions en attente
      addMessage({
        role: 'assistant',
        content: data.reply || '',
        pendingActions: data.pendingActions,
      })

    } catch {
      setMessages(prev => prev.filter(m => m.id !== loadingId))
      const errMsg = 'Une erreur réseau s\'est produite. Vérifie ta connexion et réessaie.'
      setError(errMsg)
      addMessage({ role: 'system', content: errMsg })
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, convId, context, addMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleActionDecision = useCallback(async (
    actionId: string,
    decision: 'confirm' | 'cancel',
    messageId: string,
  ) => {
    try {
      const res = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, decision }),
      })

      const data = await res.json()

      // Retirer l'action de la liste
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m
        return {
          ...m,
          pendingActions: m.pendingActions?.filter(a => a.id !== actionId),
        }
      }))

      if (decision === 'confirm' && data.ok) {
        addMessage({
          role: 'system',
          content: '✅ Action réalisée avec succès.',
        })
      } else if (decision === 'cancel') {
        addMessage({
          role: 'system',
          content: '↩️ Action annulée.',
        })
      } else if (!data.ok) {
        addMessage({
          role: 'system',
          content: `❌ Erreur : ${data.error || 'Action impossible.'}`,
        })
      }
    } catch {
      addMessage({ role: 'system', content: '❌ Erreur réseau lors de la confirmation.' })
    }
  }, [addMessage])

  const startNewConversation = () => {
    setMessages([])
    setConvId(null)
    setError(null)
    inputRef.current?.focus()
  }

  // ── Version compacte (bouton flottant) ────────────────────────

  if (compact && !isOpen) {
    return (
      <button
        className="vigi-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir Vigi AI"
        title="Parle à Vigi AI"
      >
        <Bot size={22} />
        <span className="vigi-fab-label">Vigi AI</span>
      </button>
    )
  }

  // ── Interface complète ────────────────────────────────────────

  return (
    <div className={`vigi-chat${compact ? ' vigi-chat--overlay' : ''}`} role="complementary" aria-label="Vigi AI">
      {/* En-tête */}
      <div className="vigi-chat-header">
        <div className="vigi-chat-header-info">
          <div className="vigi-chat-avatar">
            <Bot size={18} />
          </div>
          <div>
            <div className="vigi-chat-name">Vigi AI</div>
            <div className="vigi-chat-status">
              <span className="vigi-status-dot" />
              Copilote d'orientation · IBM watsonx
            </div>
          </div>
        </div>
        <div className="vigi-chat-header-actions">
          {messages.length > 0 && (
            <button
              onClick={startNewConversation}
              className="vigi-icon-btn"
              title="Nouvelle conversation"
              aria-label="Nouvelle conversation"
            >
              <Plus size={16} />
            </button>
          )}
          {compact && (
            <button
              onClick={() => setIsOpen(false)}
              className="vigi-icon-btn"
              title="Fermer"
              aria-label="Fermer Vigi AI"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Zone de messages */}
      <div className="vigi-messages" aria-live="polite" aria-atomic="false">
        {messages.length === 0 ? (
          <VigiaWelcome context={context} onSuggest={sendMessage} />
        ) : (
          <>
            {messages.map(msg => (
              <VigiaMessage
                key={msg.id}
                message={msg}
                onActionDecision={handleActionDecision}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="vigi-input-area">
        {error && (
          <div className="vigi-error-banner" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Fermer l'erreur"><X size={12} /></button>
          </div>
        )}
        <div className="vigi-input-row">
          <textarea
            ref={inputRef}
            className="vigi-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question à Vigi…"
            rows={1}
            disabled={isLoading}
            aria-label="Message à Vigi AI"
            maxLength={2000}
          />
          <button
            className="vigi-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            aria-label="Envoyer"
          >
            {isLoading ? <span className="vigi-spinner" /> : <Send size={16} />}
          </button>
        </div>
        <div className="vigi-input-hint">
          Entrée pour envoyer · Maj+Entrée pour un saut de ligne
        </div>
      </div>

      {/* Disclaimer IBM */}
      <div className="vigi-disclaimer">
        Réponses générées par IBM watsonx Orchestrate · Vérifie toujours les informations officielles
      </div>
    </div>
  )
}

// ── Écran d'accueil avec suggestions ──────────────────────────────

function VigiaWelcome({ context, onSuggest }: {
  context?: VigiaContext
  onSuggest: (text: string) => void
}) {
  // Suggestions adaptées au contexte
  const contextSuggestions: string[] = context?.pageType === 'formation' && context.formationNom ? [
    `Explique-moi cette formation : ${context.formationNom}`,
    `Quelles sont les statistiques de cette formation ?`,
    `Trouve-moi des alternatives à cette formation`,
  ] : context?.pageType === 'comparer' ? [
    'Explique-moi les différences entre ces formations',
    'Quelle formation correspond le mieux à mes préférences ?',
  ] : context?.pageType === 'dashboard' ? [
    'Qu\'est-ce qu\'il me reste à faire ?',
    'Fais-moi un bilan de mes démarches',
    'Quelles sont mes prochaines échéances ?',
  ] : SUGGESTIONS

  return (
    <div className="vigi-welcome">
      <div className="vigi-welcome-avatar">
        <Bot size={32} />
      </div>
      <h3 className="vigi-welcome-title">Bonjour ! Je suis Vigi 👋</h3>
      <p className="vigi-welcome-desc">
        Ton copilote d'orientation. Je peux t'aider à explorer des formations,
        comprendre les statistiques, comparer des options et organiser tes démarches.
      </p>
      <div className="vigi-suggestions">
        {contextSuggestions.slice(0, 4).map((s, i) => (
          <button
            key={i}
            className="vigi-suggestion-btn"
            onClick={() => onSuggest(s)}
          >
            <MessageSquare size={13} />
            {s}
          </button>
        ))}
      </div>
      <p className="vigi-welcome-note">
        Les données proviennent des sources officielles Parcoursup 2025.
        Vigi ne remplace pas une décision humaine.
      </p>
    </div>
  )
}

// ── Composant de message ───────────────────────────────────────────

function VigiaMessage({
  message,
  onActionDecision,
}: {
  message: Message
  onActionDecision: (actionId: string, decision: 'confirm' | 'cancel', messageId: string) => void
}) {
  if (message.role === 'system') {
    return (
      <div className="vigi-msg vigi-msg--system">
        <span>{message.content}</span>
      </div>
    )
  }

  return (
    <div className={`vigi-msg vigi-msg--${message.role}`}>
      {message.role === 'assistant' && (
        <div className="vigi-msg-avatar" aria-hidden="true">
          <Bot size={14} />
        </div>
      )}
      <div className="vigi-msg-body">
        {message.isStreaming ? (
          <div className="vigi-typing" aria-label="Vigi réfléchit">
            <span /><span /><span />
          </div>
        ) : (
          <div
            className="vigi-msg-content"
            dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
          />
        )}

        {/* Cartes d'action en attente de confirmation */}
        {message.pendingActions?.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            onDecision={(decision) => onActionDecision(action.id, decision, message.id)}
          />
        ))}

        <time className="vigi-msg-time" dateTime={message.timestamp.toISOString()}>
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </div>
  )
}

// ── Carte de confirmation d'action ────────────────────────────────

function ActionCard({
  action,
  onDecision,
}: {
  action: PendingAction
  onDecision: (decision: 'confirm' | 'cancel') => void
}) {
  const [decided, setDecided] = useState(false)

  if (decided) return null

  const handleDecision = (d: 'confirm' | 'cancel') => {
    setDecided(true)
    onDecision(d)
  }

  return (
    <div className="vigi-action-card" role="region" aria-label="Action à confirmer">
      <div className="vigi-action-icon">
        <Sparkles size={14} />
      </div>
      <div className="vigi-action-body">
        <div className="vigi-action-title">Action proposée</div>
        <div className="vigi-action-desc">{action.description}</div>
        <div className="vigi-action-buttons">
          <button
            className="btn btn-primary vigi-action-btn"
            onClick={() => handleDecision('confirm')}
            aria-label={`Confirmer : ${action.description}`}
          >
            <Check size={13} /> Confirmer
          </button>
          <button
            className="btn btn-outline vigi-action-btn"
            onClick={() => handleDecision('cancel')}
            aria-label={`Annuler : ${action.description}`}
          >
            <XCircle size={13} /> Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function formatMessageContent(content: string): string {
  if (!content) return ''
  // Escape HTML pour prévenir les XSS
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  // Markdown basique : **gras**, *italique*, `code`, sauts de ligne
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'VIGI_AI_DISABLED':    'Vigi AI est temporairement désactivée. L\'application Vigie reste disponible.',
    'AUTH_ERROR':          'Erreur d\'authentification IBM. Vérifiez la configuration.',
    'TIMEOUT':             'La réponse a pris trop de temps. Réessaie dans un instant.',
    'NETWORK_ERROR':       'Erreur réseau. Vérifie ta connexion internet.',
    'WXO_NOT_CONFIGURED':  'Vigi AI n\'est pas encore configurée. Contacte l\'équipe Vigie.',
    '401':                 'Tu dois être connecté pour utiliser Vigi AI.',
    '503':                 'Service temporairement indisponible. L\'application Vigie reste disponible.',
  }
  return messages[code] || `Une erreur s'est produite (${code}). Réessaie plus tard.`
}
