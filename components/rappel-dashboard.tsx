'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Search, ArrowRight, Bookmark, Check, CircleAlert, ShieldCheck,
  ExternalLink, Filter, Utensils, Activity,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
export type Recall = {
  id: number
  date_publication: string
  numero_fiche: string
  categorie_produit: string
  sous_categorie_produit: string
  marque_produit: string
  libelle: string
  modeles_ou_references: string
  motif_rappel: string
  risques_encourus: string
  zone_geographique_de_vente: string
  conduites_a_tenir_par_le_consommateur: string
  lien_vers_la_fiche_rappel: string
  liens_vers_les_images: string
  identification_produits: string[]
}
export type RecallResponse = {
  total: number
  results: Recall[]
  updatedAt: string
  error?: string
}

// ── Utils ────────────────────────────────────────────────────
export const fetcher = async (url: string): Promise<RecallResponse> => {
  const r = await fetch(url)
  if (!r.ok) throw new Error('La source officielle ne répond pas.')
  return r.json()
}
export const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(value))
    : 'Date inconnue'
export const titleOf = (item: Recall) =>
  item.libelle || item.modeles_ou_references?.split('¤')[0] || item.marque_produit || 'Produit rappelé'
export const riskLabel = (item: Recall) =>
  item.risques_encourus?.split('(')[0]?.trim() || item.motif_rappel?.split('.')[0] || 'Risque à vérifier'

function getCategoryColor(cat?: string): string {
  const c = (cat || '').toLocaleLowerCase('fr')
  if (c.includes('alimentation')) return 'orange'
  if (c.includes('cosmétique') || c.includes('hygiène')) return 'mint'
  if (c.includes('jouet') || c.includes('équipement') || c.includes('appareils')) return 'violet'
  return 'orange'
}

const CATEGORIES = ['Tout voir', 'Alimentation', 'Hygiène', 'Équipement', 'Maison']
const CATEGORY_MATCH: Record<string, string[]> = {
  Alimentation: ['alimentation'],
  Hygiène: ['cosmétiques', "produits d'hygiène", "produits d'hygiene"],
  Équipement: ['appareils électriques', 'équipement', 'jouets'],
  Maison: ['ameublement', 'outillage', 'maison'],
}

