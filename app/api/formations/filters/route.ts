/**
 * app/api/formations/filters/route.ts
 * Retourne les listes de valeurs disponibles pour les filtres.
 */
import { NextResponse } from 'next/server'
import { fetchFilieres, fetchRegions } from '@/lib/parcoursup'

export async function GET() {
  try {
    const [filieres, regions] = await Promise.all([fetchFilieres(), fetchRegions()])
    return NextResponse.json({ filieres, regions })
  } catch {
    return NextResponse.json({ filieres: [], regions: [] })
  }
}
