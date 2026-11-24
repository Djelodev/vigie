import type { Metadata } from 'next'
import { MesChoixClient } from './mes-choix-client'

export const metadata: Metadata = {
  title: 'Vigie — Mes choix',
}

export default function MesChoixPage() {
  return <MesChoixClient />
}
