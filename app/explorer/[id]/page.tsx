import { AppShell } from '@/components/AppShell'
import { FormationDetailClient } from './formation-detail-client'

export default async function FormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AppShell>
      <FormationDetailClient id={decodeURIComponent(id)} />
    </AppShell>
  )
}
