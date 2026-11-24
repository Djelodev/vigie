import { FormationDetailClient } from './formation-detail-client'

export default async function FormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FormationDetailClient id={decodeURIComponent(id)} />
}
