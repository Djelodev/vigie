'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Compass,
  BarChart2,
  Heart,
  Bell,
  User,
  Sparkles,
} from 'lucide-react'
import { ToastProvider } from '@/components/Toast'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil',    Icon: Home      },
  { href: '/explorer',  label: 'Explorer',   Icon: Compass   },
  { href: '/comparer',  label: 'Comparer',   Icon: BarChart2 },
  { href: '/mes-choix', label: 'Mes choix',  Icon: Heart     },
  { href: '/alertes',   label: 'Alertes',    Icon: Bell      },
  { href: '/profil',    label: 'Mon profil', Icon: User      },
]

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/explorer':  'Explorer',
  '/comparer':  'Comparer',
  '/mes-choix': 'Mes choix',
  '/alertes':   'Alertes',
  '/profil':    'Mon profil',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageLabel = PAGE_LABELS[pathname] ?? 'Accueil'

  return (
    <ToastProvider>
    <div className="app-shell">
      {/* ── SIDEBAR ─────────────────────────────── */}
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand" aria-label="Vigie, accueil">
          <img src="/brand/svg/vigie-compact-normal.svg" alt="Vigie" width="130" height="44" />
        </Link>

        <div>
          <div className="sidebar-label">Mon espace</div>
          <nav className="side-nav" aria-label="Navigation principale">
            {NAV_ITEMS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${pathname === href ? ' active' : ''}`}
                aria-current={pathname === href ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-note">
          <strong>
            <Sparkles size={15} /> Un pas à la fois.
          </strong>
          <p>Tu n'as pas besoin de tout décider aujourd'hui. Vigi est là pour t'aider à y voir plus clair.</p>
        </div>

        <div className="sidebar-footer">
          Vigie V1 · Assistant indépendant<br />
          Le bon repère, au bon moment.
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────── */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <Link href="/dashboard" className="mobile-logo" aria-label="Vigie, accueil">
            <img src="/brand/svg/vigie-compact-normal.svg" alt="Vigie" width="108" />
          </Link>
          <div className="topbar-breadcrumb" aria-label="Fil d'Ariane">
            Mon espace <span>/</span> <strong>{pageLabel}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-badge">Mode démo</span>
            <Link href="/alertes" className="icon-btn" aria-label="Mes alertes">
              <Bell size={18} strokeWidth={1.8} />
            </Link>
            <Link href="/profil" className="avatar-btn" aria-label="Mon profil">
              É
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile) ──────────────────── */}
      <nav className="bottom-nav" aria-label="Navigation mobile">
        <div className="bottom-nav-inner">
          {NAV_ITEMS.slice(0, 5).map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item${pathname === href ? ' active' : ''}`}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
    </ToastProvider>
  )
}
