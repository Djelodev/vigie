/**
 * lib/db.ts
 * Base de données SQLite locale via better-sqlite3.
 * Instanciée une seule fois (singleton) pour tout le process Next.js.
 * ⚠️  MODULE SERVEUR UNIQUEMENT — ne jamais importer depuis un Client Component.
 */
import 'server-only'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), '.data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'vigie.db')

// Singleton pour le développement (hot-reload safe)
const globalForDb = globalThis as unknown as { _vigieDb?: Database.Database }

function openDb(): Database.Database {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

export const db: Database.Database = globalForDb._vigieDb ?? openDb()
if (process.env.NODE_ENV !== 'production') globalForDb._vigieDb = db

// ── Migrations ────────────────────────────────────────────────

db.exec(`
  -- Utilisateurs
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    name        TEXT    NOT NULL DEFAULT '',
    avatar_char TEXT    NOT NULL DEFAULT 'É',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Préférences onboarding
  CREATE TABLE IF NOT EXISTS user_prefs (
    user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    niveau          TEXT DEFAULT '',
    type_bac        TEXT DEFAULT '',
    interets        TEXT DEFAULT '[]',
    domaines        TEXT DEFAULT '[]',
    regions         TEXT DEFAULT '[]',
    mobilite        TEXT DEFAULT 'nationale',
    budget          TEXT DEFAULT '',
    alternance      INTEGER DEFAULT 0,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Sessions
  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Favoris / formations sauvegardées
  CREATE TABLE IF NOT EXISTS favorites (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cod_aff     TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'a_decouvrir',
    notes       TEXT    NOT NULL DEFAULT '',
    priority    INTEGER NOT NULL DEFAULT 0,
    list_name   TEXT    NOT NULL DEFAULT 'principale',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, cod_aff)
  );

  -- Tâches / checklist
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT    NOT NULL,
    note        TEXT    NOT NULL DEFAULT '',
    done        INTEGER NOT NULL DEFAULT 0,
    due_date    TEXT,
    category    TEXT    NOT NULL DEFAULT 'general',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Rappels personnels
  CREATE TABLE IF NOT EXISTS reminders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT    NOT NULL,
    note        TEXT    NOT NULL DEFAULT '',
    due_date    TEXT    NOT NULL,
    done        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Notifications
  CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT    NOT NULL DEFAULT 'info',
    title       TEXT    NOT NULL,
    body        TEXT    NOT NULL DEFAULT '',
    link        TEXT    NOT NULL DEFAULT '',
    read        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Abonnements newsletter
  CREATE TABLE IF NOT EXISTS newsletter_subs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    confirmed   INTEGER NOT NULL DEFAULT 0,
    token       TEXT,
    frequency   TEXT    NOT NULL DEFAULT 'hebdo',
    prefs       TEXT    NOT NULL DEFAULT '{}',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Cache données Parcoursup
  CREATE TABLE IF NOT EXISTS parcoursup_cache (
    cod_aff     TEXT    PRIMARY KEY,
    data        TEXT    NOT NULL,
    session     TEXT    NOT NULL,
    fetched_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Meta (last sync, etc.)
  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Actions en attente de confirmation (Vigi AI)
  CREATE TABLE IF NOT EXISTS ai_pending_actions (
    id             TEXT    PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type           TEXT    NOT NULL,
    payload        TEXT    NOT NULL DEFAULT '{}',
    correlation_id TEXT    NOT NULL DEFAULT '',
    expires_at     TEXT    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'pending',
    executed_at    TEXT,
    error          TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Conversations Vigi AI
  CREATE TABLE IF NOT EXISTS ai_conversations (
    id             TEXT    PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wxo_conv_id    TEXT,
    title          TEXT    NOT NULL DEFAULT 'Nouvelle conversation',
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Messages d'une conversation Vigi AI
  CREATE TABLE IF NOT EXISTS ai_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT    NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            TEXT    NOT NULL DEFAULT 'user',
    content         TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`)

// Tâches par défaut pour les nouveaux utilisateurs
export const DEFAULT_TASKS = [
  { label: 'Explorer au moins 3 formations',    note: 'Découvre plusieurs options et domaines', category: 'orientation' },
  { label: 'Identifier mes critères prioritaires', note: 'Localisation, alternance, coûts…', category: 'orientation' },
  { label: 'Comparer mes formations favorites',  note: 'Utilise le comparateur Vigie', category: 'orientation' },
  { label: 'Vérifier les dates Parcoursup',      note: 'Consulte le calendrier officiel', category: 'parcoursup' },
  { label: 'Préparer mes documents',             note: 'Bulletins, lettres de motivation…', category: 'parcoursup' },
  { label: 'Consulter mon espace Parcoursup',    note: 'parcoursup.gouv.fr', category: 'parcoursup' },
]
