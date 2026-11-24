/**
 * lib/parcoursup.ts
 * Couche d'accès aux données Parcoursup officielles.
 * Source : data.enseignementsup-recherche.gouv.fr — Licence Ouverte Etalab 2.0
 */

export const PARCOURSUP_DATASET = 'fr-esr-parcoursup'
export const PARCOURSUP_BASE_URL = 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1'
export const PARCOURSUP_SESSION = '2025'
export const DATA_SOURCE = 'Ministère de l\'Enseignement supérieur et de la Recherche — data.enseignementsup-recherche.gouv.fr'

// Champs officiels du dataset fr-esr-parcoursup (session 2025)
export interface ParcoursupRecord {
  // Identification
  cod_aff_form: string              // Identifiant stable de la formation
  session: string                   // Année de campagne (2025)
  cod_uai: string                   // Code UAI établissement
  g_ea_lib_vx: string               // Nom de l'établissement
  lib_for_voe_ins: string           // Libellé de la formation
  lib_comp_voe_ins: string          // Libellé complet
  detail_forma: string              // Détail de la formation
  detail_forma2: string | null      // Sous-détail

  // Type / filière
  fili: string                      // Filière (Licence, BTS, BUT, etc.)
  form_lib_voe_acc: string          // Type de formation (groupe)
  fil_lib_voe_acc: string           // Libellé filière accès
  select_form: string               // 'formation sélective' | 'formation non sélective'
  contrat_etab: string              // 'Public' | 'Privé...'

  // Localisation
  dep: string                       // Code département
  dep_lib: string                   // Nom département
  region_etab_aff: string           // Région
  acad_mies: string                 // Académie
  ville_etab: string                // Ville
  g_olocalisation_des_formations: { lon: number; lat: number } | null

  // Capacité
  capa_fin: number                  // Capacité d'accueil finale

  // Candidatures (vœux)
  voe_tot: number                   // Total vœux
  voe_tot_f: number                 // Dont femmes

  // Propositions & admis
  prop_tot: number                  // Total propositions
  acc_tot: number                   // Total admis
  acc_tot_f: number                 // Dont femmes

  // Taux
  taux_acces_ens: number            // Taux d'accès global (%)
  pct_f: number                     // % femmes parmi les admis
  pct_neobac: number                // % néo-bacheliers

  // Répartition bac
  pct_bg: number                    // % bac général
  pct_bt: number                    // % bac technologique
  pct_bp: number                    // % bac professionnel

  // Lien officiel
  lien_form_psup: string            // URL fiche Parcoursup
}

// Réponse normalisée pour l'application
export interface Formation {
  id: string               // cod_aff_form
  nom: string              // lib_for_voe_ins
  etablissement: string    // g_ea_lib_vx
  detail: string           // detail_forma
  filiere: string          // fili
  typeFormation: string    // form_lib_voe_acc
  selectivite: 'selective' | 'non_selective'
  statut: 'public' | 'prive'
  departement: string
  departementNom: string
  region: string
  academie: string
  ville: string
  coordonnees: { lat: number; lon: number } | null
  capacite: number
  voeux: number
  admis: number
  propositions: number
  tauxAcces: number       // taux_acces_ens officiel
  pctFemmes: number
  pctBacGen: number
  pctBacTech: number
  pctBacPro: number
  lienParcoursup: string
  session: string
  sourceLabel: string
}

// ── Normalisation ──────────────────────────────────────────────

export function normalizeRecord(r: ParcoursupRecord): Formation {
  return {
    id: r.cod_aff_form,
    nom: r.lib_for_voe_ins || r.lib_comp_voe_ins || 'Formation',
    etablissement: r.g_ea_lib_vx || '',
    detail: r.detail_forma || '',
    filiere: r.fili || '',
    typeFormation: r.form_lib_voe_acc || '',
    selectivite: r.select_form?.includes('non') ? 'non_selective' : 'selective',
    statut: (r.contrat_etab || '').toLowerCase().startsWith('public') ? 'public' : 'prive',
    departement: r.dep || '',
    departementNom: r.dep_lib || '',
    region: r.region_etab_aff || '',
    academie: r.acad_mies || '',
    ville: r.ville_etab || '',
    coordonnees: r.g_olocalisation_des_formations ?? null,
    capacite: r.capa_fin ?? 0,
    voeux: r.voe_tot ?? 0,
    admis: r.acc_tot ?? 0,
    propositions: r.prop_tot ?? 0,
    tauxAcces: r.taux_acces_ens ?? 0,
    pctFemmes: r.pct_f ?? 0,
    pctBacGen: r.pct_bg ?? 0,
    pctBacTech: r.pct_bt ?? 0,
    pctBacPro: r.pct_bp ?? 0,
    lienParcoursup: r.lien_form_psup || '',
    session: r.session || PARCOURSUP_SESSION,
    sourceLabel: `${DATA_SOURCE} · Session ${r.session || PARCOURSUP_SESSION}`,
  }
}

