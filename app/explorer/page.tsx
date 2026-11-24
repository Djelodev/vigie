import type { Metadata } from 'next'
import { ExplorerClient } from './explorer-client'

export const metadata: Metadata = {
  title: 'Vigie — Explorer les formations',
}

export default function ExplorerPage() {
  return <ExplorerClient />
}
