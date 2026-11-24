/**
 * app/api/formations/route.ts
 * Recherche de formations Parcoursup avec filtres et pagination.
 */
import { NextResponse } from 'next/server'
import { fetchFormations } from '@/lib/parcoursup'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const q           = (searchParams.get('q') || '').trim().slice(0, 100)
  const filiere     = (searchParams.get('filiere') || '').trim()
  const region      = (searchParams.get('region') || '').trim()
  const departement = (searchParams.get('dep') || '').trim()
  const ville       = (searchParams.get('ville') || '').trim()
  const statut      = searchParams.get('statut') as 'public' | 'prive' | '' || ''
  const selectivite = searchParams.get('selectivite') as 'selective' | 'non_selective' | '' || ''
  const limit       = Math.min(Number(searchParams.get('limit') || '20'), 100)
  const offset      = Math.max(Number(searchParams.get('offset') || '0'), 0)
  const orderBy     = searchParams.get('order_by') || 'taux_acces_ens desc'

  try {
    const result = await fetchFormations({ q, filiere, region, departement, ville, statut, selectivite, limit, offset, orderBy })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/formations]', err)
    return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
  }
}
