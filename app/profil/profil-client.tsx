'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function ProfilClient() {
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
        <div className="card profil-panel">
          <div className="profil-avatar-row">
            <div className="profil-avatar">É</div>
            <div>
              <h3>Étudiant·e · profil fictif</h3>
              <p>Espace de démonstration</p>
            </div>
          </div>
          {[
            ['Situation',         'Lycéen·ne'],
            ['Centre d\'intérêt', 'Informatique'],
            ['Compte',            'Non connecté'],
          ].map(([label, value]) => (
            <div key={label} className="profil-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <p className="profil-note">
            Aucune donnée personnelle réelle n&apos;est collectée dans cette démo.
          </p>
          <Link href="/dashboard" className="btn btn-secondary" style={{ marginTop: 8 }}>
            Retour à l&apos;accueil <ArrowRight size={15} />
          </Link>
        </div>

        <div className="card profil-panel">
          <h2>Notifications</h2>
          {[
            ['Rappels importants', 'Échéances et préparation',  true ],
            ['Nouveautés',         'Formations et conseils',    true ],
            ['Newsletter',         'Résumé par e-mail (démo)',  false],
          ].map(([label, desc, checked]) => (
            <label key={label as string} className="pref-row">
              <input
                type="checkbox"
                defaultChecked={checked as boolean}
                aria-label={label as string}
              />
              <div>
                <strong>{label}</strong>
                <p>{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <footer className="page-footer">
        Vigie · Assistant indépendant d&apos;orientation. Données fictives.
      </footer>

      <style>{`
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
        .profil-note { font-size: 12px; color: var(--vigie-slate); margin: 16px 0 8px; }
        @media (max-width: 780px) {
          .profil-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
