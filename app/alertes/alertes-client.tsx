'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Calendar, Compass, Check, ArrowRight, Loader2, Plus, Trash2, Info } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useCurrentUser, useNotifications, useReminders, type Notification, type Reminder } from '@/lib/hooks'

// Calendrier Parcoursup 2025 — données statiques déplacées ici pour éviter l'import serveur
const PARCOURSUP_CALENDAR_2025 = [
  { date: '2025-01-15', title: 'Ouverture du service aux lycéens',    desc: 'La plateforme Parcoursup ouvre pour la consultation des formations.', official: true, link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-01-22', title: 'Début de la saisie des vœux',        desc: 'Les lycéens peuvent commencer à formuler leurs vœux sur Parcoursup.', official: true, link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-03-13', title: 'Date limite de saisie des vœux',     desc: 'Dernier jour pour saisir les vœux sur Parcoursup.', official: true, link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-04-10', title: 'Date limite de confirmation des vœux', desc: 'Dernier jour pour confirmer les vœux et finaliser le dossier.', official: true, link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-05-30', title: 'Début de la phase principale d\'admission', desc: 'Les premières réponses des formations sont envoyées.', official: true, link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-07-11', title: 'Fin de la phase principale',          desc: 'Clôture de la phase principale d\'admission.', official: true, link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-07-11', title: 'Début de la phase complémentaire',   desc: 'Possibilité de formuler de nouveaux vœux pour des formations avec places disponibles.', official: true, link: 'https://www.parcoursup.gouv.fr' },
  { date: '2025-09-12', title: 'Fermeture de Parcoursup',             desc: 'La plateforme Parcoursup 2025 ferme définitivement.', official: true, link: 'https://www.parcoursup.gouv.fr' },
]
const CALENDAR_NOTE = 'Dates indicatives de la campagne Parcoursup 2025. Vérifiez toujours les dates officielles sur parcoursup.gouv.fr'

export function AlertesClient() {
  const { isLoggedIn, isLoading: authLoading } = useCurrentUser()
  const { notifications, unread, mutate: mutateNotifs } = useNotifications()
  const { reminders, mutate: mutateReminders }          = useReminders()
  const { toast } = useToast()

  const [prefs, setPrefs] = useState([true, true, false])

  // Rappel form
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [rLabel, setRLabel] = useState('')
  const [rNote,  setRNote]  = useState('')
  const [rDate,  setRDate]  = useState('')

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    await mutateNotifs()
    toast('Toutes les alertes marquées comme lues.', 'success')
  }

  async function markRead(id: number) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await mutateNotifs()
  }

  async function addReminder(e: React.FormEvent) {
    e.preventDefault()
    if (!rLabel.trim() || !rDate) return
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: rLabel.trim(), note: rNote, dueDate: rDate }),
    })
    if (res.ok) {
      setRLabel(''); setRNote(''); setRDate('')
      setShowReminderForm(false)
      await mutateReminders()
      toast('Rappel créé avec succès.', 'success')
    } else {
      toast('Impossible de créer le rappel.', 'error')
    }
  }

  async function deleteReminder(id: number) {
    await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' })
    await mutateReminders()
    toast('Rappel supprimé.')
  }

  async function triggerProcessReminders() {
    const res = await fetch('/api/admin/process-reminders', { method: 'POST' })
    const data = await res.json()
    await mutateNotifs()
    toast(`${data.processed} rappel(s) traité(s).`, 'success')
  }

  const today = new Date()

  if (authLoading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 32, color: 'var(--vigie-slate)' }}>
      <Loader2 size={22} className="spin" />
      <span>Chargement…</span>
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Rester informé</div>
          <h1>Mes alertes</h1>
          <p>Retrouve les rappels et personnalise tes notifications.</p>
        </div>
        {isLoggedIn && unread > 0 && (
          <button className="btn btn-outline" onClick={markAllRead} aria-label="Tout marquer comme lu">
            <Check size={15} /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="alertes-grid">
        {/* Notifications */}
        <section className="card alertes-panel">
          <div className="dash-panel-head">
            <h2>Notifications</h2>
            {isLoggedIn && (
              <span className="badge badge-orange">{unread} non lue{unread !== 1 ? 's' : ''}</span>
            )}
          </div>

          {!isLoggedIn ? (
            <div className="alertes-login-cta">
              <Bell size={24} style={{ color: 'var(--vigie-blue)' }} />
              <p>Connecte-toi pour recevoir des notifications personnalisées.</p>
              <Link href="/auth/login" className="btn btn-primary">Se connecter <ArrowRight size={15} /></Link>
            </div>
          ) : notifications.length === 0 ? (
            <div className="alertes-empty">
              <Bell size={20} style={{ opacity: 0.3 }} />
              <p>Aucune notification pour le moment.</p>
              <span style={{ fontSize: 12, color: 'var(--vigie-slate)' }}>
                Les notifications apparaîtront ici lorsque tu auras des rappels ou des tâches en retard.
              </span>
            </div>
          ) : (
            <div className="alertes-list">
              {notifications.slice(0, 10).map((n: Notification) => (
                <div key={n.id} className={`alert-card${n.read ? ' read' : ''}`}>
                  <div className={`tile-icon ${n.type === 'reminder' ? 'orange' : n.type === 'formation' ? 'mint' : 'blue'}`}>
                    {n.type === 'reminder' || n.type === 'task'
                      ? <Calendar size={20} strokeWidth={1.8} aria-hidden="true" />
                      : <Bell size={20} strokeWidth={1.8} aria-hidden="true" />
                    }
                  </div>
                  <div className="alert-card-body">
                    <div className="alert-card-title">
                      <strong>{n.title}</strong>
                      {!n.read && (
                        <span className="badge badge-orange" style={{ fontSize: 10, padding: '3px 8px' }}>Nouveau</span>
                      )}
                    </div>
                    <p>{n.body}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {n.link && (
                        <Link href={n.link} className="btn btn-text" onClick={() => markRead(n.id)}>
                          Voir <ArrowRight size={13} />
                        </Link>
                      )}
                      {!n.read && (
                        <button className="btn btn-text" style={{ fontSize: 12 }} onClick={() => markRead(n.id)}>
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="notif-time">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Rappels personnels */}
        <section className="card alertes-panel">
          <div className="dash-panel-head">
            <h2>Mes rappels</h2>
            {isLoggedIn && (
              <button className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: 13 }} onClick={() => setShowReminderForm(v => !v)}>
                <Plus size={14} /> Ajouter
              </button>
            )}
          </div>

          {!isLoggedIn ? (
            <div className="alertes-login-cta">
              <p>Connecte-toi pour créer des rappels personnels.</p>
              <Link href="/auth/login" className="btn btn-outline">Se connecter</Link>
            </div>
          ) : (
            <>
              {showReminderForm && (
                <form className="reminder-form" onSubmit={addReminder}>
                  <input
                    type="text"
                    value={rLabel}
                    onChange={e => setRLabel(e.target.value)}
                    placeholder="Libellé du rappel…"
                    required
                    className="mc-task-input"
                  />
                  <input
                    type="text"
                    value={rNote}
                    onChange={e => setRNote(e.target.value)}
                    placeholder="Note optionnelle"
                    className="mc-task-input"
                  />
                  <input
                    type="date"
                    value={rDate}
                    onChange={e => setRDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="mc-task-input"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn btn-primary" disabled={!rLabel.trim() || !rDate}>
                      <Check size={14} /> Enregistrer
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowReminderForm(false)}>
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {reminders.length === 0 && !showReminderForm ? (
                <div className="alertes-empty">
                  <Calendar size={20} style={{ opacity: 0.3 }} />
                  <p>Aucun rappel créé.</p>
                </div>
              ) : (
                <div className="alertes-list">
                  {reminders.map((r: Reminder) => (
                    <div key={r.id} className={`alert-card${r.done ? ' read' : ''}`}>
                      <div className="tile-icon orange">
                        <Calendar size={20} strokeWidth={1.8} />
                      </div>
                      <div className="alert-card-body">
                        <div className="alert-card-title">
                          <strong>{r.label}</strong>
                        </div>
                        {r.note && <p>{r.note}</p>}
                        <span style={{ fontSize: 12, color: 'var(--vigie-slate)' }}>
                          Échéance : {new Date(r.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <button className="icon-btn" onClick={() => deleteReminder(r.id)} aria-label={`Supprimer le rappel ${r.label}`} style={{ width: 28, height: 28 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton de test rappels */}
              <button
                className="btn btn-outline"
                style={{ marginTop: 12, fontSize: 12 }}
                onClick={triggerProcessReminders}
              >
                🔔 Traiter les rappels maintenant (test)
              </button>
            </>
          )}
        </section>
      </div>

      {/* Calendrier Parcoursup 2025 */}
      <section className="card alertes-panel" style={{ marginTop: 16 }}>
        <div className="dash-panel-head">
          <h2>
            <Calendar size={18} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
            Calendrier Parcoursup 2025
          </h2>
          <span className="badge badge-blue">Officiel</span>
        </div>
        <p className="alertes-pref-note">{CALENDAR_NOTE}</p>
        <div className="alertes-calendar">
          {PARCOURSUP_CALENDAR_2025.map((event, i) => {
            const eventDate = new Date(event.date)
            const isPast = eventDate < today
            const isSoon = !isPast && eventDate.getTime() - today.getTime() < 1000 * 60 * 60 * 24 * 30
            return (
              <div key={i} className={`calendar-event${isPast ? ' past' : ''}${isSoon ? ' soon' : ''}`}>
                <div className="calendar-date">
                  <strong>{eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</strong>
                  <span>{eventDate.getFullYear()}</span>
                </div>
                <div className="calendar-body">
                  <strong>{event.title}</strong>
                  <p>{event.desc}</p>
                </div>
                <div className="calendar-status">
                  {isPast && <span className="badge badge-slate">Passé</span>}
                  {isSoon && <span className="badge badge-orange">Bientôt</span>}
                  <a href={event.link} target="_blank" rel="noopener noreferrer" className="btn btn-text" style={{ fontSize: 12 }}>
                    Vérifier <ArrowRight size={11} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Préférences */}
      <section className="card alertes-panel" style={{ marginTop: 16 }}>
        <div className="dash-panel-head">
          <h2>Mes préférences</h2>
        </div>
        {!isLoggedIn && <p className="alertes-pref-note">Connecte-toi pour sauvegarder tes préférences.</p>}
        <div className="pref-list">
          {[
            { label: 'Rappels importants',  desc: 'Échéances Parcoursup et rappels personnels' },
            { label: 'Nouveautés',          desc: 'Nouvelles formations correspondant à tes préférences' },
            { label: 'Newsletter par e-mail', desc: <Link href="/profil" className="btn-text">Configurer dans Mon profil</Link> },
          ].map((p, i) => (
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

      <div className="dash-tip" style={{ marginTop: 16 }}>
        <Info size={15} />
        <span>Les dates du calendrier sont indicatives. Vérifie toujours les dates officielles sur <a href="https://www.parcoursup.gouv.fr" target="_blank" rel="noopener noreferrer">parcoursup.gouv.fr</a>.</span>
      </div>

      <footer className="page-footer">
        Vigie · Données officielles Parcoursup. Aucune candidature n&apos;est déposée ici.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .alertes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .alertes-panel { padding: 24px; }
        .alertes-panel h2 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); }
        .alertes-list { display: flex; flex-direction: column; gap: 0; }
        .alert-card {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 18px 0; border-bottom: 1px solid #f0f1f8;
        }
        .alert-card:last-child { border-bottom: 0; }
        .alert-card.read { opacity: 0.6; }
        .alert-card-body { flex: 1; min-width: 0; }
        .alert-card-title { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .alert-card-title strong { font-size: 14px; color: var(--vigie-ink); }
        .alert-card-body p { font-size: 13px; color: var(--vigie-slate); margin-bottom: 8px; }
        .notif-time { font-size: 11px; color: var(--vigie-slate); white-space: nowrap; flex-shrink: 0; }
        .alertes-pref-note { font-size: 12px; color: var(--vigie-slate); margin: 0 0 20px; }
        .alertes-empty {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 32px 20px; color: var(--vigie-slate); font-size: 13px; text-align: center;
        }
        .alertes-login-cta {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 24px; text-align: center;
        }
        .alertes-login-cta p { font-size: 13px; color: var(--vigie-slate); }
        .reminder-form {
          display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;
          padding: 16px; background: var(--vigie-bg); border-radius: 12px;
        }
        .mc-task-input {
          height: 40px; padding: 0 12px;
          border: 1.5px solid #e4e5ef; border-radius: var(--radius-button);
          font-size: 14px; background: var(--vigie-white); outline: none;
        }
        .mc-task-input:focus { border-color: var(--vigie-electric); }
        .pref-list { display: flex; flex-direction: column; gap: 0; }
        .pref-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 0; border-bottom: 1px solid #f0f1f8; cursor: pointer;
        }
        .pref-row:last-child { border-bottom: 0; }
        .pref-row input { width: 20px; height: 20px; accent-color: var(--vigie-blue); flex-shrink: 0; margin-top: 2px; cursor: pointer; }
        .pref-row strong { display: block; font-size: 14px; color: var(--vigie-ink); margin-bottom: 3px; }
        .pref-row p { font-size: 12px; color: var(--vigie-slate); margin: 0; }
        /* Calendrier */
        .alertes-calendar { display: flex; flex-direction: column; gap: 0; }
        .calendar-event {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 14px 0; border-bottom: 1px solid #f0f1f8;
        }
        .calendar-event:last-child { border-bottom: 0; }
        .calendar-event.past { opacity: 0.5; }
        .calendar-event.soon { background: #fffbf0; margin: 0 -8px; padding: 14px 8px; border-radius: 8px; border-bottom-color: transparent; }
        .calendar-date { display: flex; flex-direction: column; align-items: center; min-width: 48px; }
        .calendar-date strong { font-size: 14px; font-weight: 700; color: var(--vigie-ink); text-align: center; }
        .calendar-date span { font-size: 11px; color: var(--vigie-slate); }
        .calendar-body { flex: 1; }
        .calendar-body strong { font-size: 14px; color: var(--vigie-ink); display: block; margin-bottom: 3px; }
        .calendar-body p { font-size: 12px; color: var(--vigie-slate); margin: 0; }
        .calendar-status { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        @media (max-width: 780px) {
          .alertes-grid { grid-template-columns: 1fr; }
          .calendar-event { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  )
}
