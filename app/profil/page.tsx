import type { Metadata } from 'next'
import { ProfilClient } from './profil-client'

export const metadata: Metadata = {
  title: 'Vigie — Mon profil',
}

export default function ProfilPage() {
  return <ProfilClient />
}