// ── RecallsSection ───────────────────────────────────────────
export function RecallsSection({ compact = false }: { compact?: boolean }) {
  const [query, setQuery]       = useState('')
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('Tout voir')
  const [tracked, setTracked]   = useState<number[]>([])

  const { data, error, isLoading, mutate } = useSWR<RecallResponse>(
    `/api/recalls${search ? `?q=${encodeURIComponent(search)}` : ''}`,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false }
  )

  const records = data?.results ?? []
  const visible = useMemo(
    () => records.filter(item =>
      category === 'Tout voir' ||
      (CATEGORY_MATCH[category] ?? []).some(word =>
        (item.categorie_produit || '').toLocaleLowerCase('fr').includes(word)
      )
    ),
    [records, category]
  )

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSearch(query.trim())
  }
  function toggleTracked(id: number) {
    setTracked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const limit = compact ? 6 : 8

  return (
    <div className="recalls-wrap">
      {/* Search */}
      <form className="recalls-search" onSubmit={submitSearch}>
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Rechercher un produit, une marque ou un code-barres"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un produit, une marque, un code-barres…"
        />
        <button type="submit" className="btn btn-primary">
          Rechercher <ArrowRight size={15} />
        </button>
      </form>

      {/* Filters */}
      <div className="recalls-filters">
        <div className="recalls-chips" role="group" aria-label="Filtrer par catégorie">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`recalls-chip${category === cat ? ' active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="recalls-count">
          <Filter size={13} aria-hidden="true" />
          {visible.length} résultat{visible.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Results */}
      {error ? (
        <div className="recalls-state error">
          <CircleAlert size={18} />
          <span>La connexion à la base officielle est momentanément indisponible.</span>
          <button onClick={() => mutate()} className="btn btn-outline">Réessayer</button>
        </div>
      ) : isLoading ? (
        <div className="recalls-loading">
          <div className="recalls-skeleton" />
          <div className="recalls-skeleton" style={{ width: '80%' }} />
          <div className="recalls-skeleton" style={{ width: '60%' }} />
        </div>
      ) : visible.length === 0 ? (
        <div className="recalls-state empty">
          <Search size={20} aria-hidden="true" />
          <strong>Aucun rappel dans cette catégorie</strong>
          <span>Essayez un autre filtre ou une autre recherche.</span>
        </div>
      ) : (
        <div className="recalls-list">
          {visible.slice(0, limit).map(item => (
            <article key={item.id} className="recall-card card">
              <div className={`recall-icon tile-icon ${getCategoryColor(item.categorie_produit)}`}>
                <Utensils size={18} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="recall-body">
                <div className="recall-tags">
                  <span className="recall-cat">{item.categorie_produit || 'Produit'}</span>
                  <span className="recall-ref">N° {item.numero_fiche || item.id}</span>
                </div>
                <h3>{titleOf(item)}</h3>
                <div className="recall-brand">
                  {item.marque_produit || 'Marque non précisée'}
                  <span>·</span>
                  {item.zone_geographique_de_vente || 'Zone non précisée'}
                </div>
                <div className="recall-risk">
                  <span className="risk-dot" aria-hidden="true" />
                  {riskLabel(item)}
                </div>
              </div>
              <div className="recall-meta">
                <span className="recall-date">{formatDate(item.date_publication)}</span>
                <div className="recall-actions">
                  <button
                    className={`recall-save${tracked.includes(item.id) ? ' saved' : ''}`}
                    onClick={() => toggleTracked(item.id)}
                    aria-label={tracked.includes(item.id) ? 'Retirer du suivi' : 'Ajouter au suivi'}
                    aria-pressed={tracked.includes(item.id)}
                  >
                    {tracked.includes(item.id)
                      ? <Check size={16} />
                      : <Bookmark size={16} />
                    }
                  </button>
                  <a
                    href={item.lien_vers_la_fiche_rappel || 'https://rappel.conso.gouv.fr'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                  >
                    Détails <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Footnote */}
      <div className="recalls-footnote">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>
          Source officielle : DGCCRF — Direction générale de la concurrence, de la consommation et
          de la répression des fraudes.
        </span>
        <a href="https://rappel.conso.gouv.fr" target="_blank" rel="noreferrer">
          Vérifier à la source <ExternalLink size={11} />
        </a>
      </div>

      <style>{`
        .recalls-wrap { display: flex; flex-direction: column; gap: 0; }

        /* Search */
        .recalls-search {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          padding: 0 10px 0 16px;
          background: var(--vigie-white);
          border: 1.5px solid #e4e5ef;
          border-radius: var(--radius-button);
          color: var(--vigie-slate);
          margin-bottom: 12px;
        }
        .recalls-search input {
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14px;
          color: var(--vigie-ink);
        }
        .recalls-search input::placeholder { color: #a0a8b8; }
        .recalls-search .btn { font-size: 13px; padding: 8px 14px; height: 36px; }
        .recalls-search:focus-within {
          border-color: var(--vigie-electric);
          box-shadow: 0 0 0 3px rgb(36 36 245 / 10%);
        }

        /* Filters */
        .recalls-filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .recalls-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .recalls-chip {
          padding: 7px 14px;
          border-radius: 10px;
          border: 1.5px solid #e4e5ef;
          background: var(--vigie-white);
          color: var(--vigie-slate);
          font-size: 13px;
          font-weight: 600;
          transition: all var(--motion-fast);
          cursor: pointer;
        }
        .recalls-chip:hover { border-color: var(--vigie-electric); color: var(--vigie-blue); }
        .recalls-chip.active {
          border-color: var(--vigie-electric);
          background: var(--vigie-lavender);
          color: var(--vigie-blue);
        }
        .recalls-count {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--vigie-slate);
          white-space: nowrap;
        }

        /* States */
        .recalls-state {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px;
          border-radius: var(--radius-card);
          background: var(--vigie-white);
          border: 1px solid #e4e5ef;
          font-size: 14px;
        }
        .recalls-state.error { color: #8c0010; }
        .recalls-state.empty { flex-direction: column; justify-content: center; min-height: 100px; }
        .recalls-state.empty strong { font-size: 15px; color: var(--vigie-ink); }
        .recalls-state.empty span { font-size: 13px; color: var(--vigie-slate); }

        .recalls-loading {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          background: var(--vigie-white);
          border-radius: var(--radius-card);
          border: 1px solid #e4e5ef;
        }
        .recalls-skeleton {
          height: 20px;
          width: 100%;
          border-radius: 6px;
          background: linear-gradient(90deg, #edeef5 25%, #f5f6fa 50%, #edeef5 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s ease infinite;
        }

        /* Cards list */
        .recalls-list { display: flex; flex-direction: column; gap: 10px; }
        .recall-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          transition: transform var(--motion-fast), box-shadow var(--motion-fast);
        }
        .recall-card:hover { transform: translateY(-2px); }
        .recall-icon { width: 44px; height: 44px; }
        .recall-body { flex: 1; min-width: 0; }
        .recall-tags { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .recall-cat { font-size: 11px; color: var(--vigie-slate); text-transform: capitalize; }
        .recall-ref { font-size: 11px; color: #a0a8b8; }
        .recall-body h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--vigie-ink);
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .recall-brand {
          font-size: 12px;
          color: var(--vigie-slate);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .recall-brand span { margin: 0 5px; color: #c0c4d0; }
        .recall-risk {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 6px;
          font-size: 12px;
          color: #805000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .risk-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--vigie-orange);
          flex-shrink: 0;
        }
        .recall-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .recall-date { font-size: 12px; color: var(--vigie-slate); white-space: nowrap; }
        .recall-actions { display: flex; align-items: center; gap: 8px; }
        .recall-save {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid #e4e5ef;
          background: var(--vigie-white);
          color: var(--vigie-slate);
          transition: all var(--motion-fast);
        }
        .recall-save:hover { border-color: var(--vigie-blue); color: var(--vigie-blue); }
        .recall-save.saved {
          border-color: var(--vigie-mint);
          background: #e0faf4;
          color: #0e7a5e;
        }
        .recall-actions .btn { font-size: 12px; padding: 8px 12px; }

        /* Footnote */
        .recalls-footnote {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          font-size: 11px;
          color: var(--vigie-slate);
        }
        .recalls-footnote svg { flex-shrink: 0; color: var(--vigie-mint); }
        .recalls-footnote a {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
          color: var(--vigie-blue);
          font-weight: 600;
          white-space: nowrap;
        }

        @media (max-width: 780px) {
          .recalls-search { height: 44px; }
          .recall-card { padding: 12px 14px; gap: 10px; }
          .recall-body h3 { font-size: 13px; }
          .recall-actions .btn { padding: 6px 10px; font-size: 11px; }
          .recall-save { width: 32px; height: 32px; }
        }
      `}</style>
    </div>
  )
}

// ── RappelDashboard (kept for backward compat) ───────────────
export function RappelDashboard() {
  return (
    <div className="page-content">
      <div className="page-head">
        <div>
          <div className="eyebrow">Veille actualités</div>
          <h1>Rappels produits</h1>
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
      <RecallsSection />
    </div>
  )
}
