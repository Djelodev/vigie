# Architecture — Vigie V2

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 16 (App Router)                      │
│                                                                 │
│  ┌─────────────────┐          ┌────────────────────────────┐   │
│  │   CLIENT        │          │   SERVEUR                  │   │
│  │  (React 19)     │  fetch   │   (Node.js)                │   │
│  │                 │◄────────►│                            │   │
│  │  - AppShell     │          │  - Route Handlers (API)    │   │
│  │  - Pages        │          │  - lib/db.ts (SQLite)      │   │
│  │  - Hooks SWR    │          │  - lib/auth.ts (iron-sess) │   │
│  │  - Forms        │          │  - lib/parcoursup.ts       │   │
│  │  - Charts       │          │  - lib/notifications.ts    │   │
│  │   (Recharts)    │          │                            │   │
│  └─────────────────┘          └───────────────┬────────────┘   │
│                                               │                │
└───────────────────────────────────────────────┼────────────────┘
                                                │
                      ┌─────────────────────────┴──────────┐
                      │                                     │
              ┌───────▼──────┐                    ┌────────▼──────┐
              │  SQLite      │                    │  Parcoursup   │
              │  .data/      │                    │  API officielle│
              │  vigie.db    │                    │  MESR          │
              └──────────────┘                    └───────────────┘
```

## Stack technologique

| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.4.6 |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Graphiques | Recharts | 3.8.0 |
| Données async | SWR | 2.5.x |
| Base de données | SQLite (better-sqlite3) | 13.x |
| Authentification | iron-session + bcryptjs | 9.x |
| Gestionnaire de paquets | pnpm | 12.x |
| Langage | TypeScript | 5.7.x |

## Structure des fichiers

```
project-hackaton/
├── app/                          # Routes Next.js (App Router)
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Design system CSS
│   ├── auth/                     # Auth pages (login, register)
│   ├── dashboard/                # Tableau de bord
│   ├── explorer/                 # Recherche de formations
│   │   └── [id]/                 # Fiche détaillée
│   ├── comparer/                 # Comparateur
│   ├── mes-choix/                # Favoris et suivi
│   ├── alertes/                  # Notifications et calendrier
│   ├── profil/                   # Profil utilisateur
│   └── api/                      # Route Handlers (API)
│       ├── auth/                 # login, logout, register, me
│       ├── formations/           # Parcoursup data, filters, [id]
│       ├── favorites/            # CRUD favoris
│       ├── tasks/                # CRUD tâches
│       ├── notifications/        # Notifications
│       ├── reminders/            # Rappels personnels
│       ├── comparer/             # Sélection comparateur
│       ├── newsletter/           # Abonnements newsletter
│       ├── profile/              # Mise à jour profil
│       └── admin/                # process-reminders (test)
├── components/
│   ├── AppShell.tsx              # Layout principal (sidebar + topbar)
│   └── Toast.tsx                 # Système de notifications UI
├── lib/
│   ├── db.ts                     # SQLite + migrations (SERVER ONLY)
│   ├── auth.ts                   # iron-session (SERVER ONLY)
│   ├── parcoursup.ts             # Client API Parcoursup (SERVER ONLY)
│   ├── notifications.ts          # Moteur notifications (SERVER ONLY)
│   ├── hooks.ts                  # Hooks SWR (CLIENT ONLY)
│   └── utils.ts                  # Utilitaires partagés
├── docs/                         # Documentation
├── .data/                        # Données locales (SQLite, gitignored)
└── public/
    └── brand/                    # Assets graphiques validés
```

## Schéma de base de données

```sql
users           -- id, email, password (bcrypt), name, avatar_char
user_prefs      -- user_id FK, niveau, type_bac, interets, domaines, regions, mobilite, budget, alternance
favorites       -- id, user_id FK, cod_aff, status, notes, priority, list_name
tasks           -- id, user_id FK, label, note, done, due_date, category
reminders       -- id, user_id FK, label, note, due_date, done
notifications   -- id, user_id FK, type, title, body, link, read
newsletter_subs -- id, email, user_id FK, confirmed, token, frequency, prefs
parcoursup_cache -- cod_aff PK, data (JSON), session, fetched_at
meta            -- key, value (stockage clé-valeur générique)
```

## API Endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Utilisateur connecté |
| GET | `/api/formations` | Recherche Parcoursup |
| GET | `/api/formations/[id]` | Fiche formation |
| GET | `/api/formations/filters` | Listes filières/régions |
| GET/POST/DELETE/PATCH | `/api/favorites` | CRUD favoris |
| GET/POST/PATCH/DELETE | `/api/tasks` | CRUD tâches |
| GET/POST/DELETE | `/api/reminders` | CRUD rappels |
| GET/PATCH | `/api/notifications` | Notifications |
| GET/POST/PATCH/DELETE | `/api/newsletter` | Newsletter |
| PATCH/DELETE | `/api/profile` | Mise à jour profil |
| GET/POST | `/api/comparer` | Sélection comparateur |
| POST | `/api/admin/process-reminders` | Traitement rappels (test) |

## Sécurité

- Mots de passe : bcrypt avec salt factor 12
- Sessions : iron-session (cookie chiffré httpOnly, sameSite: lax)
- Validation : toutes les entrées utilisateur sont validées côté serveur
- Isolation : chaque requête vérifie `user_id` contre la session
- En-têtes HTTP : X-Content-Type-Options, HSTS, X-Frame-Options, etc.
- Server-only : db, auth, parcoursup, notifications ne peuvent pas être importés côté client

## Futurs travaux

- Tests automatisés (Jest, Playwright)
- Intégration carte géographique (Leaflet + données coordonnées Parcoursup)
- Newsletter réelle (SMTP / Resend)
- Préparation interfaces pour IBM watsonx Orchestrate
