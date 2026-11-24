'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, RotateCcw, Heart, Check, Info, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useCurrentUser } from '@/lib/hooks'
import type { Formation } from '@/lib/parcoursup'

const FILIERE_LABELS: Record<string, string> = {
  'BTS': 'BTS',
  'BUT': 'BUT',
  'Licence': 'Licence',
  'Classe préparatoire aux grandes écoles': 'CPGE',
  'CPGE': 'CPGE',
  'Ecole d\'Ingénieur': 'École d\'ingénieurs',
  'Formation de Commerce et Gestion': 'Commerce / Gestion',
  'Licence Pro': 'Licence Pro',
}

function getFiliereBadgeColor(filiere: string): string {
  if (filiere.includes('BUT') || filiere.includes('BTS')) return 'badge-blue'
  if (filiere.includes('Licence')) return 'badge-mint'
  if (filiere.includes('préparatoire') || filiere.includes('CPGE')) return 'badge-violet'
  if (filiere.includes('Ingénieur') || filiere.includes('Commerce')) return 'badge-orange'
  return 'badge-slate'
}

export function ExplorerClient() {
  const [query,       setQuery]       = useState('')
  const [inputVal,    setInputVal]    = useState('')
  const [filiere,     setFiliere]     = useState('')
  const [region,      setRegion]      = useState('')
  const [statut,      setStatut]      = useState('')
  const [selectivite, setSelectivite] = useState('')

  const [formations,  setFormations]  = useState<Formation[]>([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [fromCache,   setFromCache]   = useState(false)
  const [fetchedAt,   setFetchedAt]   = useState('')

  const [filieres,    setFilieres]    = useState<string[]>([])
  const [regions,     setRegions]     = useState<string[]>([])

  const [favorites,   setFavorites]   = useState<string[]>([])
  const [compareList, setCompareList] = useState<string[]>([])

  const { user, isLoggedIn } = useCurrentUser()
  const { toast } = useToast()
  const LIMIT = 12

  // Charger les filtres disponibles
  useEffect(() => {
    fetch('/api/formations/filters')
      .then(r => r.json())
      .then(data => {
        setFilieres(data.filieres || [])
        setRegions(data.regions || [])
      })
      .catch(() => {})
  }, [])

  // Charger les favoris si connecté
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => setFavorites((data.favorites || []).map((f: { cod_aff: string }) => f.cod_aff)))
      .catch(() => {})
  }, [isLoggedIn])

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(p * LIMIT) })
    if (query)       params.set('q',           query)
    if (filiere)     params.set('filiere',      filiere)
    if (region)      params.set('region',       region)
    if (statut)      params.set('statut',       statut)
    if (selectivite) params.set('selectivite',  selectivite)

    try {
      const res = await fetch(`/api/formations?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFormations(data.formations || [])
      setTotal(data.total || 0)
      setFromCache(data.fromCache || false)
      setFetchedAt(data.fetchedAt || '')
    } catch {
      setError('Impossible de joindre le service de données. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }, [query, filiere, region, statut, selectivite])

  useEffect(() => {
    setPage(0)
    fetchData(0)
  }, [query, filiere, region, statut, selectivite]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setQuery(inputVal.trim())
  }

  function resetFilters() {
    setInputVal('')
    setQuery('')
    setFiliere('')
    setRegion('')
    setStatut('')
    setSelectivite('')
  }

  async function toggleFavorite(formation: Formation) {
    if (!isLoggedIn) {
      toast('Connecte-toi pour sauvegarder des formations.', 'default')
      return
    }
    const isFav = favorites.includes(formation.id)
    if (isFav) {
      await fetch(`/api/favorites?codAff=${encodeURIComponent(formation.id)}`, { method: 'DELETE' })
      setFavorites(prev => prev.filter(id => id !== formation.id))
      toast('Formation retirée de tes choix.', 'default')
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codAff: formation.id }),
      })
      setFavorites(prev => [...prev, formation.id])
      toast('Formation ajoutée à tes choix !', 'success')
    }
  }

  function toggleCompare(id: string) {
    if (compareList.includes(id)) {
      setCompareList(prev => prev.filter(x => x !== id))
      toast('Formation retirée de la comparaison.')
    } else if (compareList.length >= 4) {
      toast('Tu peux comparer jusqu\'à 4 formations.', 'error')
    } else {
      setCompareList(prev => [...prev, id])
      toast('Formation ajoutée à la comparaison.', 'success')

      // Sauvegarder pour le comparateur
      const newList = [...compareList, id]
      if (isLoggedIn) {
        fetch('/api/comparer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selection: newList }),
        })
      }
      // Stockage local aussi pour les non-connectés
      sessionStorage.setItem('vigie_compare', JSON.stringify(newList))
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  function goPage(p: number) {
    setPage(p)
    fetchData(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-content explorer-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Découvrir</div>
          <h1>Explore les formations</h1>
          <p>Données officielles Parcoursup 2025 — {total > 0 ? `${total.toLocaleString('fr-FR')} formations` : 'chargement…'}</p>
        </div>
        {compareList.length > 0 && (
          <Link
            href="/comparer"
            className="btn btn-primary"
            onClick={() => sessionStorage.setItem('vigie_compare', JSON.stringify(compareList))}
          >
            Comparer ({compareList.length}) <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Barre de recherche */}
      <form className="explorer-filters" onSubmit={handleSearch}>
        <label className="explorer-search-wrap" style={{ gridColumn: '1 / -1' }}>
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Informatique, droit, médecine, Paris, Lyon…"
            aria-label="Rechercher une formation"
          />
          <button type="submit" className="btn btn-primary" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>
            Rechercher
          </button>
        </label>

        <label className="explorer-select-wrap">
          <select value={filiere} onChange={e => setFiliere(e.target.value)} aria-label="Filière">
            <option value="">Toutes les filières</option>
            {filieres.map(f => (
              <option key={f} value={f}>{FILIERE_LABELS[f] || f}</option>
            ))}
          </select>
        </label>

        <label className="explorer-select-wrap">
          <select value={region} onChange={e => setRegion(e.target.value)} aria-label="Région">
            <option value="">Toutes les régions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label className="explorer-select-wrap">
          <select value={statut} onChange={e => setStatut(e.target.value)} aria-label="Statut établissement">
            <option value="">Public et privé</option>
            <option value="public">Public</option>
            <option value="prive">Privé</option>
          </select>
        </label>

        <label className="explorer-select-wrap">
          <select value={selectivite} onChange={e => setSelectivite(e.target.value)} aria-label="Sélectivité">
            <option value="">Toutes</option>
            <option value="selective">Sélective</option>
            <option value="non_selective">Non sélective</option>
          </select>
        </label>

        <button
          type="button"
          className="btn btn-outline"
          onClick={resetFilters}
          aria-label="Réinitialiser les filtres"
        >
          <RotateCcw size={15} /> Réinitialiser
        </button>
      </form>

      {/* En-tête résultats */}
      <div className="explorer-results-head">
        <strong>
          {loading ? 'Chargement…' : `${total.toLocaleString('fr-FR')} résultat${total !== 1 ? 's' : ''}`}
          {fromCache && <span className="cache-badge">cache</span>}
        </strong>
        {fetchedAt && !fromCache && (
          <span className="sync-info">
            Données Parcoursup 2025 · Synchro {new Date(fetchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* État d'erreur */}
      {error && (
        <div className="explorer-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn btn-outline" onClick={() => fetchData(page)}>Réessayer</button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="explorer-loading">
          <Loader2 size={24} className="spin" />
          <span>Chargement des formations Parcoursup…</span>
        </div>
      )}

      {/* Résultats */}
      {!loading && !error && formations.length === 0 && (
        <div className="explorer-empty">
          <Search size={24} />
          <strong>Aucun résultat</strong>
          <p>Essaie une autre recherche ou enlève un filtre.</p>
          <button className="btn btn-secondary" onClick={resetFilters}>
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {!loading && !error && formations.length > 0 && (
        <>
          <div className="course-grid">
            {formations.map(f => (
              <article key={f.id} className="course-card card">
                <div className="course-card-top">
                  <div className="tile-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m2 10 10-5 10 5-10 5-10-5zm4 2v5c3 3 9 3 12 0v-5m4-2v6"/>
                    </svg>
                  </div>
                  <div className="course-card-title">
                    <h3 title={f.nom}>{f.nom.length > 60 ? f.nom.slice(0, 57) + '…' : f.nom}</h3>
                    <div className="course-school" title={f.etablissement}>
                      {f.etablissement.length > 50 ? f.etablissement.slice(0, 47) + '…' : f.etablissement}
                    </div>
                  </div>
                  <button
                    className={`recall-save${favorites.includes(f.id) ? ' saved' : ''}`}
                    onClick={() => toggleFavorite(f)}
                    aria-label={`${favorites.includes(f.id) ? 'Retirer des' : 'Ajouter aux'} choix : ${f.nom}`}
                    aria-pressed={favorites.includes(f.id)}
                  >
                    <Heart size={16} fill={favorites.includes(f.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="course-meta-row">
                  <span className="course-loc">{f.ville} · {f.region}</span>
                  <span className={`badge ${getFiliereBadgeColor(f.filiere)}`}>
                    {FILIERE_LABELS[f.filiere] || f.filiere}
                  </span>
                </div>

                <div className="course-tags-row">
                  <span className={`badge ${f.statut === 'public' ? 'badge-mint' : 'badge-orange'}`}>
                    {f.statut === 'public' ? 'Public' : 'Privé'}
                  </span>
                  {f.selectivite === 'selective' && (
                    <span className="badge badge-coral">Sélectif</span>
                  )}
                  <span className="course-capacite">
                    {f.capacite > 0 ? `${f.capacite} places` : ''}
                  </span>
                </div>

                {f.tauxAcces > 0 && (
                  <div className="course-rate">
                    <div className="course-rate-row">
                      <span>Taux d&apos;accès 2025</span>
                      <strong>{f.tauxAcces} %</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${f.tauxAcces}%` }} />
                    </div>
                  </div>
                )}

                <div className="course-actions">
                  <Link href={`/explorer/${encodeURIComponent(f.id)}`} className="btn btn-primary" style={{ flex: 1 }}>
                    Voir la fiche
                  </Link>
                  <button
                    className={`btn ${compareList.includes(f.id) ? 'btn-secondary' : 'btn-outline'}`}
                    onClick={() => toggleCompare(f.id)}
                    style={{ flex: 1 }}
                  >
                    {compareList.includes(f.id) ? <><Check size={14} /> Sélectionné</> : 'Comparer'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="explorer-pagination">
              <button
                className="btn btn-outline"
                onClick={() => goPage(page - 1)}
                disabled={page === 0}
                aria-label="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="pagination-info">
                Page {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-outline"
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <div className="dash-tip" style={{ marginTop: 20 }}>
        <Info size={16} />
        <span>
          Le taux d&apos;accès est une statistique officielle Parcoursup 2025.
          Il ne constitue pas une prédiction individuelle d&apos;admission.
          Source : {formations[0]?.sourceLabel || 'Ministère de l\'Enseignement supérieur et de la Recherche'}
        </span>
      </div>

      <footer className="page-footer">
        Vigie · Données officielles Parcoursup 2025.{' '}
        <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">Consulter Parcoursup</a>.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .explorer-filters {
          display: grid;
          grid-template-columns: 1fr auto auto auto auto;
          gap: 10px;
          margin-bottom: 16px;
          align-items: center;
        }
        .explorer-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 10px 0 14px;
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
          font-size: 13px;
          cursor: pointer;
          appearance: auto;
          max-width: 180px;
        }
        .explorer-results-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          font-size: 14px;
          color: var(--vigie-ink);
          flex-wrap: wrap;
          gap: 8px;
        }
        .sync-info { font-size: 12px; color: var(--vigie-slate); }
        .cache-badge {
          margin-left: 8px;
          font-size: 11px;
          background: #fff4d9;
          color: #805000;
          padding: 2px 7px;
          border-radius: 6px;
          font-weight: 600;
        }
        .course-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .course-card { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
        .course-card-top { display: flex; align-items: flex-start; gap: 12px; }
        .course-card-title { flex: 1; min-width: 0; }
        .course-card-title h3 { font-size: 15px; font-weight: 700; color: var(--vigie-ink); margin: 0 0 4px; }
        .course-school { font-size: 12px; color: var(--vigie-slate); }
        .course-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .course-tags-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .course-loc { font-size: 13px; color: var(--vigie-slate); }
        .course-capacite { font-size: 12px; color: var(--vigie-slate); margin-left: auto; }
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
        .explorer-loading {
          display: flex; align-items: center; gap: 14px;
          padding: 32px; color: var(--vigie-slate); font-size: 14px;
        }
        .explorer-error {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; background: #fff0f0;
          border: 1px solid #fcc; border-radius: 12px;
          color: #8c0010; font-size: 14px; margin-bottom: 16px;
        }
        .explorer-pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 16px; margin-top: 24px;
        }
        .pagination-info { font-size: 14px; color: var(--vigie-slate); }
        @media (max-width: 1100px) {
          .explorer-filters { grid-template-columns: 1fr 1fr 1fr; }
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
