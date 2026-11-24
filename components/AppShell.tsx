'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Compass,
  BarChart2,
  Heart,
  Bell,
  User,
  Sparkles,
  LogIn,
} from 'lucide-react'
import { ToastProvider } from '@/components/Toast'
import { useNotifications, useCurrentUser } from '@/lib/hooks'

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

function NotifBadge() {
  const { unread } = useNotifications()
  if (unread === 0) return null
  return (
    <span className="notif-badge" aria-label={`${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}`}>
      {unread > 9 ? '9+' : unread}
    </span>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const pageLabel = PAGE_LABELS[pathname] ?? 'Accueil'
  const { user, isLoggedIn } = useCurrentUser()

  const avatarChar = user?.avatarChar || (isLoggedIn ? user?.name[0]?.toUpperCase() : null)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

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
                {href === '/alertes' && <NotifBadge />}
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

        {isLoggedIn ? (
          <div className="sidebar-user-footer">
            <div className="sidebar-user-name">
              <span className="sidebar-avatar">{avatarChar}</span>
              <span>{user?.name}</span>
            </div>
            <button className="btn btn-text sidebar-logout" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="sidebar-footer">
            <Link href="/auth/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              <LogIn size={15} /> Se connecter
            </Link>
          </div>
        )}
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
            {!isLoggedIn && (
              <Link href="/auth/login" className="btn btn-outline" style={{ fontSize: 13, padding: '6px 14px' }}>
                Se connecter
              </Link>
            )}
            <Link href="/alertes" className="icon-btn" aria-label="Mes alertes" style={{ position: 'relative' }}>
              <Bell size={18} strokeWidth={1.8} />
              <NotifBadge />
            </Link>
            {isLoggedIn ? (
              <Link href="/profil" className="avatar-btn" aria-label="Mon profil">
                {avatarChar || 'É'}
              </Link>
            ) : (
              <Link href="/auth/login" className="avatar-btn" aria-label="Se connecter">
                <User size={16} />
              </Link>
            )}
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
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={22} strokeWidth={1.8} />
                {href === '/alertes' && <NotifBadge />}
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
    </ToastProvider>
  )
}
