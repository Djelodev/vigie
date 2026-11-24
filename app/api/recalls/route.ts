import { NextResponse } from 'next/server'

const API_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') ?? '').trim().slice(0, 100)
  const params = new URLSearchParams({ limit: '100', order_by: 'date_publication desc' })

  if (query) {
    const safeQuery = query.replace(/["\\]/g, ' ').replace(/[<>]/g, '')
    params.set('where', `search(*, "${safeQuery}")`)
  }

  try {
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'La source officielle est momentanément indisponible.' }, { status: 502 })
    }

    const payload = await response.json()
    return NextResponse.json({ total: payload.total_count ?? 0, results: payload.results ?? [], updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ error: 'Impossible de joindre RappelConso pour le moment.' }, { status: 503 })
  }
}
