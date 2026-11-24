'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Check, ArrowRight, Info, Plus, Loader2, Trash2, Edit3, Download } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useCurrentUser, useFavorites, useTasks, type Favorite, type Task } from '@/lib/hooks'
import type { Formation } from '@/lib/parcoursup'

const STATUS_LABELS: Record<string, string> = {
  'a_decouvrir':    '🔍 À découvrir',
  'a_analyser':     '📊 À analyser',
  'favorite':       '❤️ Formation favorite',
  'dossier':        '📝 Dossier en préparation',
  'voeu_formule':   '📬 Vœu formulé',
  'en_attente':     '⏳ En attente',
  'proposition':    '🎉 Proposition reçue',
  'decision_prise': '✅ Décision prise',
}

const STATUS_COLORS: Record<string, string> = {
  'a_decouvrir':    'badge-slate',
  'a_analyser':     'badge-blue',
  'favorite':       'badge-coral',
  'dossier':        'badge-orange',
  'voeu_formule':   'badge-violet',
  'en_attente':     'badge-orange',
  'proposition':    'badge-mint',
  'decision_prise': 'badge-mint',
}

function FormationCard({ fav, onRemove, onStatusChange }: {
  fav: Favorite
  onRemove: (codAff: string) => void
  onStatusChange: (codAff: string, status: string) => void
}) {
  const [formation, setFormation] = useState<Formation | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch(`/api/formations/${encodeURIComponent(fav.cod_aff)}`)
      .then(r => r.json())
      .then(data => setFormation(data.formation || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fav.cod_aff])

  if (loading) return (
    <div className="card mc-card mc-card-loading">
      <div className="skeleton" style={{ height: 20, width: '70%' }} />
      <div className="skeleton" style={{ height: 14, width: '50%' }} />
    </div>
  )

  const name = formation?.nom || `Formation #${fav.cod_aff}`
  const etab = formation?.etablissement || ''

  return (
    <article className="card mc-card">
      <div className="mc-card-top">
        <div className="tile-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m2 10 10-5 10 5-10 5-10-5zm4 2v5c3 3 9 3 12 0v-5m4-2v6"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 title={name}>{name.length > 55 ? name.slice(0, 52) + '…' : name}</h3>
          <div className="course-school">{etab}</div>
        </div>
        <button
          className="icon-btn"
          onClick={() => onRemove(fav.cod_aff)}
          aria-label={`Retirer ${name} de mes choix`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {formation?.ville && <span className="course-loc">{formation.ville} · {formation.region}</span>}
        {formation && <span className={`badge ${formation.statut === 'public' ? 'badge-mint' : 'badge-orange'}`}>{formation.statut === 'public' ? 'Public' : 'Privé'}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--vigie-slate)', fontWeight: 600 }}>Statut :</label>
        <select
          value={fav.status}
          onChange={e => onStatusChange(fav.cod_aff, e.target.value)}
          className="mc-status-select"
          aria-label={`Statut de ${name}`}
        >
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {formation?.tauxAcces !== undefined && formation.tauxAcces > 0 && (
        <div className="course-rate">
          <div className="course-rate-row">
            <span>Taux d&apos;accès 2025</span>
            <strong>{formation.tauxAcces} %</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${formation.tauxAcces}%` }} />
          </div>
        </div>
      )}

      <div className="course-actions">
        <Link href={`/explorer/${encodeURIComponent(fav.cod_aff)}`} className="btn btn-primary" style={{ flex: 1 }}>
          Voir la fiche
        </Link>
        <span className={`badge ${STATUS_COLORS[fav.status] || 'badge-slate'}`}>
          {(STATUS_LABELS[fav.status] || fav.status).replace(/^[^\s]+ /, '')}
        </span>
      </div>
    </article>
  )
}

export function MesChoixClient() {
  const { user, isLoggedIn, isLoading: authLoading } = useCurrentUser()
  const { favorites, mutate: mutateFavs } = useFavorites()
  const { tasks, mutate: mutateTasks }    = useTasks()
  const { toast } = useToast()

  const [newTask,    setNewTask]    = useState('')
  const [showForm,   setShowForm]   = useState(false)

  const doneCount  = tasks.filter(t => t.done).length
  const progress   = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  async function removeFavorite(codAff: string) {
    await fetch(`/api/favorites?codAff=${encodeURIComponent(codAff)}`, { method: 'DELETE' })
    await mutateFavs()
    toast('Formation retirée de tes choix.', 'default')
  }

  async function updateFavoriteStatus(codAff: string, status: string) {
    await fetch('/api/favorites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codAff, status }),
    })
    await mutateFavs()
    toast('Statut mis à jour.', 'success')
  }

  async function toggleTask(id: number, done: boolean) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: !done }),
    })
    await mutateTasks()
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTask.trim() }),
    })
    setNewTask('')
    setShowForm(false)
    await mutateTasks()
    toast('Tâche ajoutée.', 'success')
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    await mutateTasks()
  }

  function exportCSV() {
    const rows = [
      ['Formation', 'Statut', 'Notes', 'Date ajout'],
      ...favorites.map(f => [f.cod_aff, STATUS_LABELS[f.status] || f.status, f.notes, f.created_at]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'vigie-mes-choix.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 32, color: 'var(--vigie-slate)' }}>
      <Loader2 size={22} className="spin" />
      <span>Chargement…</span>
    </div>
  )

  if (!isLoggedIn) return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Avancer</div>
          <h1>Mes choix</h1>
        </div>
      </div>
      <div className="card mc-login-cta">
        <Heart size={32} style={{ color: 'var(--vigie-blue)' }} />
        <h2>Connecte-toi pour suivre tes formations</h2>
        <p>Crée un compte gratuit pour sauvegarder tes formations, suivre ta progression et organiser tes choix.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/auth/login" className="btn btn-primary">Se connecter <ArrowRight size={15} /></Link>
          <Link href="/auth/register" className="btn btn-outline">Créer un compte</Link>
        </div>
        <p style={{ fontSize: 12, color: 'var(--vigie-slate)' }}>
          Tu peux aussi <Link href="/explorer" className="btn-text">explorer sans compte</Link>.
        </p>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Avancer</div>
          <h1>Mes choix</h1>
          <p>Retrouve les formations suivies et ta liste de préparation.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="badge badge-blue">{favorites.length} formation{favorites.length !== 1 ? 's' : ''}</span>
          {favorites.length > 0 && (
            <button className="btn btn-outline" onClick={exportCSV} aria-label="Exporter en CSV">
              <Download size={15} /> Exporter CSV
            </button>
          )}
        </div>
      </div>

      {/* Formations sauvegardées */}
      <h2 className="section-title-h2">Mes formations enregistrées</h2>
      {favorites.length === 0 ? (
        <div className="mc-empty card">
          <Heart size={24} style={{ color: 'var(--vigie-blue)' }} />
          <strong>Aucune formation enregistrée</strong>
          <p>Explore les formations Parcoursup et clique sur le cœur pour les sauvegarder.</p>
          <Link href="/explorer" className="btn btn-primary">
            Explorer les formations <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="course-grid mc-grid">
          {favorites.map(fav => (
            <FormationCard
              key={fav.cod_aff}
              fav={fav}
              onRemove={removeFavorite}
              onStatusChange={updateFavoriteStatus}
            />
          ))}
        </div>
      )}

      {/* Checklist */}
      <div className="card mc-checklist">
        <div className="dash-panel-head" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="section-title-h2" style={{ margin: 0 }}>Ma liste de préparation</h2>
            <p style={{ fontSize: 13, color: 'var(--vigie-slate)', marginTop: 4 }}>
              {doneCount}/{tasks.length} tâches terminées · {progress} % de progression
            </p>
          </div>
          <span className="badge badge-mint">{doneCount}/{tasks.length}</span>
        </div>

        {/* Barre de progression */}
        <div className="progress-track" style={{ marginBottom: 20 }}>
          <div className="progress-fill mint" style={{ width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>

        <div className="task-list">
          {tasks.map(t => (
            <div key={t.id} className="task-row">
              <input
                type="checkbox"
                checked={!!t.done}
                onChange={() => toggleTask(t.id, !!t.done)}
                id={`task-${t.id}`}
                aria-label={t.label}
              />
              <label htmlFor={`task-${t.id}`} className="task-body" style={{ opacity: t.done ? 0.5 : 1 }}>
                <strong style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</strong>
                {t.note && <span>{t.note}</span>}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${t.done ? 'badge-mint' : 'badge-orange'}`}>
                  {t.done ? 'Terminé' : 'À faire'}
                </span>
                {/* Bouton supprimer uniquement pour les tâches créées par l'utilisateur (category='general') */}
                {t.category === 'general' && (
                  <button className="icon-btn" onClick={() => deleteTask(t.id)} aria-label={`Supprimer ${t.label}`} style={{ width: 28, height: 28 }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ajouter une tâche */}
        <div style={{ marginTop: 16 }}>
          {!showForm ? (
            <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
              <Plus size={15} /> Ajouter une tâche
            </button>
          ) : (
            <form className="mc-add-task" onSubmit={addTask}>
              <input
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Ma nouvelle tâche…"
                autoFocus
                className="mc-task-input"
              />
              <button type="submit" className="btn btn-primary" disabled={!newTask.trim()}>
                <Check size={15} /> Ajouter
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                Annuler
              </button>
            </form>
          )}
        </div>

        <p className="mc-disclaimer">
          <Info size={13} /> Cette liste n&apos;est pas synchronisée avec ton dossier Parcoursup. Les statuts sont renseignés manuellement.
        </p>
      </div>

      <footer className="page-footer">
        Vigie · Données officielles Parcoursup 2025.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">Consulter Parcoursup</a>.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .section-title-h2 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 14px; }
        .mc-grid { margin-bottom: 24px; }
        .mc-card { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
        .mc-card-top { display: flex; align-items: flex-start; gap: 12px; }
        .mc-card-top h3 { font-size: 15px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .mc-status-select {
          font-size: 13px; padding: 5px 10px;
          border: 1.5px solid #e4e5ef; border-radius: 8px;
          background: var(--vigie-white); color: var(--vigie-ink); cursor: pointer;
        }
        .mc-checklist { padding: 24px; margin-top: 0; }
        .task-list { display: flex; flex-direction: column; gap: 0; }
        .task-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 13px 0; border-bottom: 1px solid #f0f1f8;
        }
        .task-row:last-child { border-bottom: 0; }
        .task-row input[type="checkbox"] {
          width: 18px; height: 18px; accent-color: var(--vigie-blue); flex-shrink: 0; margin-top: 2px; cursor: pointer;
        }
        .task-body { flex: 1; cursor: pointer; }
        .task-body strong { display: block; font-size: 14px; color: var(--vigie-ink); margin-bottom: 2px; }
        .task-body span { font-size: 12px; color: var(--vigie-slate); }
        .mc-add-task { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .mc-task-input {
          flex: 1; height: 40px; padding: 0 12px;
          border: 1.5px solid var(--vigie-electric); border-radius: var(--radius-button);
          font-size: 14px; background: var(--vigie-white); outline: none;
        }
        .mc-disclaimer {
          display: flex; align-items: center; gap: 7px;
          margin-top: 14px; font-size: 12px; color: var(--vigie-slate);
        }
        .mc-empty {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 48px 24px; text-align: center;
        }
        .mc-empty strong { font-size: 16px; color: var(--vigie-ink); }
        .mc-empty p { color: var(--vigie-slate); }
        .mc-login-cta {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          padding: 48px 32px; text-align: center;
        }
        .mc-login-cta h2 { font-size: 20px; font-weight: 700; color: var(--vigie-ink); margin: 0; }
        .mc-login-cta p { font-size: 14px; color: var(--vigie-slate); max-width: 400px; }
        @media (max-width: 780px) {
          .course-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
