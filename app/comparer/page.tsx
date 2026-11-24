import type { Metadata } from 'next'
import { ComparerClient } from './comparer-client'

export const metadata: Metadata = {
  title: 'Vigie — Comparer mes options',
}

export default function ComparerPage() {
  return <ComparerClient />
}
