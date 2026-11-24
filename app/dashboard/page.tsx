'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  ArrowRight, Heart, BarChart2, Bell, Check, Sparkles, Info,
  CircleAlert, ShieldCheck, ExternalLink, RefreshCw,
} from 'lucide-react'
import { RecallsSection } from '@/components/rappel-dashboard'
import { useToast } from '@/components/Toast'

// ── Types ────────────────────────────────────────────────────
type RecallResponse = { total: number; results: Recall[]; updatedAt: string; error?: string }
type Recall = {
  id: number; date_publication: string; numero_fiche: string;
  categorie_produit: string; marque_produit: string; libelle: string;
  modeles_ou_references: string; motif_rappel: string; risques_encourus: string;
  zone_geographique_de_vente: string; lien_vers_la_fiche_rappel: string;
}
const fetcher = async (url: string): Promise<RecallResponse> => {
  const r = await fetch(url)
  if (!r.ok) throw new Error('Erreur réseau')
  return r.json()
}

// ── Checklist ────────────────────────────────────────────────
const TASKS = [
  { label: 'Explorer trois formations',   note: 'Découvre plusieurs options' },
  { label: 'Identifier mes critères',     note: 'Choisis ce qui compte pour toi' },
  { label: 'Préparer mes documents',      note: 'Liste les pièces dont tu auras besoin' },
]

