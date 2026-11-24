'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X, Info } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Course = {
  id: number; title: string; school: string; city: string;
  type: string; duration: string; rate: number; history: number[]; tags: string;
}

const COURSES: Course[] = [
  { id: 1, title: 'BUT Informatique',        school: 'IUT — établissement démo A',        city: 'Paris',    type: 'BUT',     duration: '3 ans', rate: 64, history: [58, 61, 64], tags: 'Développement · Réseaux' },
  { id: 2, title: 'Licence Informatique',    school: 'Université — établissement démo B', city: 'Lyon',     type: 'Licence', duration: '3 ans', rate: 78, history: [70, 74, 78], tags: 'Algorithmique · Mathématiques' },
  { id: 3, title: 'BTS SIO',                 school: 'Lycée — établissement démo C',      city: 'Toulouse', type: 'BTS',     duration: '2 ans', rate: 53, history: [47, 50, 53], tags: 'Services informatiques · Cyber' },
  { id: 4, title: 'BUT Réseaux & Télécoms',  school: 'IUT — établissement démo D',        city: 'Toulouse', type: 'BUT',     duration: '3 ans', rate: 71, history: [65, 69, 71], tags: 'Cloud · Télécommunications' },
]
const YEARS = ['2023', '2024', '2025']
const COLORS = ['#2424F5', '#7542F5']

export function ComparerClient() {
  const [selected, setSelected] = useState<number[]>([1, 2])

  const list = selected.map(id => COURSES.find(c => c.id === id)!)
  const chartData = YEARS.map((year, yi) => ({
    year,
    ...Object.fromEntries(list.map(c => [c.title, c.history[yi]])),
  }))

  function remove(id: number) {
    setSelected(prev => prev.filter(x => x !== id))
  }

  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Comprendre</div>
          <h1>Compare tes options</h1>
          <p>Regarde les critères côte à côte, sans classement imposé.</p>
        </div>
        <Link href="/explorer" className="btn btn-outline">
          Ajouter une formation <ArrowRight size={15} />
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="comparer-empty card">
          <strong>Choisis deux formations à comparer</strong>
          <p>Vas dans Explorer pour sélectionner des formations.</p>
          <Link href="/explorer" className="btn btn-primary">Explorer <ArrowRight size={15} /></Link>
        </div>
      ) : (
        <>
          <div className="comparer-grid">
            {list.map((c, i) => (
              <div key={c.id} className="card comparer-card">
                <div className="comparer-card-top">
                  <div className="tile-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 10 10-5 10 5-10 5-10-5zm4 2v5c3 3 9 3 12 0v-5m4-2v6"/></svg>
                  </div>
                  <div>
                    <h3>{c.title}</h3>
                    <div className="comparer-school">{c.school}</div>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => remove(c.id)}
                    aria-label={`Retirer ${c.title} de la comparaison`}
                  >
                    <X size={16} />
                  </button>
                </div>
                {[
                  ['Ville',     c.city],
                  ['Durée',     c.duration],
                  ['Diplôme',   c.type],
                  ['Taux 2025 · démo', `${c.rate} %`],
                ].map(([label, value]) => (
                  <div key={label} className="comparer-metric">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
                <p className="comparer-tags">{c.tags}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card comparer-chart-panel">
            <div className="comparer-chart-head">
              <div>
                <h2>Taux d&apos;accès historique</h2>
                <p>Échelle de 0 à 100 % · années 2023 à 2025</p>
              </div>
              <span className="badge badge-orange">Données fictives</span>
            </div>
            <div className="comparer-legend">
              {list.map((c, i) => (
                <span key={c.id} className="comparer-legend-item">
                  <span className="comparer-legend-dot" style={{ background: COLORS[i] }} />
                  {c.title}
                </span>
              ))}
            </div>
            <div style={{ height: 220, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#edeef5" strokeDasharray="3 4" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#62657B', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#62657B', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #e4e5ef', borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [`${v} %`]}
                  />
                  {list.map((c, i) => (
                    <Bar key={c.id} dataKey={c.title} fill={COLORS[i]} radius={[6, 6, 0, 0]} barSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="dash-tip" style={{ marginTop: 12 }}>
              <Info size={15} />
              <span>Un taux historique ne prédit pas ton admission. Il ne tient pas compte de ton dossier individuel.</span>
            </div>
          </div>
        </>
      )}

      <footer className="page-footer">
        Vigie · Données fictives.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">Consulter Parcoursup</a>.
      </footer>

      <style>{`
        .comparer-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 48px 24px; text-align: center;
        }
        .comparer-empty strong { font-size: 18px; color: var(--vigie-ink); }
        .comparer-empty p { color: var(--vigie-slate); }
        .comparer-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
        .comparer-card { padding: 24px; display: flex; flex-direction: column; gap: 0; }
        .comparer-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
        .comparer-card-top h3 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .comparer-school { font-size: 12px; color: var(--vigie-slate); }
        .comparer-card-top .icon-btn { margin-left: auto; }
        .comparer-metric {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 0; border-bottom: 1px solid #f0f1f8; font-size: 14px;
          color: var(--vigie-slate);
        }
        .comparer-metric strong { color: var(--vigie-ink); font-weight: 700; }
        .comparer-tags { font-size: 13px; color: var(--vigie-slate); margin-top: 12px; }
        .comparer-chart-panel { padding: 24px; }
        .comparer-chart-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 16px; gap: 12px;
        }
        .comparer-chart-head h2 { font-size: 18px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .comparer-chart-head p { font-size: 13px; color: var(--vigie-slate); }
        .comparer-legend { display: flex; gap: 20px; margin-bottom: 4px; flex-wrap: wrap; }
        .comparer-legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--vigie-slate); }
        .comparer-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        @media (max-width: 780px) {
          .comparer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
