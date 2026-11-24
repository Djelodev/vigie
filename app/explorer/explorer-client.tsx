'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, RotateCcw, Heart, Check, Info } from 'lucide-react'
import { useToast } from '@/components/Toast'

type Course = {
  id: number; title: string; school: string; city: string;
  type: string; duration: string; rate: number; tags: string;
}

const COURSES: Course[] = [
  { id: 1, title: 'BUT Informatique',        school: 'IUT — établissement démo A',        city: 'Paris',    type: 'BUT',     duration: '3 ans', rate: 64, tags: 'Développement · Réseaux' },
  { id: 2, title: 'Licence Informatique',    school: 'Université — établissement démo B', city: 'Lyon',     type: 'Licence', duration: '3 ans', rate: 78, tags: 'Algorithmique · Mathématiques' },
  { id: 3, title: 'BTS SIO',                 school: 'Lycée — établissement démo C',      city: 'Toulouse', type: 'BTS',     duration: '2 ans', rate: 53, tags: 'Services informatiques · Cyber' },
  { id: 4, title: 'BUT Réseaux & Télécoms',  school: 'IUT — établissement démo D',        city: 'Toulouse', type: 'BUT',     duration: '3 ans', rate: 71, tags: 'Cloud · Télécommunications' },
]

export function ExplorerClient() {
  const [query,   setQuery]   = useState('')
  const [type,    setType]    = useState('')
  const [city,    setCity]    = useState('')
  const [saved,   setSaved]   = useState<number[]>([1, 2])
  const [compare, setCompare] = useState<number[]>([1, 2])
  const { toast } = useToast()

  const results = COURSES.filter(c =>
    [c.title, c.school, c.city, c.tags].join(' ').toLowerCase().includes(query.toLowerCase()) &&
    (!type || c.type === type) &&
    (!city || c.city === city)
  )

  function toggleSaved(id: number) {
    const adding = !saved.includes(id)
    setSaved(prev => adding ? [...prev, id] : prev.filter(x => x !== id))
    toast(adding ? 'Formation ajoutée à tes choix !' : 'Formation retirée de tes choix.', adding ? 'success' : 'default')
  }
  function toggleCompare(id: number) {
    if (compare.includes(id)) {
      setCompare(prev => prev.filter(x => x !== id))
      toast('Formation retirée de la comparaison.')
    } else if (compare.length < 2) {
      setCompare(prev => [...prev, id])
      toast('Formation ajoutée à la comparaison.', 'success')
    } else {
      toast('Retire une formation pour en comparer une autre.', 'error')
    }
  }

  return (
    <div className="page-content explorer-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Découvrir</div>
          <h1>Explore les formations</h1>
          <p>Recherche par domaine, type de diplôme ou ville.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="explorer-filters">
        <label className="explorer-search-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Informatique, réseau, ville…"
            aria-label="Rechercher une formation"
          />
        </label>
        <label className="explorer-select-wrap">
          <select value={type} onChange={e => setType(e.target.value)} aria-label="Type de diplôme">
            <option value="">Tous les diplômes</option>
            {['BUT', 'Licence', 'BTS'].map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="explorer-select-wrap">
          <select value={city} onChange={e => setCity(e.target.value)} aria-label="Ville">
            <option value="">Toutes les villes</option>
            {['Paris', 'Lyon', 'Toulouse'].map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <button
          className="btn btn-outline"
          onClick={() => { setQuery(''); setType(''); setCity('') }}
          aria-label="Réinitialiser les filtres"
        >
          <RotateCcw size={15} /> Réinitialiser
        </button>
      </div>

      {/* Results header */}
      <div className="explorer-results-head">
        <strong>{results.length} formation{results.length !== 1 ? 's' : ''} de démonstration</strong>
        <Link href="/comparer" className="btn btn-text">
          Comparer ({compare.length}/2) <ArrowRight size={14} />
        </Link>
      </div>

      {/* Grid */}
      {results.length === 0 ? (
        <div className="explorer-empty">
          <Search size={24} />
          <strong>Aucun résultat</strong>
          <p>Essaie une autre recherche ou enlève un filtre.</p>
          <button className="btn btn-secondary" onClick={() => { setQuery(''); setType(''); setCity('') }}>
            Réinitialiser
          </button>
        </div>
      ) : (
        <div className="course-grid">
          {results.map(c => (
            <article key={c.id} className="course-card card">
              <div className="course-card-top">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 10 10-5 10 5-10 5-10-5zm4 2v5c3 3 9 3 12 0v-5m4-2v6"/></svg>
                </div>
                <div className="course-card-title">
                  <h3>{c.title}</h3>
                  <div className="course-school">{c.school}</div>
                </div>
                <button
                  className={`recall-save${saved.includes(c.id) ? ' saved' : ''}`}
                  onClick={() => toggleSaved(c.id)}
                  aria-label={`${saved.includes(c.id) ? 'Retirer des' : 'Ajouter aux'} choix : ${c.title}`}
                  aria-pressed={saved.includes(c.id)}
                >
                  <Heart size={16} fill={saved.includes(c.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="course-meta-row">
                <span className="course-loc">{c.city} · {c.duration}</span>
                <span className="badge badge-blue">{c.type}</span>
              </div>
              <p className="course-tags">{c.tags}</p>

              <div className="course-rate">
                <div className="course-rate-row">
                  <span>Taux d&apos;accès historique (2025, démo)</span>
                  <strong>{c.rate} %</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${c.rate}%` }} />
                </div>
              </div>

              <div className="course-actions">
                <button className="btn btn-primary" style={{ flex: 1 }}>
                  Voir la fiche
                </button>
                <button
                  className={`btn ${compare.includes(c.id) ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => toggleCompare(c.id)}
                  style={{ flex: 1 }}
                >
                  {compare.includes(c.id) ? <><Check size={14} /> À comparer</> : 'Comparer'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="dash-tip" style={{ marginTop: 20 }}>
        <Info size={16} />
        <span>Les taux sont des exemples historiques fictifs, pas une estimation de tes chances d&apos;admission.</span>
      </div>

      <footer className="page-footer">
        Vigie · Assistant indépendant d&apos;orientation. Données fictives.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">Consulter Parcoursup</a>.
      </footer>

      <style>{`
        .explorer-filters {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 10px;
          margin-bottom: 16px;
          align-items: center;
        }
        .explorer-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          height: 46px;
          background: var(--vigie-white);
          border: 1.5px solid #e4e5ef;
          border-radius: var(--radius-button);
          color: var(--vigie-slate);
        }
        .explorer-search-wrap:focus-within {
          border-color: var(--vigie-electric);
          box-shadow: 0 0 0 3px rgb(36 36 245 / 10%);
        }
        .explorer-search-wrap input {
          border: 0; outline: 0; background: transparent; font-size: 14px;
          color: var(--vigie-ink); flex: 1;
        }
        .explorer-search-wrap input::placeholder { color: #a0a8b8; }
        .explorer-select-wrap select {
          height: 46px;
          padding: 0 14px;
          border: 1.5px solid #e4e5ef;
          border-radius: var(--radius-button);
          background: var(--vigie-white);
          color: var(--vigie-ink);
          font-size: 14px;
          cursor: pointer;
          appearance: auto;
        }
        .explorer-results-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          font-size: 14px;
          color: var(--vigie-ink);
        }
        .course-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .course-card { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
        .course-card-top { display: flex; align-items: flex-start; gap: 12px; }
        .course-card-title { flex: 1; min-width: 0; }
        .course-card-title h3 { font-size: 16px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .course-school { font-size: 12px; color: var(--vigie-slate); }
        .course-meta-row { display: flex; align-items: center; justify-content: space-between; }
        .course-loc { font-size: 13px; color: var(--vigie-slate); }
        .course-tags { font-size: 13px; color: var(--vigie-slate); }
        .course-rate {}
        .course-rate-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; color: var(--vigie-slate); }
        .course-rate-row strong { color: var(--vigie-ink); font-weight: 700; }
        .course-actions { display: flex; gap: 10px; }
        .explorer-empty {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 48px 24px; background: var(--vigie-white);
          border: 1px solid #e4e5ef; border-radius: var(--radius-card);
          color: var(--vigie-slate);
        }
        .explorer-empty strong { font-size: 16px; color: var(--vigie-ink); }
        @media (max-width: 1100px) {
          .explorer-filters { grid-template-columns: 1fr 1fr; }
          .explorer-search-wrap { grid-column: 1 / -1; }
        }
        @media (max-width: 780px) {
          .explorer-filters { grid-template-columns: 1fr; }
          .course-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