export default function DashboardPage() {
  const [tasks, setTasks]       = useState([false, true, false])
  const [saved]                 = useState([1, 2])
  const [compareCount]          = useState(2)
  const { toast } = useToast()

  const { data, isLoading, mutate } = useSWR<RecallResponse>('/api/recalls', fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  })

  const doneCount   = tasks.filter(Boolean).length
  const totalTasks  = tasks.length
  const urgentCount = useMemo(() => {
    return (data?.results ?? []).filter(item =>
      /listeria|salmonell|escherichia|allerg|risque.*santé|intoxication/i.test(
        `${item.risques_encourus} ${item.motif_rappel}`
      )
    ).length
  }, [data])

  return (
    <div className="page-content dash-page">
      {/* ── PAGE HEAD ──────────────────────────── */}
      <div className="dash-head">
        <div>
          <div className="eyebrow">Mon espace étudiant</div>
          <h1>Salut, Étudiant·e !</h1>
          <p>Voici les repères pour avancer sereinement dans ton orientation.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="icon-btn"
            onClick={() => { mutate(); toast('Données actualisées.', 'success') }}
            aria-label="Actualiser les données"
          >
            <RefreshCw size={17} />
          </button>
          <Link href="/mes-choix" className="btn btn-outline">
            Mes choix <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ── HERO BANNER ────────────────────────── */}
      <section className="dash-hero" aria-label="Bienvenue sur Vigie">
        <div className="dash-hero-text">
          <div className="dash-hero-eyebrow">
            <Sparkles size={13} /> LE BON REPÈRE, AU BON MOMENT.
          </div>
          <h2>Ton avenir.<br />Tes choix. À ton rythme.</h2>
          <p>Explore les formations, compare tes options et garde un œil sur les étapes qui comptent.</p>
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
            <span className="dash-stat-num">{saved.length}</span>
            <span className="dash-stat-label">Formations suivies</span>
          </div>
        </Link>
        <Link href="/comparer" className="dash-stat card">
          <div className="tile-icon mint">
            <BarChart2 size={22} strokeWidth={1.8} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-num">{compareCount}</span>
            <span className="dash-stat-label">À comparer</span>
          </div>
        </Link>
        <Link href="/alertes" className="dash-stat card">
          <div className="tile-icon orange">
            <Bell size={22} strokeWidth={1.8} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-num">
              {isLoading ? '…' : urgentCount}
            </span>
            <span className="dash-stat-label">Alertes à lire</span>
          </div>
        </Link>
      </div>

      {/* ── TWO COLUMNS ────────────────────────── */}
      <div className="dash-two-col">
        {/* Prochaines étapes */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <h2>Mes prochaines étapes</h2>
            <Link href="/mes-choix" className="btn btn-text">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          <div className="task-list">
            {TASKS.map((task, i) => (
              <label key={i} className="task-row">
                <input
                  type="checkbox"
                  checked={tasks[i]}
                  onChange={() => {
                    setTasks(prev => {
                      const next = [...prev]
                      next[i] = !next[i]
                      return next
                    })
                    toast(!tasks[i] ? `"${task.label}" marqué comme terminé !` : `"${task.label}" remis à faire.`, !tasks[i] ? 'success' : 'default')
                  }}
                  aria-label={task.label}
                />
                <div className="task-body">
                  <strong>{task.label}</strong>
                  <span>{task.note}</span>
                </div>
                <span className={`badge ${tasks[i] ? 'badge-mint' : 'badge-orange'}`}>
                  {tasks[i] ? 'Terminé' : 'À faire'}
                </span>
              </label>
            ))}
          </div>

          <div className="dash-tip">
            <Info size={16} />
            <span>Les échéances affichées sont des exemples, pas le calendrier officiel.</span>
          </div>
        </section>

        {/* Mon avancée */}
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <h2>Mon avancée</h2>
            <span className="badge badge-mint">À ton rythme</span>
          </div>
          <div className="dash-progress-num">
            <span>{doneCount}</span>/{totalTasks}
          </div>
          <p className="dash-progress-label">étapes préparatoires terminées</p>
          <div className="progress-track" role="progressbar"
            aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={totalTasks}
            aria-label="Progression des étapes"
          >
            <div
              className="progress-fill"
              style={{ width: `${(doneCount / totalTasks) * 100}%` }}
            />
          </div>

          <div className="dash-vigi-tip">
            <div className="dash-vigi-portrait">
              <img src="/brand/vigi-portrait.webp" alt="Vigi" width="44" height="44" />
            </div>
            <div>
              <strong>Un conseil de Vigi</strong>
              <p>Compare les contenus des formations, pas seulement leurs chiffres.</p>
            </div>
          </div>
        </section>
      </div>

      {/* ── VEILLE RAPPELCONSO ─────────────────── */}
      <section className="dash-recalls-section" aria-label="Veille actualités consommation">
        <div className="dash-recalls-header">
          <div>
            <div className="eyebrow">
              <ShieldCheck size={13} /> Veille actualités
            </div>
            <h2>Rappels produits récents</h2>
            <p>Données officielles RappelConso — DGCCRF, actualisées toutes les 5 minutes.</p>
          </div>
          <a
            href="https://rappel.conso.gouv.fr"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            Base officielle <ExternalLink size={14} />
          </a>
        </div>
        <RecallsSection compact />
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="page-footer">
        Vigie · Assistant indépendant d&apos;orientation. Données et échéances fictives dans cette démo.
        Aucune candidature n&apos;est déposée ici.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">
          Consulter Parcoursup
        </a>.
      </footer>

      <style>{`
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
        .dash-hero::after {
          content: '';
          position: absolute;
          bottom: -40px;
          right: 180px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
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
          margin-bottom: 32px;
        }
        .dash-panel { padding: 24px; }
        .dash-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .dash-panel-head h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--vigie-ink);
        }

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
          width: 20px;
          height: 20px;
          accent-color: var(--vigie-blue);
          flex-shrink: 0;
          cursor: pointer;
        }
        .task-body { flex: 1; min-width: 0; }
        .task-body strong { display: block; font-size: 14px; color: var(--vigie-ink); }
        .task-body span { font-size: 12px; color: var(--vigie-slate); }

        /* Tip */
        .dash-tip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 16px;
          padding: 12px 16px;
          background: var(--vigie-cloud);
          border-radius: 12px;
          font-size: 12px;
          color: var(--vigie-slate);
        }
        .dash-tip svg { flex-shrink: 0; color: var(--vigie-electric); margin-top: 1px; }

        /* Progress */
        .dash-progress-num {
          font-family: var(--font-heading);
          font-size: 44px;
          font-weight: 800;
          color: var(--vigie-blue);
          line-height: 1;
          margin: 8px 0 4px;
        }
        .dash-progress-num span { font-size: 44px; }
        .dash-progress-label {
          font-size: 13px;
          color: var(--vigie-slate);
          margin-bottom: 16px;
        }

        /* Vigi tip */
        .dash-vigi-tip {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 20px;
          padding: 14px;
          background: var(--vigie-lavender);
          border-radius: 14px;
        }
        .dash-vigi-portrait {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(9,9,148,0.15);
        }
        .dash-vigi-portrait img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }
        .dash-vigi-tip strong {
          display: block;
          font-size: 13px;
          color: var(--vigie-blue);
          margin-bottom: 4px;
        }
        .dash-vigi-tip p { font-size: 12px; color: var(--vigie-slate); }

        /* Recalls section */
        .dash-recalls-section { margin-bottom: 24px; }
        .dash-recalls-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        .dash-recalls-header h2 {
          font-size: 22px;
          font-weight: 800;
          color: var(--vigie-ink);
          margin: 6px 0 4px;
        }
        .dash-recalls-header p { font-size: 13px; color: var(--vigie-slate); }

        /* Responsive */
        @media (max-width: 1100px) {
          .dash-hero { grid-template-columns: 1fr 160px; }
          .dash-hero h2 { font-size: 26px; }
          .dash-two-col { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 780px) {
          .dash-head { flex-direction: column; }
          .dash-head h1 { font-size: 28px; }
          .dash-hero { grid-template-columns: 1fr 90px; padding: 20px; }
          .dash-hero h2 { font-size: 22px; }
          .dash-hero-portrait img { width: 90px; height: 90px; }
          .dash-hero-spark { right: 100px; }
          .dash-stats { grid-template-columns: 1fr 1fr 1fr; }
          .dash-stat { padding: 14px; flex-direction: column; align-items: flex-start; gap: 8px; }
          .dash-stat-num { font-size: 24px; }
          .dash-two-col { grid-template-columns: 1fr; }
          .dash-recalls-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}
