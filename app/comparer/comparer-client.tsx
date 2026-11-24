'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, X, Info, Loader2, AlertCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useToast } from '@/components/Toast'
import { useCurrentUser } from '@/lib/hooks'
import type { Formation } from '@/lib/parcoursup'

const COLORS = ['#2424F5', '#7542F5', '#14C8A0', '#F59E0B']

export function ComparerClient() {
  const [ids,       setIds]       = useState<string[]>([])
  const [formations, setFormations] = useState<Record<string, Formation>>({})
  const [loading,   setLoading]   = useState<Record<string, boolean>>({})
  const [error,     setError]     = useState('')
  const { isLoggedIn } = useCurrentUser()
  const { toast } = useToast()

  // Chargement initial : depuis serveur si connecté, sinon sessionStorage
  useEffect(() => {
    async function loadSelection() {
      let selection: string[] = []

      if (isLoggedIn) {
        try {
          const res = await fetch('/api/comparer')
          const data = await res.json()
          selection = data.selection || []
        } catch {}
      }

      // Fallback sessionStorage (non-connectés ou complément)
      if (selection.length === 0) {
        try {
          selection = JSON.parse(sessionStorage.getItem('vigie_compare') || '[]')
        } catch {}
      }

      setIds(selection)
    }
    loadSelection()
  }, [isLoggedIn])

  // Charger les données de chaque formation
  useEffect(() => {
    for (const id of ids) {
      if (formations[id] || loading[id]) continue
      setLoading(prev => ({ ...prev, [id]: true }))
      fetch(`/api/formations/${encodeURIComponent(id)}`)
        .then(r => r.json())
        .then(data => {
          if (data.formation) {
            setFormations(prev => ({ ...prev, [id]: data.formation }))
          }
        })
        .catch(() => {})
        .finally(() => setLoading(prev => ({ ...prev, [id]: false })))
    }
  }, [ids]) // eslint-disable-line react-hooks/exhaustive-deps

  function remove(id: string) {
    const newIds = ids.filter(x => x !== id)
    setIds(newIds)
    sessionStorage.setItem('vigie_compare', JSON.stringify(newIds))
    if (isLoggedIn) {
      fetch('/api/comparer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: newIds }),
      })
    }
    toast('Formation retirée de la comparaison.')
  }

  const list = ids.map(id => formations[id]).filter(Boolean)
  const anyLoading = ids.some(id => loading[id])

  // Données graphique : taux d'accès
  const chartData = list.length > 0 ? [{
    metric: 'Taux d\'accès %',
    ...Object.fromEntries(list.map(f => [f.nom.slice(0, 20) + '…', f.tauxAcces])),
  }] : []

  // Données graphique : candidatures vs admis
  const candChart = list.map(f => ({
    name: f.nom.length > 25 ? f.nom.slice(0, 22) + '…' : f.nom,
    'Candidatures': f.voeux,
    'Admis':        f.admis,
  }))

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Comprendre</div>
          <h1>Compare tes options</h1>
          <p>Regarde les critères côte à côte, sans classement imposé. {ids.length}/4 formations.</p>
        </div>
        {ids.length < 4 && (
          <Link href="/explorer" className="btn btn-outline">
            Ajouter une formation <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {ids.length === 0 ? (
        <div className="comparer-empty card">
          <strong>Choisis des formations à comparer</strong>
          <p>Va dans Explorer, recherche des formations Parcoursup et clique sur « Comparer ».</p>
          <Link href="/explorer" className="btn btn-primary">Explorer <ArrowRight size={15} /></Link>
        </div>
      ) : (
        <>
          {anyLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', color: 'var(--vigie-slate)', fontSize: 14 }}>
              <Loader2 size={18} className="spin" />
              <span>Chargement des données Parcoursup…</span>
            </div>
          )}

          {/* Cartes de comparaison */}
          <div className="comparer-grid" style={{ gridTemplateColumns: `repeat(${Math.min(ids.length, 2)}, 1fr)` }}>
            {ids.map((id, i) => {
              const f = formations[id]
              if (loading[id]) return (
                <div key={id} className="card comparer-card">
                  <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '50%' }} />
                </div>
              )
              if (!f) return null
              return (
                <div key={id} className="card comparer-card">
                  <div className="comparer-card-top">
                    <div className="tile-icon">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 10 10-5 10 5-10 5-10-5zm4 2v5c3 3 9 3 12 0v-5m4-2v6"/></svg>
                    </div>
                    <div>
                      <h3 title={f.nom}>{f.nom.length > 40 ? f.nom.slice(0, 37) + '…' : f.nom}</h3>
                      <div className="comparer-school">{f.etablissement}</div>
                    </div>
                    <button className="icon-btn" onClick={() => remove(id)} aria-label={`Retirer ${f.nom} de la comparaison`}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="comparer-color-bar" style={{ background: COLORS[i] }} />
                  {[
                    ['Ville',           f.ville],
                    ['Région',          f.region],
                    ['Filière',         f.filiere],
                    ['Statut',          f.statut === 'public' ? 'Public' : 'Privé'],
                    ['Sélectivité',     f.selectivite === 'selective' ? 'Sélective' : 'Non sélective'],
                    ['Capacité',        f.capacite > 0 ? `${f.capacite} places` : '—'],
                    ['Vœux totaux',     f.voeux > 0 ? f.voeux.toLocaleString('fr-FR') : '—'],
                    ['Admis',           f.admis > 0 ? f.admis.toLocaleString('fr-FR') : '—'],
                    ['Taux d\'accès',   f.tauxAcces > 0 ? `${f.tauxAcces} %` : '—'],
                    ['% femmes admises', f.pctFemmes > 0 ? `${f.pctFemmes} %` : '—'],
                    ['% bac général',   f.pctBacGen > 0 ? `${f.pctBacGen} %` : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="comparer-metric">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                  {f.lienParcoursup && (
                    <a href={f.lienParcoursup} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ marginTop: 8 }}>
                      Fiche officielle
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {/* Graphique taux d'accès */}
          {list.filter(f => f.tauxAcces > 0).length > 0 && (
            <div className="card comparer-chart-panel">
              <div className="comparer-chart-head">
                <div>
                  <h2>Taux d&apos;accès comparé</h2>
                  <p>Source officielle Parcoursup 2025 · Échelle 0–100 %</p>
                </div>
                <span className="badge badge-mint">Données officielles 2025</span>
              </div>
              <div className="comparer-legend">
                {list.map((f, i) => (
                  <span key={f.id} className="comparer-legend-item">
                    <span className="comparer-legend-dot" style={{ background: COLORS[i] }} />
                    {f.nom.length > 30 ? f.nom.slice(0, 27) + '…' : f.nom}
                  </span>
                ))}
              </div>
              <div style={{ height: 220, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={list.map(f => ({ name: f.nom.slice(0, 15) + '…', value: f.tauxAcces, fill: COLORS[list.indexOf(f)] }))}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="#edeef5" strokeDasharray="3 4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#62657B', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#62657B', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #e4e5ef', borderRadius: 12, fontSize: 12 }}
                      formatter={(v) => [`${v} %`, 'Taux d\'accès']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}
                         fill="#2424F5"
                         label={{ position: 'top', formatter: (v: number) => `${v}%`, fontSize: 11 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Graphique candidatures vs admis */}
          {list.filter(f => f.voeux > 0).length > 0 && (
            <div className="card comparer-chart-panel" style={{ marginTop: 16 }}>
              <div className="comparer-chart-head">
                <div>
                  <h2>Candidatures vs Admis</h2>
                  <p>Données officielles Parcoursup 2025</p>
                </div>
              </div>
              <div style={{ height: 240, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={candChart} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                    <CartesianGrid vertical={false} stroke="#edeef5" strokeDasharray="3 4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#62657B', fontSize: 11 }} angle={-15} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#62657B', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #e4e5ef', borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="Candidatures" fill="#2424F5" radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar dataKey="Admis"        fill="#14C8A0" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="dash-tip" style={{ marginTop: 12 }}>
            <Info size={15} />
            <span>
              Un taux d&apos;accès historique ne prédit pas ton admission individuelle.
              Il ne tient pas compte de ton profil, de ton dossier ni des variations annuelles.
              Source : Ministère de l&apos;Enseignement supérieur et de la Recherche — Parcoursup 2025.
            </span>
          </div>
        </>
      )}

      <footer className="page-footer">
        Vigie · Données officielles Parcoursup 2025.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">Consulter Parcoursup</a>.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .comparer-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 48px 24px; text-align: center;
        }
        .comparer-empty strong { font-size: 18px; color: var(--vigie-ink); }
        .comparer-empty p { color: var(--vigie-slate); }
        .comparer-grid { display: grid; gap: 16px; margin-bottom: 20px; }
        .comparer-card { padding: 24px; display: flex; flex-direction: column; gap: 0; }
        .comparer-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
        .comparer-card-top h3 { font-size: 15px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .comparer-school { font-size: 12px; color: var(--vigie-slate); }
        .comparer-card-top .icon-btn { margin-left: auto; }
        .comparer-color-bar { height: 3px; border-radius: 2px; margin-bottom: 16px; }
        .comparer-metric {
          display: flex; justify-content: space-between; align-items: center;
          padding: 11px 0; border-bottom: 1px solid #f0f1f8; font-size: 13px;
          color: var(--vigie-slate);
        }
        .comparer-metric strong { color: var(--vigie-ink); font-weight: 700; }
        .comparer-chart-panel { padding: 24px; }
        .comparer-chart-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 16px; gap: 12px;
        }
        .comparer-chart-head h2 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .comparer-chart-head p { font-size: 13px; color: var(--vigie-slate); }
        .comparer-legend { display: flex; gap: 20px; margin-bottom: 4px; flex-wrap: wrap; }
        .comparer-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--vigie-slate); }
        .comparer-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        @media (max-width: 780px) {
          .comparer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