// ── Client API ─────────────────────────────────────────────────

interface FetchOptions {
  q?: string
  filiere?: string
  region?: string
  departement?: string
  ville?: string
  statut?: 'public' | 'prive' | ''
  selectivite?: 'selective' | 'non_selective' | ''
  limit?: number
  offset?: number
  orderBy?: string
}

interface FetchResult {
  total: number
  formations: Formation[]
  fetchedAt: string
  fromCache: boolean
}

/**
 * Construit la clause WHERE ODSQL pour l'API Parcoursup.
 * Toutes les valeurs utilisateur sont échappées.
 */
function buildWhere(opts: FetchOptions): string {
  const clauses: string[] = [`session = "${PARCOURSUP_SESSION}"`]

  if (opts.q) {
    // Échappement des guillemets dans la requête utilisateur
    const safe = opts.q.replace(/"/g, "'").slice(0, 100)
    clauses.push(`search(lib_comp_voe_ins, g_ea_lib_vx, ville_etab, fili, "${safe}")`)
  }
  if (opts.filiere) {
    const safe = opts.filiere.replace(/"/g, "'")
    clauses.push(`fili = "${safe}"`)
  }
  if (opts.region) {
    const safe = opts.region.replace(/"/g, "'")
    clauses.push(`region_etab_aff = "${safe}"`)
  }
  if (opts.departement) {
    const safe = opts.departement.replace(/"/g, "'")
    clauses.push(`dep = "${safe}"`)
  }
  if (opts.ville) {
    const safe = opts.ville.replace(/"/g, "'")
    clauses.push(`ville_etab like "%${safe}%"`)
  }
  if (opts.statut === 'public') {
    clauses.push(`contrat_etab = "Public"`)
  } else if (opts.statut === 'prive') {
    clauses.push(`contrat_etab != "Public"`)
  }
  if (opts.selectivite === 'selective') {
    clauses.push(`select_form = "formation sélective"`)
  } else if (opts.selectivite === 'non_selective') {
    clauses.push(`select_form = "formation non sélective"`)
  }

  return clauses.join(' AND ')
}

/**
 * Récupère les formations depuis l'API officielle avec retry.
 * En cas d'échec, retourne les données depuis le cache SQLite si disponible.
 */
export async function fetchFormations(opts: FetchOptions = {}): Promise<FetchResult> {
  const limit  = Math.min(opts.limit ?? 20, 100)
  const offset = opts.offset ?? 0
  const orderBy = opts.orderBy || 'taux_acces_ens desc'

  const params = new URLSearchParams({
    limit:    String(limit),
    offset:   String(offset),
    order_by: orderBy,
    where:    buildWhere(opts),
  })

  const url = `${PARCOURSUP_BASE_URL}/catalog/datasets/${PARCOURSUP_DATASET}/records?${params}`

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // Cache Next.js 1h
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = await res.json()
    const records: ParcoursupRecord[] = json.results ?? []

    return {
      total:      json.total_count ?? 0,
      formations: records.map(normalizeRecord),
      fetchedAt:  new Date().toISOString(),
      fromCache:  false,
    }
  } catch (err) {
    console.error('[Parcoursup] API error:', err)
    // Retour cache SQLite si disponible
    return fetchFromSqliteCache(opts, limit, offset)
  }
}

/**
 * Récupère une formation par son identifiant stable (cod_aff_form).
 */
export async function fetchFormationById(id: string): Promise<Formation | null> {
  const safe = id.replace(/[^0-9a-zA-Z_-]/g, '')
  if (!safe) return null

  const params = new URLSearchParams({
    limit: '1',
    where: `cod_aff_form = "${safe}" AND session = "${PARCOURSUP_SESSION}"`,
  })

  try {
    const res = await fetch(
      `${PARCOURSUP_BASE_URL}/catalog/datasets/${PARCOURSUP_DATASET}/records?${params}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const records: ParcoursupRecord[] = json.results ?? []
    if (records.length === 0) return null
    return normalizeRecord(records[0])
  } catch {
    // Essai cache SQLite
    try {
      const { db } = await import('./db')
      const row = db.prepare('SELECT data FROM parcoursup_cache WHERE cod_aff = ?').get(safe) as { data: string } | undefined
      if (row) return JSON.parse(row.data) as Formation
    } catch {}
    return null
  }
}

/**
 * Récupère les listes de valeurs uniques pour alimenter les filtres.
 */
export async function fetchFilieres(): Promise<string[]> {
  const params = new URLSearchParams({
    select:   'fili',
    group_by: 'fili',
    where:    `session = "${PARCOURSUP_SESSION}"`,
    order_by: 'fili asc',
    limit:    '100',
  })
  try {
    const res = await fetch(
      `${PARCOURSUP_BASE_URL}/catalog/datasets/${PARCOURSUP_DATASET}/records?${params}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return FILIERES_FALLBACK
    const json = await res.json()
    return (json.results as { fili: string }[]).map(r => r.fili).filter(Boolean).sort()
  } catch {
    return FILIERES_FALLBACK
  }
}

export async function fetchRegions(): Promise<string[]> {
  const params = new URLSearchParams({
    select:   'region_etab_aff',
    group_by: 'region_etab_aff',
    where:    `session = "${PARCOURSUP_SESSION}"`,
    order_by: 'region_etab_aff asc',
    limit:    '20',
  })
  try {
    const res = await fetch(
      `${PARCOURSUP_BASE_URL}/catalog/datasets/${PARCOURSUP_DATASET}/records?${params}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return REGIONS_FALLBACK
    const json = await res.json()
    return (json.results as { region_etab_aff: string }[]).map(r => r.region_etab_aff).filter(Boolean).sort()
  } catch {
    return REGIONS_FALLBACK
  }
}

// ── Cache SQLite (fallback) ────────────────────────────────────

async function fetchFromSqliteCache(opts: FetchOptions, limit: number, offset: number): Promise<FetchResult> {
  try {
    const { db } = await import('./db')
    // Récupération simple depuis le cache (toutes les formations en cache)
    const rows = db.prepare('SELECT data FROM parcoursup_cache LIMIT ? OFFSET ?').all(limit, offset) as { data: string }[]
    const formations = rows.map(r => JSON.parse(r.data) as Formation)
    const total = (db.prepare('SELECT COUNT(*) as c FROM parcoursup_cache').get() as { c: number }).c

    // Filtrage en mémoire si nécessaire
    const filtered = filterInMemory(formations, opts)
    return {
      total:      filtered.total,
      formations: filtered.formations.slice(0, limit),
      fetchedAt:  new Date().toISOString(),
      fromCache:  true,
    }
  } catch {
    return { total: 0, formations: [], fetchedAt: new Date().toISOString(), fromCache: true }
  }
}

function filterInMemory(formations: Formation[], opts: FetchOptions): { total: number; formations: Formation[] } {
  let results = formations
  if (opts.q) {
    const q = opts.q.toLowerCase()
    results = results.filter(f =>
      [f.nom, f.etablissement, f.ville, f.filiere, f.region].join(' ').toLowerCase().includes(q)
    )
  }
  if (opts.filiere) results = results.filter(f => f.filiere === opts.filiere)
  if (opts.region)  results = results.filter(f => f.region === opts.region)
  if (opts.statut)  results = results.filter(f => f.statut === opts.statut)
  if (opts.selectivite) results = results.filter(f => f.selectivite === opts.selectivite)
  return { total: results.length, formations: results }
}

// ── Fallbacks statiques ────────────────────────────────────────

export const FILIERES_FALLBACK = [
  'BTS', 'BUT', 'Classe préparatoire aux grandes écoles', 'CPGE',
  'Ecole d\'Ingénieur', 'Formation de Commerce et Gestion',
  'Licence', 'Licence Pro', 'PASS', 'Sciences Po',
]

export const REGIONS_FALLBACK = [
  'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
  'Centre-Val de Loire', 'Corse', 'Grand-Est', 'Guadeloupe',
  'Guyane', 'Hauts-de-France', 'Île-de-France',
  'La Réunion', 'Martinique', 'Mayotte',
  'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur',
]
