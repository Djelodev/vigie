import Link from 'next/link'
import { ArrowRight, Compass, BarChart2, Bell, Sparkles, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vigie — Ton avenir, à ton rythme.',
}

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── HEADER ───────────────────────────── */}
      <header className="landing-header">
        <Link href="/" aria-label="Vigie, accueil">
          <img src="/brand/svg/vigie-compact-normal.svg" alt="Vigie" width="140" height="48" />
        </Link>
        <Link href="/dashboard" className="btn btn-outline">
          Découvrir mon espace <ArrowRight size={16} />
        </Link>
      </header>

      {/* ── HERO ─────────────────────────────── */}
      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-text">
            <div className="eyebrow">L&apos;orientation, sans pression.</div>
            <h1>
              Ton avenir.<br />
              <span>Tes choix.</span><br />
              À ton rythme.
            </h1>
            <p className="landing-desc">
              Explore les formations, comprends les chiffres et avance avec les bons repères.
              Vigie t&apos;aide à préparer tes choix d&apos;orientation, sans décider à ta place.
            </p>
            <Link href="/dashboard" className="btn btn-primary landing-cta">
              Commencer à explorer <ArrowRight size={18} />
            </Link>
            <p className="landing-fine">
              Assistant gratuit · Indépendant de Parcoursup
            </p>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-visual-card">
              <div className="landing-portrait-wrap">
                <img
                  src="/brand/vigi-portrait.webp"
                  alt="Vigi, l'assistante Vigie"
                  className="landing-portrait"
                  width="200"
                  height="200"
                />
              </div>
              <div className="landing-visual-panel">
                <strong>Un repère à chaque étape.</strong>
                <p>Vigi t&apos;accompagne pour mieux comprendre tes options.</p>
              </div>
              <div className="landing-slogan">
                <Sparkles size={16} />
                <span>Le bon repère, au bon moment.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────── */}
        <section className="landing-features" aria-label="Ce que propose Vigie">
          {[
            {
              Icon: Compass,
              color: 'blue',
              title: 'Explorer',
              desc: 'Trouve les formations qui te correspondent.',
            },
            {
              Icon: BarChart2,
              color: 'mint',
              title: 'Comprendre',
              desc: 'Compare les critères qui comptent pour toi.',
            },
            {
              Icon: Bell,
              color: 'orange',
              title: 'Avancer',
              desc: 'Organise tes choix et tes rappels.',
            },
          ].map(({ Icon, color, title, desc }) => (
            <div key={title} className="landing-feature-card card">
              <div className={`tile-icon ${color}`} aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </section>

        {/* ── FOOTER ───────────────────────────── */}
        <footer className="landing-footer">
          <ShieldCheck size={14} />
          <span>
            Vigie · Assistant indépendant d&apos;orientation. Données et échéances fictives dans cette démo.
            Aucune candidature n&apos;est déposée ici.{' '}
            <a href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener noreferrer">
              Consulter Parcoursup
            </a>.
          </span>
        </footer>
      </main>

      <style>{`
        .landing {
          min-height: 100vh;
          background: var(--vigie-white);
          display: flex;
          flex-direction: column;
          animation: fadeInUp 300ms ease both;
        }
        .landing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 48px;
        }
        .landing-main {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 48px 40px;
          width: 100%;
        }
        .landing-hero {
          display: grid;
          grid-template-columns: 1fr 460px;
          gap: 48px;
          align-items: center;
          padding: 48px 0 64px;
        }
        .landing-hero-text .eyebrow { margin-bottom: 16px; }
        .landing-hero-text h1 {
          font-family: var(--font-heading);
          font-size: clamp(44px, 5vw, 62px);
          font-weight: 800;
          color: var(--vigie-ink);
          letter-spacing: -0.045em;
          line-height: 1.08;
          margin: 0 0 20px;
        }
        .landing-hero-text h1 span { color: var(--vigie-electric); }
        .landing-desc {
          font-size: 15px;
          color: var(--vigie-slate);
          line-height: 1.65;
          max-width: 460px;
          margin-bottom: 28px;
        }
        .landing-cta { font-size: 15px; padding: 14px 24px; }
        .landing-fine {
          margin-top: 12px;
          font-size: 12px;
          color: #9ca3b0;
        }
        .landing-visual-card {
          background: var(--vigie-lavender);
          border-radius: 24px;
          padding: 32px 24px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .landing-portrait-wrap {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255,255,255,0.6);
          background: white;
        }
        .landing-portrait {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }
        .landing-visual-panel {
          background: var(--vigie-white);
          border-radius: 16px;
          padding: 16px 20px;
          width: 100%;
        }
        .landing-visual-panel strong {
          display: block;
          font-family: var(--font-heading);
          font-size: 15px;
          font-weight: 700;
          color: var(--vigie-ink);
          margin-bottom: 6px;
        }
        .landing-visual-panel p {
          font-size: 13px;
          color: var(--vigie-slate);
        }
        .landing-slogan {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--vigie-white);
          border-radius: 12px;
          width: 100%;
          font-size: 13px;
          font-weight: 700;
          color: var(--vigie-blue);
        }
        .landing-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 8px;
        }
        .landing-feature-card {
          padding: 28px 24px;
          transition: transform var(--motion-normal), box-shadow var(--motion-normal);
        }
        .landing-feature-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-card-hover);
        }
        .landing-feature-card .tile-icon { margin-bottom: 16px; }
        .landing-feature-card h3 {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 700;
          color: var(--vigie-ink);
          margin: 0 0 8px;
        }
        .landing-feature-card p {
          font-size: 13px;
          color: var(--vigie-slate);
        }
        .landing-footer {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 48px;
          padding-top: 20px;
          border-top: 1px solid #e4e5ef;
          font-size: 11px;
          color: var(--vigie-slate);
          line-height: 1.6;
        }
        .landing-footer svg { flex-shrink: 0; margin-top: 1px; color: var(--vigie-mint); }
        .landing-footer a { color: var(--vigie-blue); text-decoration: underline; }

        @media (max-width: 1024px) {
          .landing-header { padding: 20px 32px; }
          .landing-main { padding: 0 32px 32px; }
          .landing-hero { grid-template-columns: 1fr 360px; gap: 32px; }
          .landing-hero-text h1 { font-size: 44px; }
          .landing-features { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        }
        @media (max-width: 780px) {
          .landing-header { padding: 16px 20px; }
          .landing-main { padding: 0 20px 28px; }
          .landing-hero {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 32px 0 40px;
          }
          .landing-hero-text h1 { font-size: 38px; }
          .landing-hero-visual { order: -1; }
          .landing-portrait-wrap { width: 120px; height: 120px; }
          .landing-features { grid-template-columns: 1fr; gap: 12px; }
          .landing-feature-card { padding: 20px; }
        }
      `}</style>
    </div>
  )
}
