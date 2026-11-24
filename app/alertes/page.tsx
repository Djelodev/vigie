import type { Metadata } from 'next'
import { AlertesClient } from './alertes-client'

export const metadata: Metadata = {
  title: 'Vigie — Mes alertes',
}

export default function AlertesPage() {
  return <AlertesClient />
}
