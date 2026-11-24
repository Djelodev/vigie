'use client'

/**
 * components/VigiaWidget.tsx
 * Widget flottant Vigi AI — bulle en bas à droite, style assistant web.
 * S'ouvre en popup over le contenu. Toujours visible, responsive.
 * Importé dans AppShell → présent sur toutes les pages.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, X, Plus, Sparkles, MessageSquare, Check, XCircle, ChevronDown } from 'lucide-react'

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

// ── Suggestions de démarrage ──────────────────────────────────────

const SUGGESTIONS = [
  'Aide-moi à trouver ma future formation',
  'Formations en informatique près de chez moi',
  'Prochaines échéances Parcoursup ?',
  'Compare mes formations favorites',
  'Qu\'est-ce qu\'il me reste à faire ?',
  'Alternatives en alternance',
]

// ── Composant widget ──────────────────────────────────────────────

export function VigiaWidget() {
  const [isOpen, setIsOpen]       = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [convId, setConvId]       = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  // Scroll auto vers le bas
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  // Focus l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Fermer avec Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) setIsOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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

    addMessage({ role: 'user', content: trimmed })

    const loadingId = `loading_${Date.now()}`
    setMessages(prev => [...prev, {
      id: loadingId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true,
    }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, conversationId: convId }),
      })
      const data = await res.json()

      setMessages(prev => prev.filter(m => m.id !== loadingId))

      if (!res.ok) {
        const errMsg = getErrorMessage(data.error || res.status.toString())
        setError(errMsg)
        addMessage({ role: 'system', content: errMsg })
        if (!isOpen) setHasUnread(true)
        return
      }

      if (data.conversationId) setConvId(data.conversationId)

      addMessage({
        role: 'assistant',
        content: data.reply || '',
        pendingActions: data.pendingActions,
      })

      if (!isOpen) setHasUnread(true)

    } catch {
      setMessages(prev => prev.filter(m => m.id !== loadingId))
      const errMsg = 'Erreur réseau. Réessaie dans un instant.'
      setError(errMsg)
      addMessage({ role: 'system', content: errMsg })
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, convId, addMessage, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const handleActionDecision = useCallback(async (
    actionId: string, decision: 'confirm' | 'cancel', messageId: string,
  ) => {
    try {
      const res = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, decision }),
      })
      const data = await res.json()

      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m
        return { ...m, pendingActions: m.pendingActions?.filter(a => a.id !== actionId) }
      }))

      addMessage({
        role: 'system',
        content: decision === 'confirm' && data.ok
          ? '✅ Action réalisée avec succès.'
          : decision === 'cancel'
            ? '↩️ Action annulée.'
            : `❌ ${data.error || 'Action impossible.'}`,
      })
    } catch {
      addMessage({ role: 'system', content: '❌ Erreur réseau lors de la confirmation.' })
    }
  }, [addMessage])

  const startNew = () => {
    setMessages([])
    setConvId(null)
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* ── Popup de chat ─────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Overlay sombre sur mobile */}
          <div
            className="widget-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className="widget-panel"
            role="dialog"
            aria-label="Vigi AI — Copilote d'orientation"
            aria-modal="true"
          >
            {/* En-tête */}
            <div className="widget-header">
              <div className="widget-header-info">
                <div className="widget-avatar">
                  <Bot size={16} aria-hidden="true" />
                </div>
                <div>
                  <div className="widget-name">Vigi AI</div>
                  <div className="widget-subtitle">Copilote d'orientation · IBM watsonx</div>
                </div>
              </div>
              <div className="widget-header-btns">
                {messages.length > 0 && (
                  <button onClick={startNew} className="widget-icon-btn" title="Nouvelle conversation">
                    <Plus size={15} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="widget-icon-btn" aria-label="Fermer Vigi AI">
                  <ChevronDown size={17} />
                </button>
              </div>
            </div>

            {/* Zone de messages */}
            <div className="widget-messages" aria-live="polite">
              {messages.length === 0
                ? <WidgetWelcome onSuggest={sendMessage} />
                : messages.map(msg => (
                    <WidgetMessage
                      key={msg.id}
                      message={msg}
                      onActionDecision={handleActionDecision}
                    />
                  ))
              }
              <div ref={messagesEndRef} />
            </div>

            {/* Saisie */}
            <div className="widget-input-area">
              {error && (
                <div className="widget-error" role="alert">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} aria-label="Fermer"><X size={11} /></button>
                </div>
              )}
              <div className="widget-input-row">
                <textarea
                  ref={inputRef}
                  className="widget-input"
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
                  className="widget-send"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  aria-label="Envoyer"
                >
                  {isLoading ? <span className="widget-spinner" /> : <Send size={15} />}
                </button>
              </div>
              <p className="widget-hint">Entrée pour envoyer · Maj+Entrée pour un saut de ligne</p>
            </div>

            <div className="widget-disclaimer">
              Données Parcoursup 2025 · IBM watsonx Orchestrate
            </div>
          </div>
        </>
      )}

      {/* ── Bouton flottant ───────────────────────────────────── */}
      <button
        className={`widget-bubble${isOpen ? ' widget-bubble--open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Fermer Vigi AI' : 'Ouvrir Vigi AI'}
        aria-expanded={isOpen}
      >
        {isOpen
          ? <X size={22} />
          : (
            <>
              <Bot size={22} />
              {hasUnread && <span className="widget-bubble-dot" aria-hidden="true" />}
            </>
          )
        }
        {!isOpen && <span className="widget-bubble-label">Vigi AI</span>}
      </button>
    </>
  )
}

// ── Écran de bienvenue ────────────────────────────────────────────

function WidgetWelcome({ onSuggest }: { onSuggest: (t: string) => void }) {
  return (
    <div className="widget-welcome">
      <div className="widget-welcome-avatar"><Bot size={28} /></div>
      <p className="widget-welcome-title">Bonjour ! Je suis Vigi 👋</p>
      <p className="widget-welcome-desc">
        Ton copilote d'orientation. Je peux t'aider à explorer des formations,
        comprendre les statistiques et organiser tes démarches.
      </p>
      <div className="widget-suggestions">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} className="widget-suggestion" onClick={() => onSuggest(s)}>
            <MessageSquare size={12} />
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Message ────────────────────────────────────────────────────────

function WidgetMessage({
  message,
  onActionDecision,
}: {
  message: Message
  onActionDecision: (id: string, d: 'confirm' | 'cancel', msgId: string) => void
}) {
  if (message.role === 'system') {
    return (
      <div className="widget-msg widget-msg--system">
        <span>{message.content}</span>
      </div>
    )
  }

  return (
    <div className={`widget-msg widget-msg--${message.role}`}>
      {message.role === 'assistant' && (
        <div className="widget-msg-avatar" aria-hidden="true"><Bot size={13} /></div>
      )}
      <div className="widget-msg-body">
        {message.isStreaming
          ? <div className="widget-typing" aria-label="Vigi réfléchit"><span /><span /><span /></div>
          : <div
              className="widget-msg-content"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
        }
        {message.pendingActions?.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            onDecision={d => onActionDecision(action.id, d, message.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Carte de confirmation ─────────────────────────────────────────

function ActionCard({ action, onDecision }: {
  action: PendingAction
  onDecision: (d: 'confirm' | 'cancel') => void
}) {
  const [decided, setDecided] = useState(false)
  if (decided) return null

  return (
    <div className="widget-action-card">
      <div className="widget-action-icon"><Sparkles size={13} /></div>
      <div>
        <div className="widget-action-label">Action proposée</div>
        <div className="widget-action-desc">{action.description}</div>
        <div className="widget-action-btns">
          <button
            className="widget-action-confirm"
            onClick={() => { setDecided(true); onDecision('confirm') }}
          >
            <Check size={12} /> Confirmer
          </button>
          <button
            className="widget-action-cancel"
            onClick={() => { setDecided(true); onDecision('cancel') }}
          >
            <XCircle size={12} /> Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function formatContent(content: string): string {
  if (!content) return ''
  return content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

function getErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'VIGI_AI_DISABLED':   'Vigi AI est temporairement désactivée.',
    'AUTH_ERROR':         'Erreur d\'authentification IBM.',
    'TIMEOUT':            'La réponse a pris trop de temps. Réessaie.',
    'NETWORK_ERROR':      'Erreur réseau. Vérifie ta connexion.',
    'WXO_NOT_CONFIGURED': 'Vigi AI n\'est pas encore configurée.',
    '401':                'Tu dois être connecté pour utiliser Vigi AI.',
    '503':                'Service temporairement indisponible.',
  }
  return map[code] || `Une erreur s'est produite. Réessaie plus tard.`
}
