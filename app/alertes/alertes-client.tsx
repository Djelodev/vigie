'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Calendar, Compass, Check, ArrowRight } from 'lucide-react'
import { useToast } from '@/components/Toast'

const NOTIFICATIONS = [
  {
    id: 1,
    icon: Calendar,
    color: 'orange',
    title: 'Prépare tes documents',
    desc: 'Pense à vérifier les pièces demandées dans chaque fiche officielle.',
    link: '/mes-choix',
  },
  {
    id: 2,
    icon: Compass,
    color: 'mint',
    title: 'Découvre de nouvelles options',
    desc: 'Explore les formations de démonstration en informatique.',
    link: '/explorer',
  },
]

const PREFERENCES = [
  { label: 'Rappels importants', desc: 'Échéances et préparation' },
  { label: 'Nouveautés',         desc: 'Formations et conseils' },
  { label: 'Newsletter',         desc: 'Résumé par e-mail (simulation)' },
]

export function AlertesClient() {
  const [read,  setRead]  = useState([false, false])
  const [prefs, setPrefs] = useState([true, true, false])
  const { toast } = useToast()

  const unreadCount = read.filter(x => !x).length

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Rester informé</div>
          <h1>Mes alertes</h1>
          <p>Retrouve les rappels et personnalise tes notifications.</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => { setRead([true, true]); toast('Toutes les alertes marquées comme lues.', 'success') }}
          aria-label="Tout marquer comme lu"
        >
          <Check size={15} /> Tout marquer comme lu
        </button>
      </div>

      <div className="alertes-grid">
        {/* Notifications */}
        <section className="card alertes-panel">
          <div className="dash-panel-head">
            <h2>Notifications</h2>
            <span className="badge badge-orange">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="alertes-list">
            {NOTIFICATIONS.map((n, i) => (
              <div key={n.id} className="alert-card">
                <div className={`tile-icon ${n.color}`}>
                  <n.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div className="alert-card-body">
                  <div className="alert-card-title">
                    <strong>{n.title}</strong>
                    {!read[i] && <span className="badge badge-orange" style={{ fontSize: 10, padding: '3px 8px' }}>Nouveau</span>}
                  </div>
                  <p>{n.desc}</p>
                  <Link
                    href={n.link}
                    className="btn btn-text"
                    onClick={() => {
                      const next = [...read]; next[i] = true; setRead(next)
                    }}
                  >
                    Voir <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Preferences */}
        <section className="card alertes-panel">
          <div className="dash-panel-head">
            <h2>Mes préférences</h2>
          </div>
          <p className="alertes-pref-note">Paramètres simulés, aucun envoi réel.</p>

          <div className="pref-list">
            {PREFERENCES.map((p, i) => (
              <label key={p.label} className="pref-row">
                <input
                    type="checkbox"
                    checked={prefs[i]}
                    onChange={() => {
                      const next = [...prefs]; next[i] = !next[i]; setPrefs(next)
                      toast('Préférence mise à jour.', 'success')
                    }}
                  aria-label={p.label}
                />
                <div>
                  <strong>{p.label}</strong>
                  <p>{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      <footer className="page-footer">
        Vigie · Données fictives. Aucune candidature n&apos;est déposée ici.
      </footer>

      <style>{`
        .alertes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .alertes-panel { padding: 24px; }
        .alertes-panel h2 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); }
        .alertes-list { display: flex; flex-direction: column; gap: 0; }
        .alert-card { display: flex; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px solid #f0f1f8; }
        .alert-card:last-child { border-bottom: 0; }
        .alert-card-body { flex: 1; min-width: 0; }
        .alert-card-title { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .alert-card-title strong { font-size: 14px; color: var(--vigie-ink); }
        .alert-card-body p { font-size: 13px; color: var(--vigie-slate); margin-bottom: 10px; }
        .alertes-pref-note { font-size: 12px; color: var(--vigie-slate); margin: 0 0 20px; }
        .pref-list { display: flex; flex-direction: column; gap: 0; }
        .pref-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 0; border-bottom: 1px solid #f0f1f8; cursor: pointer;
        }
        .pref-row:last-child { border-bottom: 0; }
        .pref-row input { width: 20px; height: 20px; accent-color: var(--vigie-blue); flex-shrink: 0; margin-top: 2px; cursor: pointer; }
        .pref-row strong { display: block; font-size: 14px; color: var(--vigie-ink); margin-bottom: 3px; }
        .pref-row p { font-size: 12px; color: var(--vigie-slate); margin: 0; }
        @media (max-width: 780px) {
          .alertes-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
