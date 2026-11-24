'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useToast } from '@/components/Toast'

type Mode = 'login' | 'register'

export function AuthClient({ defaultMode = 'login' }: { defaultMode?: Mode }) {
  const [mode,     setMode]     = useState<Mode>(defaultMode)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { email, password, name }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error || 'Une erreur est survenue.', 'error')
        return
      }

      toast(mode === 'login' ? `Bienvenue, ${data.name} !` : `Compte créé ! Bienvenue, ${data.name} !`, 'success')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast('Impossible de joindre le serveur.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-brand">
          <img src="/brand/svg/vigie-compact-normal.svg" alt="Vigie" width="120" />
        </div>

        <div className="auth-toggle">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Se connecter
          </button>
          <button
            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Créer un compte
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <label className="auth-field">
              <span>Prénom ou pseudo</span>
              <div className="auth-input-wrap">
                <User size={16} aria-hidden="true" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex"
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="given-name"
                />
              </div>
            </label>
          )}

          <label className="auth-field">
            <span>Adresse e-mail</span>
            <div className="auth-input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="toi@exemple.fr"
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Mot de passe {mode === 'register' ? '(8 caractères min.)' : ''}</span>
            <div className="auth-input-wrap">
              <Lock size={16} aria-hidden="true" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="auth-note">
          Tu peux aussi{' '}
          <Link href="/explorer" className="btn-text">
            explorer sans compte
          </Link>
          . Tes favoris et préférences seront sauvegardés uniquement si tu es connecté·e.
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: var(--vigie-bg);
          padding: 32px 20px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .auth-brand { display: flex; justify-content: center; }
        .auth-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1.5px solid #e4e5ef;
          border-radius: var(--radius-button);
          overflow: hidden;
        }
        .auth-tab {
          padding: 10px;
          font-size: 14px;
          font-weight: 600;
          color: var(--vigie-slate);
          background: transparent;
          border: 0;
          cursor: pointer;
          transition: all var(--motion-fast);
        }
        .auth-tab.active {
          background: var(--vigie-lavender);
          color: var(--vigie-blue);
        }
        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .auth-field { display: flex; flex-direction: column; gap: 6px; }
        .auth-field > span { font-size: 13px; font-weight: 600; color: var(--vigie-ink); }
        .auth-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          height: 46px;
          background: var(--vigie-white);
          border: 1.5px solid #e4e5ef;
          border-radius: var(--radius-button);
          color: var(--vigie-slate);
        }
        .auth-input-wrap:focus-within {
          border-color: var(--vigie-electric);
          box-shadow: 0 0 0 3px rgb(36 36 245 / 10%);
        }
        .auth-input-wrap input {
          flex: 1; border: 0; outline: 0; background: transparent;
          font-size: 14px; color: var(--vigie-ink);
        }
        .auth-input-wrap input::placeholder { color: #a0a8b8; }
        .auth-eye {
          background: none; border: 0; color: var(--vigie-slate);
          cursor: pointer; display: flex; align-items: center;
        }
        .auth-note {
          font-size: 12px;
          color: var(--vigie-slate);
          text-align: center;
          line-height: 1.6;
        }
      `}</style>
    </div>
  )
}
