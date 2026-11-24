# Vigie — Le bon repère, au bon moment.

> Assistant indépendant d'orientation dans l'enseignement supérieur français.
> Projet Bobathon ESGI · IBM · Arrow — 2025

## Présentation

Vigie est une application web d'accompagnement à l'orientation scolaire et étudiante.
Elle exploite les **données officielles Parcoursup** (14 252 formations, session 2025)
pour permettre aux lycéens et étudiants de rechercher, comparer et suivre leurs formations.

**Vigie n'est pas une plateforme officielle Parcoursup.** Elle n'effectue aucun dépôt de candidature.

## Fonctionnalités

| Fonctionnalité | Statut |
|---|---|
| Recherche de formations Parcoursup 2025 | ✅ Implémenté et testé |
| Filtres filière, région, statut, sélectivité | ✅ Implémenté et testé |
| Fiche détaillée avec statistiques officielles | ✅ Implémenté et testé |
| Graphiques (répartition bac, comparaison) | ✅ Implémenté et testé |
| Comparateur jusqu'à 4 formations | ✅ Implémenté (état partagé) |
| Authentification (inscription / connexion) | ✅ Implémenté et testé |
| Favoris et suivi persistants (SQLite) | ✅ Implémenté et testé |
| Statuts personnalisés des formations | ✅ Implémenté |
| Tâches de préparation (checklist) | ✅ Implémenté et testé |
| Rappels personnels | ✅ Implémenté et testé |
| Notifications avec moteur serveur | ✅ Implémenté et testé |
| Calendrier Parcoursup 2025 officiel | ✅ Implémenté |
| Tableau de bord personnalisé | ✅ Implémenté |
| Profil utilisateur modifiable | ✅ Implémenté |
| Newsletter (abonnement BDD) | ✅ Implémenté (sans SMTP) |
| Export CSV des favoris | ✅ Implémenté |
| Responsive mobile | ✅ Design préservé |
| Données RappelConso (hors-sujet) | ⚠️ Conservé, non supprimé |
| Carte géographique | ❌ Non implémenté (P2) |
| Tests automatisés | ❌ Non implémentés (P1) |

## Données

- **Source** : Ministère de l'Enseignement supérieur et de la Recherche
- **Dataset** : `fr-esr-parcoursup`
- **Millésime** : Session 2025
- **Enregistrements** : 14 252 formations
- **Licence** : Licence Ouverte Etalab 2.0
- **API** : `https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/records`

## Démarrage rapide

```bash
# Prérequis : Node.js >= 18, pnpm

git clone <repo>
cd project-hackaton
pnpm install

# Développement
pnpm run dev
# → http://localhost:3000

# Production
pnpm run build
pnpm run start
```

Les données SQLite sont stockées dans `.data/vigie.db` (créé automatiquement au démarrage).

## Variables d'environnement

Voir `.env.example` pour la configuration SMTP newsletter et les secrets.

```bash
cp .env.example .env.local
# Modifier SESSION_SECRET en production
```

## Structure

```
app/        # Routes Next.js
lib/        # Services serveur (db, auth, parcoursup, notifications)
components/ # Composants UI partagés
docs/       # Documentation
.data/      # Base de données locale (gitignored)
public/     # Assets graphiques validés
```

## Documentation

| Fichier | Description |
|---|---|
| `docs/FUNCTIONAL_AUDIT.md` | Audit technique initial |
| `docs/DATA_SOURCES.md` | Sources de données et schémas |
| `docs/ARCHITECTURE.md` | Architecture et endpoints API |
| `docs/TEST_REPORT.md` | Rapport de tests |
| `docs/DEMO_GUIDE.md` | Guide de démonstration jury |
| `docs/AI_INTEGRATION_PLAN.md` | Plan intégration watsonx Orchestrate |

## Stack

| Technologie | Rôle |
|---|---|
| Next.js 16 (App Router) | Framework fullstack |
| React 19 | Interface utilisateur |
| Tailwind CSS 4 | Styling |
| Recharts 3 | Graphiques |
| SWR 2 | Données asynchrones client |
| better-sqlite3 | Base de données locale |
| iron-session | Sessions sécurisées |
| bcryptjs | Hashage mots de passe |
| TypeScript 5.7 | Typage statique |

---

*Vigie V2 · Assistant indépendant d'orientation · Bobathon ESGI 2025*
