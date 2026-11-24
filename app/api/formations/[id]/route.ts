/**
 * app/api/formations/[id]/route.ts
 * Fiche détaillée d'une formation par son identifiant stable.
 */
import { NextResponse } from 'next/server'
import { fetchFormationById } from '@/lib/parcoursup'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 })

  try {
    const formation = await fetchFormationById(id)
    if (!formation) return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 })
    return NextResponse.json({ formation })
  } catch (err) {
    console.error('[/api/formations/[id]]', err)
    return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
  }
}
