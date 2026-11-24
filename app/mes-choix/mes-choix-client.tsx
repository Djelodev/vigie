'use client'

import { useState } from 'react'
import { Heart, Check, ArrowRight, Info } from 'lucide-react'

type Course = { id: number; title: string; school: string; city: string; type: string; duration: string; rate: number; tags: string }
const COURSES: Course[] = [
  { id: 1, title: 'BUT Informatique',        school: 'IUT — établissement démo A',        city: 'Paris',    type: 'BUT',     duration: '3 ans', rate: 64, tags: 'Développement · Réseaux' },
  { id: 2, title: 'Licence Informatique',    school: 'Université — établissement démo B', city: 'Lyon',     type: 'Licence', duration: '3 ans', rate: 78, tags: 'Algorithmique · Mathématiques' },
]
const TASKS = [
  { label: 'Explorer trois formations',   note: 'Découvre plusieurs options' },
  { label: 'Identifier mes critères',     note: 'Choisis ce qui compte pour toi' },
  { label: 'Préparer mes documents',      note: 'Liste les pièces dont tu auras besoin' },
]

export function MesChoixClient() {
  const [saved]  = useState<number[]>([1, 2])
  const [tasks, setTasks] = useState([false, true, false])
  const doneCount = tasks.filter(Boolean).length

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Avancer</div>
          <h1>Mes choix</h1>
          <p>Retrouve les formations suivies et ta liste personnelle de préparation.</p>
        </div>
        <span className="badge badge-blue">{saved.length} choix</span>
      </div>

      {/* Formations saved */}
      <h2 className="section-title-h2">Mes formations enregistrées</h2>
      <div className="course-grid mc-grid">
        {COURSES.filter(c => saved.includes(c.id)).map(c => (
          <article key={c.id} className="card mc-card">
            <div className="mc-card-top">
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 10 10-5 10 5-10 5-10-5zm4 2v5c3 3 9 3 12 0v-5m4-2v6"/></svg>
              </div>
              <div>
                <h3>{c.title}</h3>
                <div className="course-school">{c.school}</div>
              </div>
              <button className="recall-save saved" aria-label={`Retirer ${c.title}`} aria-pressed="true">
                <Heart size={16} fill="currentColor" />
              </button>
            </div>
            <div className="course-meta-row">
              <span className="course-loc">{c.city} · {c.duration}</span>
              <span className="badge badge-blue">{c.type}</span>
            </div>
            <p className="course-tags">{c.tags}</p>
            <div className="mc-rate">
              <div className="course-rate-row">
                <span>Taux d&apos;accès historique (2025, démo)</span>
                <strong>{c.rate} %</strong>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${c.rate}%` }} /></div>
            </div>
            <div className="course-actions">
              <button className="btn btn-primary" style={{ flex: 1 }}>Voir la fiche</button>
              <button className="btn btn-secondary" style={{ flex: 1 }}>
                <Check size={14} /> À comparer
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Checklist */}
      <div className="card mc-checklist">
        <div className="dash-panel-head" style={{ marginBottom: 16 }}>
          <h2 className="section-title-h2" style={{ margin: 0 }}>Ma liste de préparation</h2>
          <span className="badge badge-mint">{doneCount}/{TASKS.length}</span>
        </div>
        <div className="task-list">
          {TASKS.map((t, i) => (
            <label key={i} className="task-row">
              <input
                type="checkbox"
                checked={tasks[i]}
                onChange={() => setTasks(prev => { const n = [...prev]; n[i] = !n[i]; return n })}
              />
              <div className="task-body">
                <strong>{t.label}</strong>
                <span>{t.note}</span>
              </div>
              <span className={`badge ${tasks[i] ? 'badge-mint' : 'badge-orange'}`}>
                {tasks[i] ? 'Terminé' : 'À faire'}
              </span>
            </label>
          ))}
        </div>
        <p className="mc-disclaimer">
          <Info size={13} /> Cette liste n&apos;est pas synchronisée avec ton dossier Parcoursup.
        </p>
      </div>

      <footer className="page-footer">
        Vigie · Données fictives.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">Consulter Parcoursup</a>.
      </footer>

      <style>{`
        .section-title-h2 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 14px; }
        .mc-grid { margin-bottom: 24px; }
        .mc-card { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
        .mc-card-top { display: flex; align-items: flex-start; gap: 12px; }
        .mc-card-top h3 { font-size: 16px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .mc-rate {}
        .mc-checklist { padding: 24px; margin-top: 0; }
        .mc-disclaimer {
          display: flex; align-items: center; gap: 7px;
          margin-top: 14px; font-size: 12px; color: var(--vigie-slate);
        }
        @media (max-width: 780px) {
          .course-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
