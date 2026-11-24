/**
 * app/vigi/page.tsx
 * Page de présentation de Vigi AI.
 * Le chat est désormais un widget flottant disponible sur toutes les pages.
 * Cette page sert de landing / onboarding pour découvrir les capacités de Vigi.
 */
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vigi AI — Copilote d\'orientation · Vigie',
  description: 'Ton copilote intelligent pour explorer, comparer et organiser tes choix de formation avec IBM watsonx.',
}

const CAPABILITIES = [
  {
    icon: '🔍',
    title: 'Rechercher des formations',
    desc: 'Trouve des formations selon ton domaine, ta ville, ton diplôme ou ton projet de vie.',
    example: '« Formations en informatique en alternance à Toulouse »',
  },
  {
    icon: '📊',
    title: 'Comprendre les statistiques',
    desc: 'Vigi explique les taux d\'accès, les capacités d\'accueil et les données Parcoursup sans jargon.',
    example: '« Explique-moi le taux d\'accès de cette formation »',
  },
  {
    icon: '⚖️',
    title: 'Comparer des formations',
    desc: 'Compare jusqu\'à 4 formations côte à côte avec des critères objectifs et vérifiables.',
    example: '« Compare mes formations favorites »',
  },
  {
    icon: '📅',
    title: 'Suivre tes démarches',
    desc: 'Consulte tes échéances, tâches et rappels. Vigi peut t\'aider à en créer de nouveaux.',
    example: '« Qu\'est-ce qu\'il me reste à faire ? »',
  },
  {
    icon: '🎯',
    title: 'Trouver des alternatives',
    desc: 'Découvre des formations proches de tes critères si tes premiers choix ne sont pas disponibles.',
    example: '« Trouve-moi des alternatives en alternance »',
  },
  {
    icon: '⭐',
    title: 'Gérer tes favoris',
    desc: 'Vigi propose d\'ajouter des formations à tes favoris — tu confirmes, il agit.',
    example: '« Ajoute cette formation à mes favoris »',
  },
]

export default function VigiaPage() {
  return (
    <div className="page-content vigi-page">
      {/* En-tête */}
      <div className="vigi-page-header">
        <div className="vigi-page-title-block">
          <h1>Vigi AI</h1>
          <p className="vigi-page-subtitle">
            Ton copilote d'orientation · Données officielles Parcoursup 2025 · Propulsé par IBM watsonx Orchestrate
          </p>
        </div>
        <span className="badge-ibm">
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="4" fill="#0530AD"/>
            <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">AI</text>
          </svg>
          IBM watsonx Orchestrate
        </span>
      </div>

      {/* Call to action principal */}
      <div className="card" style={{ padding: '28px 32px', marginBottom: 32, background: 'var(--vigie-lavender)', border: '1.5px solid var(--vigie-blue)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>💬</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--vigie-blue)', fontFamily: 'var(--font-heading)', marginBottom: 6 }}>
              Vigi est disponible partout dans Vigie
            </div>
            <p style={{ color: 'var(--vigie-slate)', margin: 0, fontSize: 14 }}>
              Clique sur le bouton <strong style={{ color: 'var(--vigie-blue)' }}>Vigi AI</strong> en bas à droite de n'importe quelle page pour ouvrir le chat.
              Vigi t'accompagne en contexte : sur une fiche de formation, dans le comparateur ou sur ton tableau de bord.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-primary" style={{ flexShrink: 0 }}>
            Aller au tableau de bord →
          </Link>
        </div>
      </div>

      {/* Capacités */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, fontFamily: 'var(--font-heading)', color: 'var(--vigie-ink)' }}>
        Ce que Vigi peut faire pour toi
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
        {CAPABILITIES.map((cap) => (
          <div key={cap.title} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{cap.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--vigie-ink)', fontFamily: 'var(--font-heading)' }}>
              {cap.title}
            </div>
            <p style={{ color: 'var(--vigie-slate)', fontSize: 13, lineHeight: 1.55, margin: '0 0 12px' }}>
              {cap.desc}
            </p>
            <div style={{
              background: 'var(--vigie-cloud)',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 12.5,
              color: 'var(--vigie-blue)',
              fontStyle: 'italic',
              borderLeft: '3px solid var(--vigie-blue)',
            }}>
              {cap.example}
            </div>
          </div>
        ))}
      </div>

      {/* Note de transparence */}
      <div className="card" style={{ padding: '20px 24px', background: '#fffbf0', border: '1px solid #ffe4a0' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#805000' }}>
          🛡️ Transparence et responsabilité
        </div>
        <ul style={{ color: 'var(--vigie-slate)', fontSize: 13, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
          <li>Vigi utilise uniquement les données officielles Parcoursup disponibles — il ne les invente jamais.</li>
          <li>Toute action (ajout de favori, création de rappel…) nécessite ta confirmation explicite.</li>
          <li>Vigi ne peut pas déposer de vœux sur Parcoursup ni accéder à ton dossier scolaire.</li>
          <li>Vigi t'aide à décider, mais <strong>la décision t'appartient toujours.</strong></li>
          <li>Les statistiques sont historiques — elles ne constituent pas une prédiction d'admission.</li>
        </ul>
      </div>
    </div>
  )
}
