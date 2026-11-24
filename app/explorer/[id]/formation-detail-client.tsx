'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, BarChart2, ExternalLink, MapPin, Building2, Info, Loader2, AlertCircle, Share2, Check } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useCurrentUser } from '@/lib/hooks'
import type { Formation } from '@/lib/parcoursup'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const STATUS_LABELS: Record<string, string> = {
  'a_decouvrir':     'À découvrir',
  'a_analyser':      'À analyser',
  'favorite':        'Formation favorite',
  'dossier':         'Dossier en préparation',
  'voeu_formule':    'Vœu formulé',
  'en_attente':      'En attente d\'une réponse',
  'proposition':     'Proposition reçue',
  'decision_prise':  'Décision prise',
}

export function FormationDetailClient({ id }: { id: string }) {
  const [formation, setFormation]  = useState<Formation | null>(null)
  const [loading,   setLoading]    = useState(true)
  const [error,     setError]      = useState('')
  const [isFav,     setIsFav]      = useState(false)
  const [status,    setStatus]     = useState('')
  const [copied,    setCopied]     = useState(false)

  const { isLoggedIn } = useCurrentUser()
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    fetch(`/api/formations/${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setFormation(data.formation)
      })
      .catch(() => setError('Impossible de charger la fiche.'))
      .finally(() => setLoading(false))
  }, [id])

  // Charger le statut favori si connecté
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => {
        const fav = (data.favorites || []).find((f: { cod_aff: string; status: string }) => f.cod_aff === id)
        if (fav) { setIsFav(true); setStatus(fav.status) }
      })
      .catch(() => {})
  }, [isLoggedIn, id])

  async function toggleFavorite() {
    if (!isLoggedIn) {
      toast('Connecte-toi pour sauvegarder des formations.', 'default')
      return
    }
    if (isFav) {
      await fetch(`/api/favorites?codAff=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setIsFav(false)
      setStatus('')
      toast('Formation retirée de tes choix.')
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codAff: id }),
      })
      setIsFav(true)
      setStatus('a_decouvrir')
      toast('Formation ajoutée à tes choix !', 'success')
    }
  }

  async function updateStatus(newStatus: string) {
    if (!isLoggedIn) return
    await fetch('/api/favorites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codAff: id, status: newStatus }),
    })
    setStatus(newStatus)
    toast('Statut mis à jour.', 'success')
  }

  async function addToCompare() {
    const stored = JSON.parse(sessionStorage.getItem('vigie_compare') || '[]') as string[]
    if (stored.includes(id)) {
      toast('Déjà dans la comparaison.', 'default')
      return
    }
    if (stored.length >= 4) {
      toast('Tu peux comparer jusqu\'à 4 formations.', 'error')
      return
    }
    const updated = [...stored, id]
    sessionStorage.setItem('vigie_compare', JSON.stringify(updated))
    if (isLoggedIn) {
      await fetch('/api/comparer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: updated }),
      })
    }
    toast('Formation ajoutée au comparateur.', 'success')
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast('Lien copié dans le presse-papier.', 'success')
    } catch {
      toast('Impossible de copier le lien.', 'error')
    }
  }

  if (loading) return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 32, color: 'var(--vigie-slate)' }}>
        <Loader2 size={24} className="spin" />
        <span>Chargement de la fiche…</span>
      </div>
    </div>
  )

  if (error || !formation) return (
    <div className="page-content">
      <div className="detail-error">
        <AlertCircle size={20} />
        <div>
          <strong>Formation introuvable</strong>
          <p>{error || 'Cette formation n\'est pas disponible.'}</p>
        </div>
        <Link href="/explorer" className="btn btn-outline">
          <ArrowLeft size={15} /> Retour à l'Explorer
        </Link>
      </div>
    </div>
  )

  const f = formation

  // Données graphique répartition bac
  const bacData = [
    { name: 'Bac général',       value: f.pctBacGen,  fill: '#2424F5' },
    { name: 'Bac techno.',       value: f.pctBacTech, fill: '#7542F5' },
    { name: 'Bac pro.',          value: f.pctBacPro,  fill: '#14C8A0' },
  ].filter(d => d.value > 0)

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">
            <Link href="/explorer" className="btn btn-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Explorer
            </Link>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>{f.nom}</h1>
          <p>{f.etablissement}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={`btn ${isFav ? 'btn-secondary' : 'btn-outline'}`} onClick={toggleFavorite}>
            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
            {isFav ? 'Dans mes choix' : 'Ajouter'}
          </button>
          <button className="btn btn-outline" onClick={addToCompare}>
            <BarChart2 size={16} /> Comparer
          </button>
          <button className="btn btn-outline" onClick={share}>
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copié !' : 'Partager'}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Colonne principale */}
        <div className="detail-main">
          {/* Infos essentielles */}
          <div className="card detail-panel">
            <h2>Informations essentielles</h2>
            <div className="detail-props">
              {[
                ['Établissement',    f.etablissement],
                ['Filière',          f.filiere],
                ['Type de formation', f.typeFormation],
                ['Ville',            f.ville],
                ['Département',      `${f.departementNom} (${f.departement})`],
                ['Région',           f.region],
                ['Académie',         f.academie],
                ['Statut',           f.statut === 'public' ? 'Établissement public' : 'Établissement privé'],
                ['Sélectivité',      f.selectivite === 'selective' ? 'Formation sélective' : 'Formation non sélective'],
                ['Capacité d\'accueil', f.capacite > 0 ? `${f.capacite} places` : 'Non communiqué'],
              ].map(([label, value]) => (
                <div key={label} className="detail-prop">
                  <span>{label}</span>
                  <strong>{value || 'Non renseigné'}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Statistiques Parcoursup 2025 */}
          <div className="card detail-panel">
            <div className="detail-panel-head">
              <h2>Statistiques officielles Parcoursup 2025</h2>
              <span className="badge badge-mint">Données officielles</span>
            </div>
            <div className="detail-stats-grid">
              {[
                { label: 'Capacité',     value: f.capacite,      unit: 'places',      color: 'blue'   },
                { label: 'Candidatures', value: f.voeux,         unit: 'vœux',        color: 'orange' },
                { label: 'Admis',        value: f.admis,         unit: 'admis',       color: 'mint'   },
                { label: 'Taux d\'accès',value: f.tauxAcces,     unit: '%',           color: 'violet' },
              ].map(stat => (
                <div key={stat.label} className={`detail-stat tile-icon-bg-${stat.color}`}>
                  <div className="detail-stat-value">{stat.value > 0 ? stat.value.toLocaleString('fr-FR') : '—'}</div>
                  <div className="detail-stat-unit">{stat.unit}</div>
                  <div className="detail-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {f.tauxAcces > 0 && (
              <div className="detail-taux-bar">
                <div className="detail-taux-label">
                  <span>Taux d'accès</span>
                  <strong>{f.tauxAcces} %</strong>
                </div>
                <div className="progress-track" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${f.tauxAcces}%` }} />
                </div>
                <p className="detail-taux-note">
                  <Info size={12} />
                  Ce taux représente le ratio admis / classés en liste d'appel sur la campagne 2025.
                  Il ne prédit pas tes chances individuelles d'admission.
                </p>
              </div>
            )}
          </div>

          {/* Répartition par bac */}
          {bacData.length > 0 && (
            <div className="card detail-panel">
              <h2>Répartition des admis par type de baccalauréat (2025)</h2>
              <div style={{ height: 200, marginTop: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bacData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid horizontal={false} stroke="#edeef5" strokeDasharray="3 4" />
                    <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false}
                           tick={{ fill: '#62657B', fontSize: 11 }}
                           tickFormatter={v => `${v} %`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                           tick={{ fill: '#62657B', fontSize: 12 }} width={110} />
                    <Tooltip formatter={(v) => [`${v} %`]} contentStyle={{ border: '1px solid #e4e5ef', borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}
                         label={{ position: 'right', formatter: (v: number) => `${v} %`, fontSize: 12 }}>
                      {bacData.map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="detail-source">{f.sourceLabel}</p>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="detail-aside">
          {/* Suivi personnel */}
          {isLoggedIn && isFav && (
            <div className="card detail-panel">
              <h2>Mon suivi</h2>
              <label className="detail-status-label">Statut de cette formation</label>
              <select
                value={status}
                onChange={e => updateStatus(e.target.value)}
                className="detail-status-select"
                aria-label="Statut de la formation"
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {!isLoggedIn && (
            <div className="card detail-panel detail-login-cta">
              <Heart size={22} className="detail-cta-icon" />
              <h3>Suis cette formation</h3>
              <p>Connecte-toi pour ajouter cette formation à tes choix et suivre ta progression.</p>
              <Link href="/auth/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Se connecter
              </Link>
            </div>
          )}

          {/* Lien officiel */}
          <div className="card detail-panel">
            <h2>Liens officiels</h2>
            {f.lienParcoursup ? (
              <a
                href={f.lienParcoursup}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
              >
                <ExternalLink size={15} /> Fiche Parcoursup officielle
              </a>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--vigie-slate)' }}>Lien officiel non disponible.</p>
            )}
            <a
              href="https://www.parcoursup.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <ExternalLink size={15} /> Parcoursup.fr
            </a>
          </div>

          {/* Localisation */}
          {f.ville && (
            <div className="card detail-panel">
              <h2><MapPin size={16} /> Localisation</h2>
              <div className="detail-location">
                <Building2 size={15} /> {f.etablissement}<br />
                {f.ville}, {f.departementNom}<br />
                {f.region}
              </div>
            </div>
          )}

          {/* Source */}
          <div className="detail-source-box">
            <Info size={13} />
            <span>{f.sourceLabel}</span>
          </div>
        </div>
      </div>

      <footer className="page-footer">
        Vigie · Données officielles Parcoursup 2025.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">Consulter Parcoursup</a>.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
        .detail-panel { padding: 24px; }
        .detail-panel h2 { font-size: 17px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 18px; }
        .detail-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .detail-panel-head h2 { margin: 0; }
        .detail-main { display: flex; flex-direction: column; gap: 16px; }
        .detail-aside { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
        .detail-props { display: flex; flex-direction: column; gap: 0; }
        .detail-prop {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 0; border-bottom: 1px solid #f0f1f8;
          font-size: 14px; color: var(--vigie-slate);
        }
        .detail-prop:last-child { border-bottom: 0; }
        .detail-prop strong { color: var(--vigie-ink); font-weight: 600; text-align: right; max-width: 60%; }
        .detail-stats-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;
        }
        .detail-stat {
          padding: 16px; border-radius: 12px; background: var(--vigie-lavender);
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        }
        .detail-stat-value { font-size: 24px; font-weight: 800; color: var(--vigie-ink); font-family: var(--font-heading); }
        .detail-stat-unit { font-size: 12px; color: var(--vigie-slate); }
        .detail-stat-label { font-size: 11px; color: var(--vigie-slate); text-align: center; }
        .detail-taux-bar { margin-top: 4px; }
        .detail-taux-label { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .detail-taux-label strong { font-weight: 700; color: var(--vigie-ink); }
        .detail-taux-note {
          display: flex; align-items: flex-start; gap: 6px;
          margin-top: 10px; font-size: 12px; color: var(--vigie-slate); line-height: 1.5;
        }
        .detail-source { font-size: 11px; color: var(--vigie-slate); margin-top: 10px; }
        .detail-status-label { font-size: 13px; font-weight: 600; color: var(--vigie-slate); display: block; margin-bottom: 8px; }
        .detail-status-select {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e4e5ef; border-radius: var(--radius-button);
          background: var(--vigie-white); color: var(--vigie-ink); font-size: 14px; cursor: pointer;
        }
        .detail-login-cta { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .detail-cta-icon { color: var(--vigie-blue); }
        .detail-login-cta h3 { font-size: 16px; font-weight: 700; color: var(--vigie-ink); margin: 0; }
        .detail-login-cta p { font-size: 13px; color: var(--vigie-slate); }
        .detail-location { font-size: 13px; color: var(--vigie-slate); line-height: 1.8; }
        .detail-source-box {
          display: flex; align-items: flex-start; gap: 7px;
          font-size: 11px; color: var(--vigie-slate); line-height: 1.5; padding: 10px 0;
        }
        .detail-error {
          display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
          padding: 32px; background: var(--vigie-white);
          border: 1px solid #e4e5ef; border-radius: var(--radius-card); max-width: 500px;
        }
        .detail-error strong { font-size: 16px; color: var(--vigie-ink); }
        .detail-error p { font-size: 13px; color: var(--vigie-slate); }
        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr; }
          .detail-aside { position: static; }
        }
      `}</style>
    </div>
  )
}
