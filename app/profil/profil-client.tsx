'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, User, Mail, Edit3, Save, Trash2, Info, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useCurrentUser } from '@/lib/hooks'

export function ProfilClient() {
  const { user, isLoggedIn, isLoading, mutate } = useCurrentUser()
  const { toast } = useToast()

  const [editing,  setEditing]  = useState(false)
  const [name,     setName]     = useState('')
  const [niveau,   setNiveau]   = useState('')
  const [typeBac,  setTypeBac]  = useState('')
  const [mobilite, setMobilite] = useState('')
  const [alternance, setAlternance] = useState(false)
  const [saving,   setSaving]   = useState(false)

  const [email,    setEmail]    = useState('')
  const [subStatus, setSubStatus] = useState<null | 'subscribed' | 'pending'>('pending')

  function startEdit() {
    if (!user) return
    setName(user.name)
    setNiveau(user.prefs?.niveau || '')
    setTypeBac(user.prefs?.type_bac || '')
    setMobilite(user.prefs?.mobilite || '')
    setAlternance(!!user.prefs?.alternance)
    setEditing(true)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, niveau, typeBac, mobilite, alternance }),
      })
      if (!res.ok) throw new Error()
      await mutate()
      setEditing(false)
      toast('Profil mis à jour !', 'success')
    } catch {
      toast('Impossible de sauvegarder.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteAccount() {
    if (!confirm('Supprimer définitivement ton compte ? Cette action est irréversible.')) return
    const res = await fetch('/api/profile', { method: 'DELETE' })
    if (res.ok) {
      toast('Compte supprimé.', 'success')
      window.location.href = '/'
    } else {
      toast('Impossible de supprimer le compte.', 'error')
    }
  }

  async function subscribeNewsletter(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setSubStatus('subscribed')
      toast(data.message || 'Abonnement enregistré !', 'success')
    } else {
      toast(data.error || 'Erreur.', 'error')
    }
  }

  if (isLoading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 32, color: 'var(--vigie-slate)' }}>
      <Loader2 size={22} className="spin" />
      <span>Chargement…</span>
    </div>
  )

  if (!isLoggedIn) return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Mon compte</div>
          <h1>Mon profil</h1>
        </div>
      </div>
      <div className="card profil-panel" style={{ maxWidth: 480, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <User size={40} style={{ color: 'var(--vigie-blue)', marginBottom: 12 }} />
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Pas encore de compte</h2>
          <p style={{ color: 'var(--vigie-slate)', fontSize: 14 }}>Crée un compte gratuit pour sauvegarder tes formations et personnaliser ton expérience.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/auth/register" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            Créer un compte <ArrowRight size={15} />
          </Link>
          <Link href="/auth/login" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )

  const p = user!

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Mon compte</div>
          <h1>Mon profil</h1>
          <p>Gère tes préférences et personnalise ton espace.</p>
        </div>
      </div>

      <div className="profil-grid">
        {/* Carte profil */}
        <div className="card profil-panel">
          {!editing ? (
            <>
              <div className="profil-avatar-row">
                <div className="profil-avatar">{p.avatarChar}</div>
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.email}</p>
                </div>
              </div>
              {[
                ['Niveau',                 p.prefs?.niveau || 'Non renseigné'],
                ['Type de bac',            p.prefs?.type_bac || 'Non renseigné'],
                ['Mobilité',               p.prefs?.mobilite || 'Non renseigné'],
                ['Alternance',             p.prefs?.alternance ? 'Oui, intéressé·e' : 'Non renseigné'],
                ['Membre depuis',          new Date(/* safe fallback */ '2025-01-01').getFullYear()],
              ].map(([label, value]) => (
                <div key={label as string} className="profil-row">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={startEdit}>
                  <Edit3 size={15} /> Modifier
                </button>
                <button className="btn btn-outline" style={{ color: 'var(--vigie-coral)', borderColor: 'var(--vigie-coral)' }} onClick={deleteAccount}>
                  <Trash2 size={15} /> Supprimer le compte
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={saveProfile} className="profil-edit-form">
              <h3 style={{ marginBottom: 20 }}>Modifier mon profil</h3>

              <label className="profil-field">
                <span>Prénom / Pseudo</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
              </label>

              <label className="profil-field">
                <span>Situation actuelle</span>
                <select value={niveau} onChange={e => setNiveau(e.target.value)}>
                  <option value="">— Non renseigné —</option>
                  <option value="lycee_premiere">Lycéen·ne (Première)</option>
                  <option value="lycee_terminale">Lycéen·ne (Terminale)</option>
                  <option value="bachelier_recent">Bachelier·ère récent·e</option>
                  <option value="etudiant_reorientation">Étudiant·e en réorientation</option>
                  <option value="autre">Autre</option>
                </select>
              </label>

              <label className="profil-field">
                <span>Type de baccalauréat</span>
                <select value={typeBac} onChange={e => setTypeBac(e.target.value)}>
                  <option value="">— Non renseigné —</option>
                  <option value="general">Bac général</option>
                  <option value="technologique">Bac technologique</option>
                  <option value="professionnel">Bac professionnel</option>
                </select>
              </label>

              <label className="profil-field">
                <span>Mobilité géographique</span>
                <select value={mobilite} onChange={e => setMobilite(e.target.value)}>
                  <option value="">— Non renseigné —</option>
                  <option value="locale">Locale (même ville / département)</option>
                  <option value="regionale">Régionale</option>
                  <option value="nationale">Nationale</option>
                  <option value="internationale">Internationale</option>
                </select>
              </label>

              <label className="profil-check">
                <input type="checkbox" checked={alternance} onChange={e => setAlternance(e.target.checked)} />
                <span>Je suis intéressé·e par l'alternance</span>
              </label>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
                  Annuler
                </button>
              </div>
            </form>
          )}
          <p className="profil-note">
            <Info size={12} /> Tes données sont stockées localement et ne sont pas partagées avec des tiers.
          </p>
        </div>

        {/* Notifications + Newsletter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card profil-panel">
            <h2>Notifications</h2>
            {[
              { label: 'Rappels importants', desc: 'Échéances Parcoursup et rappels personnels', key: 'rappels' },
              { label: 'Nouveautés formations', desc: 'Formations correspondant à tes préférences', key: 'nouveautes' },
            ].map(item => (
              <label key={item.key} className="pref-row">
                <input type="checkbox" defaultChecked={true} aria-label={item.label} />
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Newsletter */}
          <div className="card profil-panel" style={{ marginTop: 16 }}>
            <h2>Newsletter Vigie</h2>
            <p style={{ fontSize: 13, color: 'var(--vigie-slate)', marginBottom: 16, lineHeight: 1.6 }}>
              Reçois un résumé personnalisé : prochaines échéances, formations recommandées et actualités Parcoursup.
            </p>
            {subStatus === 'subscribed' ? (
              <div className="profil-sub-success">
                <span>✅ Abonnement enregistré !</span>
                <p style={{ fontSize: 12, color: 'var(--vigie-slate)', marginTop: 6 }}>
                  Vérifie ta boîte mail pour confirmer ton abonnement.
                </p>
                <button
                  className="btn btn-text"
                  style={{ fontSize: 12, marginTop: 8 }}
                  onClick={async () => {
                    await fetch('/api/newsletter', { method: 'DELETE' })
                    setSubStatus(null)
                    toast('Désabonnement effectué.', 'success')
                  }}
                >
                  Se désabonner
                </button>
              </div>
            ) : (
              <form onSubmit={subscribeNewsletter} className="profil-newsletter-form">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={p.email}
                  className="mc-task-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">
                  S&apos;abonner
                </button>
              </form>
            )}
            <p className="profil-note" style={{ marginTop: 10 }}>
              Aucun envoi réel sans configuration SMTP. Voir <code>.env.example</code>.
            </p>
          </div>
        </div>
      </div>

      <footer className="page-footer">
        Vigie · Assistant indépendant d&apos;orientation. Données officielles Parcoursup.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .profil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .profil-panel { padding: 24px; }
        .profil-panel h2 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 20px; }
        .profil-avatar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .profil-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--vigie-lavender); border: 2px solid var(--vigie-electric);
          display: grid; place-items: center;
          font-size: 20px; font-weight: 700; color: var(--vigie-blue);
          flex-shrink: 0;
        }
        .profil-avatar-row h3 { font-size: 16px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .profil-avatar-row p { font-size: 12px; color: var(--vigie-slate); margin: 0; }
        .profil-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 13px 0; border-bottom: 1px solid #f0f1f8; font-size: 14px;
          color: var(--vigie-slate);
        }
        .profil-row strong { color: var(--vigie-ink); font-weight: 700; }
        .profil-note { font-size: 11px; color: var(--vigie-slate); margin: 16px 0 0; display: flex; align-items: center; gap: 5px; }
        .profil-edit-form { display: flex; flex-direction: column; gap: 14px; }
        .profil-field { display: flex; flex-direction: column; gap: 6px; }
        .profil-field > span { font-size: 13px; font-weight: 600; color: var(--vigie-ink); }
        .profil-field input, .profil-field select {
          height: 44px; padding: 0 12px;
          border: 1.5px solid #e4e5ef; border-radius: var(--radius-button);
          font-size: 14px; background: var(--vigie-white); color: var(--vigie-ink); outline: none;
        }
        .profil-field input:focus, .profil-field select:focus { border-color: var(--vigie-electric); }
        .profil-check { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--vigie-ink); cursor: pointer; }
        .profil-check input { width: 18px; height: 18px; accent-color: var(--vigie-blue); }
        .pref-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 0; border-bottom: 1px solid #f0f1f8; cursor: pointer;
        }
        .pref-row:last-child { border-bottom: 0; }
        .pref-row input { width: 20px; height: 20px; accent-color: var(--vigie-blue); flex-shrink: 0; margin-top: 2px; cursor: pointer; }
        .pref-row strong { display: block; font-size: 14px; color: var(--vigie-ink); margin-bottom: 3px; }
        .pref-row p { font-size: 12px; color: var(--vigie-slate); margin: 0; }
        .profil-newsletter-form { display: flex; gap: 8px; align-items: center; }
        .mc-task-input {
          height: 44px; padding: 0 12px; min-width: 0;
          border: 1.5px solid #e4e5ef; border-radius: var(--radius-button);
          font-size: 14px; background: var(--vigie-white); outline: none;
        }
        .mc-task-input:focus { border-color: var(--vigie-electric); }
        .profil-sub-success { padding: 14px; background: #e0faf4; border-radius: 12px; }
        @media (max-width: 780px) {
          .profil-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
