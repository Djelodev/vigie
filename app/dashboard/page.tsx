'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Heart, BarChart2, Bell, Check, Sparkles, Info,
  Calendar, Compass, Loader2, Plus,
} from 'lucide-react'
import { useCurrentUser, useFavorites, useTasks, useNotifications } from '@/lib/hooks'
import { useToast } from '@/components/Toast'

const PARCOURSUP_NEXT_EVENTS = [
  { date: '2025-05-30', title: 'Début de la phase principale d\'admission', link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-07-11', title: 'Fin de la phase principale', link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-09-12', title: 'Fermeture de Parcoursup 2025', link: 'https://www.parcoursup.gouv.fr' },
]

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useCurrentUser()
  const { favorites } = useFavorites()
  const { tasks, mutate: mutateTasks }   = useTasks()
  const { unread }   = useNotifications()
  const { toast }    = useToast()

  const doneCount  = tasks.filter(t => t.done).length
  const progress   = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0
  const todoTasks  = tasks.filter(t => !t.done).slice(0, 3)

  const today = new Date()
  const nextEvent = PARCOURSUP_NEXT_EVENTS.find(e => new Date(e.date) >= today)

  async function toggleTask(id: number, done: boolean) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: !done }),
    })
    await mutateTasks()
    toast(!done ? 'Tâche terminée !' : 'Tâche remise à faire.', !done ? 'success' : 'default')
  }

  if (authLoading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 32, color: 'var(--vigie-slate)' }}>
      <Loader2 size={22} className="spin" />
      <span>Chargement…</span>
    </div>
  )

  return (
    <div className="page-content dash-page">
      {/* ── PAGE HEAD ──────────────────────────── */}
      <div className="dash-head">
        <div>
          <div className="eyebrow">Mon espace étudiant</div>
          <h1>Salut, {isLoggedIn ? user?.name : 'bienvenue'} !</h1>
          <p>Voici tes repères pour avancer sereinement dans ton orientation.</p>
        </div>
        <Link href="/explorer" className="btn btn-outline">
          Explorer <ArrowRight size={16} />
        </Link>
      </div>

      {/* ── HERO BANNER ────────────────────────── */}
      <section className="dash-hero" aria-label="Bienvenue sur Vigie">
        <div className="dash-hero-text">
          <div className="dash-hero-eyebrow">
            <Sparkles size={13} /> LE BON REPÈRE, AU BON MOMENT.
          </div>
          <h2>Ton avenir.<br />Tes choix. À ton rythme.</h2>
          <p>Explore 14 252 formations officielles Parcoursup 2025, compare tes options et garde un œil sur les étapes qui comptent.</p>
          <Link href="/explorer" className="btn btn-white">
            Explorer les formations <ArrowRight size={16} />
          </Link>
        </div>
        <div className="dash-hero-portrait" aria-hidden="true">
          <img src="/brand/vigi-portrait.webp" alt="Vigi" width="180" height="180" />
        </div>
        <span className="dash-hero-spark" aria-hidden="true">✦</span>
      </section>

      {/* ── STAT CARDS ─────────────────────────── */}
      <div className="dash-stats" role="region" aria-label="Mes statistiques">
        <Link href="/mes-choix" className="dash-stat card">
          <div className="tile-icon">
            <Heart size={22} strokeWidth={1.8} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-num">{isLoggedIn ? favorites.length : '—'}</span>
            <span className="dash-stat-label">Formations suivies</span>
          </div>
        </Link>
        <Link href="/mes-choix" className="dash-stat card">
          <div className="tile-icon mint">
            <Check size={22} strokeWidth={1.8} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-num">{isLoggedIn ? `${progress}%` : '—'}</span>
            <span className="dash-stat-label">Progression préparation</span>
          </div>
        </Link>
        <Link href="/alertes" className="dash-stat card">
          <div className="tile-icon orange">
            <Bell size={22} strokeWidth={1.8} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-num">{isLoggedIn ? unread : '—'}</span>
            <span className="dash-stat-label">Notifications non lues</span>
          </div>
        </Link>
      </div>

      {/* ── TWO COLUMNS ────────────────────────── */}
      <div className="dash-two-col">
        {/* Prochaines étapes */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <h2>{isLoggedIn ? 'Mes prochaines tâches' : 'Checklist orientation'}</h2>
            <Link href="/mes-choix" className="btn btn-text">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          {!isLoggedIn ? (
            <div className="dash-cta">
              <Heart size={24} style={{ color: 'var(--vigie-blue)' }} />
              <div>
                <strong>Connecte-toi pour suivre ta progression</strong>
                <p>Crée un compte pour sauvegarder tes formations et cocher tes étapes.</p>
              </div>
              <Link href="/auth/register" className="btn btn-primary">
                Créer un compte <ArrowRight size={15} />
              </Link>
            </div>
          ) : todoTasks.length === 0 ? (
            <div className="dash-empty">
              <Check size={24} style={{ color: 'var(--vigie-mint)' }} />
              <strong>Toutes tes tâches sont terminées !</strong>
              <Link href="/mes-choix" className="btn btn-secondary">
                <Plus size={14} /> Ajouter une tâche
              </Link>
            </div>
          ) : (
            <div className="task-list">
              {todoTasks.map(task => (
                <label key={task.id} className="task-row">
                  <input
                    type="checkbox"
                    checked={!!task.done}
                    onChange={() => toggleTask(task.id, !!task.done)}
                    aria-label={task.label}
                  />
                  <div className="task-body">
                    <strong>{task.label}</strong>
                    {task.note && <span>{task.note}</span>}
                  </div>
                  <span className="badge badge-orange">À faire</span>
                </label>
              ))}
            </div>
          )}

          {isLoggedIn && (
            <div className="dash-progress-bar" style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--vigie-slate)', marginBottom: 6 }}>
                <span>{doneCount}/{tasks.length} tâches terminées</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill mint" style={{ width: `${progress}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )}
        </section>

        {/* Calendrier / Vigi tip */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <h2>Calendrier Parcoursup</h2>
            <span className="badge badge-blue">Officiel</span>
          </div>

          {nextEvent ? (
            <div className="dash-next-event">
              <div className={`tile-icon orange`}>
                <Calendar size={20} strokeWidth={1.8} />
              </div>
              <div>
                <strong>{nextEvent.title}</strong>
                <p>{new Date(nextEvent.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <a href={nextEvent.link} target="_blank" rel="noopener noreferrer" className="btn btn-text" style={{ fontSize: 12, padding: '4px 0' }}>
                  Vérifier sur parcoursup.fr <ArrowRight size={11} />
                </a>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--vigie-slate)' }}>Aucune échéance imminente.</p>
          )}

          <div className="dash-vigi-tip" style={{ marginTop: 20 }}>
            <div className="dash-vigi-portrait">
              <img src="/brand/vigi-portrait.webp" alt="Vigi" width="44" height="44" />
            </div>
            <div>
              <strong>Un conseil de Vigi</strong>
              <p>Compare les contenus des formations, pas seulement leurs chiffres. Les taux d'accès varient d'une année à l'autre.</p>
            </div>
          </div>

          <Link href="/alertes" className="btn btn-secondary" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
            <Bell size={15} /> Voir le calendrier complet
          </Link>
        </section>
      </div>

      {/* ── CALL TO ACTION — Explorer ──────────── */}
      {!isLoggedIn && (
        <section className="card dash-explore-cta">
          <div className="tile-icon mint">
            <Compass size={22} strokeWidth={1.8} />
          </div>
          <div>
            <h3>Explore 14 252 formations Parcoursup 2025</h3>
            <p>Données officielles du Ministère de l'Enseignement supérieur et de la Recherche. Filtres par filière, région, statut et sélectivité.</p>
          </div>
          <Link href="/explorer" className="btn btn-primary">
            Commencer <ArrowRight size={16} />
          </Link>
        </section>
      )}

      {isLoggedIn && favorites.length > 0 && (
        <section className="card dash-panel" style={{ marginTop: 0 }}>
          <div className="dash-panel-head">
            <h2>Mes dernières formations sauvegardées</h2>
            <Link href="/mes-choix" className="btn btn-text">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {favorites.slice(0, 3).map(f => (
              <Link
                key={f.cod_aff}
                href={`/explorer/${encodeURIComponent(f.cod_aff)}`}
                className="dash-fav-chip"
              >
                <Heart size={12} fill="currentColor" />
                Formation #{f.cod_aff}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="page-footer">
        Vigie · Assistant indépendant d&apos;orientation. Données officielles Parcoursup 2025.
        Aucune candidature n&apos;est déposée ici.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">
          Consulter Parcoursup
        </a>.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .dash-page { max-width: 1400px; }

        /* Head */
        .dash-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }
        .dash-head h1 {
          font-size: 36px;
          font-weight: 800;
          color: var(--vigie-ink);
          margin: 6px 0 4px;
        }
        .dash-head p { font-size: 14px; color: var(--vigie-slate); }

        /* Hero */
        .dash-hero {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 24px;
          align-items: center;
          position: relative;
          background: var(--vigie-blue);
          border-radius: var(--radius-card);
          padding: 32px 40px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .dash-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 90% 20%, rgba(36,36,245,0.4) 0%, transparent 55%),
            radial-gradient(ellipse at 10% 80%, rgba(117,66,245,0.2) 0%, transparent 50%);
          pointer-events: none;
        }
        .dash-hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          margin-bottom: 12px;
        }
        .dash-hero h2 {
          font-family: var(--font-heading);
          font-size: 32px;
          font-weight: 800;
          color: var(--vigie-white);
          letter-spacing: -0.04em;
          margin: 0 0 12px;
          line-height: 1.1;
        }
        .dash-hero p {
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          margin-bottom: 20px;
          max-width: 460px;
        }
        .dash-hero-portrait {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }
        .dash-hero-portrait img {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          object-fit: cover;
          object-position: top center;
          border: 4px solid rgba(255,255,255,0.2);
        }
        .dash-hero-spark {
          position: absolute;
          top: 20px;
          right: 220px;
          font-size: 24px;
          color: var(--vigie-orange);
        }

        /* Stats */
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
          text-decoration: none;
        }
        .dash-stat {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          text-decoration: none;
          color: inherit;
          transition: transform var(--motion-fast), box-shadow var(--motion-fast);
        }
        .dash-stat:hover { transform: translateY(-2px); }
        .dash-stat-num {
          display: block;
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 800;
          color: var(--vigie-ink);
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .dash-stat-label {
          display: block;
          font-size: 12px;
          color: var(--vigie-slate);
          margin-top: 4px;
        }

        /* Two col */
        .dash-two-col {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .dash-panel { padding: 24px; }

        /* Task rows */
        .task-list { display: flex; flex-direction: column; gap: 2px; }
        .task-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 4px;
          border-bottom: 1px solid #f0f1f8;
          cursor: pointer;
        }
        .task-row:last-child { border-bottom: 0; }
        .task-row input[type="checkbox"] {
          width: 18px; height: 18px; accent-color: var(--vigie-blue);
          flex-shrink: 0; cursor: pointer;
        }
        .task-body { flex: 1; }
        .task-body strong { display: block; font-size: 14px; color: var(--vigie-ink); }
        .task-body span { font-size: 12px; color: var(--vigie-slate); }

        /* Vigi tip */
        .dash-vigi-tip {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px;
          background: var(--vigie-lavender);
          border-radius: 14px;
        }
        .dash-vigi-portrait img {
          width: 44px; height: 44px; border-radius: 50%;
          object-fit: cover; object-position: top center;
        }
        .dash-vigi-tip strong { display: block; font-size: 13px; color: var(--vigie-blue); font-weight: 700; margin-bottom: 4px; }
        .dash-vigi-tip p { font-size: 12px; color: var(--vigie-slate); margin: 0; line-height: 1.6; }

        /* Next event */
        .dash-next-event { display: flex; align-items: flex-start; gap: 14px; }
        .dash-next-event strong { font-size: 14px; color: var(--vigie-ink); font-weight: 700; display: block; margin-bottom: 4px; }
        .dash-next-event p { font-size: 12px; color: var(--vigie-slate); }

        /* CTA explore */
        .dash-explore-cta {
          display: flex; align-items: center; gap: 20px;
          padding: 24px 28px; margin-bottom: 20px;
        }
        .dash-explore-cta h3 { font-size: 16px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .dash-explore-cta p { font-size: 13px; color: var(--vigie-slate); margin: 0; }
        .dash-explore-cta > .btn { flex-shrink: 0; margin-left: auto; }

        /* Vide / CTA */
        .dash-cta {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 20px; background: var(--vigie-lavender); border-radius: 14px;
        }
        .dash-cta > div { flex: 1; }
        .dash-cta strong { display: block; font-size: 14px; color: var(--vigie-ink); font-weight: 700; margin-bottom: 4px; }
        .dash-cta p { font-size: 12px; color: var(--vigie-slate); }
        .dash-cta > .btn { flex-shrink: 0; }
        .dash-empty {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 24px; text-align: center;
        }
        .dash-empty strong { font-size: 15px; color: var(--vigie-ink); }

        /* Fav chips */
        .dash-fav-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 10px;
          background: var(--vigie-lavender); color: var(--vigie-blue);
          font-size: 12px; font-weight: 600; text-decoration: none;
          transition: background var(--motion-fast);
        }
        .dash-fav-chip:hover { background: #e0deff; }

        @media (max-width: 1100px) {
          .dash-hero { grid-template-columns: 1fr; }
          .dash-hero-portrait { display: none; }
        }
        @media (max-width: 780px) {
          .dash-head h1 { font-size: 26px; }
          .dash-stats { grid-template-columns: 1fr 1fr; }
          .dash-stats > :last-child { grid-column: 1 / -1; }
          .dash-two-col { grid-template-columns: 1fr; }
          .dash-hero { padding: 24px 20px; }
          .dash-hero h2 { font-size: 24px; }
          .dash-explore-cta { flex-direction: column; }
          .dash-explore-cta > .btn { margin-left: 0; width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}
