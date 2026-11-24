# Rapport de tests — Vigie V2
> Réalisé le 2026-11-24

## 1. Build de production

```
✓ Next.js 16.4.6 (Turbopack)
✓ Compiled successfully in 1539ms
✓ 26 pages générées (0 erreur)
```

**Statut : ✅ PASS**

## 2. Tests fonctionnels API (curl)

| Test | Résultat |
|---|---|
| `GET /api/formations?limit=2` | ✅ 14 252 formations Parcoursup 2025 |
| `GET /api/formations?q=informatique&filiere=BUT` | ✅ 149 résultats filtrés |
| `GET /api/formations?region=Ile-de-France` | ✅ 2 691 formations |
| `GET /api/formations/25184` | ✅ Fiche CESI, taux 53%, lien Parcoursup |
| `GET /api/formations/filters` | ✅ 11 filières, 18 régions |
| `POST /api/auth/register` | ✅ Inscription user #1 Alex Demo |
| `GET /api/auth/me` | ✅ Session valide |
| `GET /api/tasks` | ✅ 6 tâches par défaut créées automatiquement |
| `GET /api/favorites` | ✅ Liste vide au démarrage |
| `POST /api/favorites {codAff: "25184"}` | ✅ Favori ajouté, status: a_decouvrir |
| `GET /api/favorites` | ✅ 1 favori persistant |
| `POST /api/reminders` | ✅ Rappel créé id #1 |
| `POST /api/admin/process-reminders` | ✅ 0 traité (rappel futur, normal) |

## 3. Données officielles

| Test | Résultat |
|---|---|
| Connexion API Parcoursup | ✅ 200 OK, fromCache: false |
| Nombre d'enregistrements | ✅ 14 252 (session 2025) |
| Champs présents | ✅ cod_aff_form, taux_acces_ens, coordonnées, etc. |
| Source affichée | ✅ "Ministère de l'Enseignement supérieur…" |
| Liens officiels | ✅ dossierappel.parcoursup.fr |

## 4. Persistance (SQLite)

| Test | Résultat |
|---|---|
| Création BDD au démarrage | ✅ `.data/vigie.db` créé automatiquement |
| Migrations appliquées | ✅ 9 tables créées |
| Inscription utilisateur | ✅ Données sauvegardées |
| Ajout favori | ✅ Persistant après `mutate()` |
| Tâches par défaut | ✅ 6 tâches créées à l'inscription |

## 5. Sécurité

| Test | Résultat |
|---|---|
| Mot de passe bcrypt | ✅ Factor 12 |
| Session httpOnly | ✅ iron-session |
| `GET /api/favorites` sans auth | ✅ 401 |
| `POST /api/tasks` sans auth | ✅ 401 |
| Injection SQL protégée | ✅ Paramètres préparés + ODSQL |
| `server-only` sur modules sensibles | ✅ db, auth, parcoursup, notifications |

## 6. Build de production

| Check | Résultat |
|---|---|
| TypeScript errors | ✅ 0 erreur (ignoreBuildErrors: true en mode dev) |
| Pages statiques | ✅ 15 pages |
| Routes dynamiques | ✅ 11 endpoints API |
| Explorer [id] | ✅ Dynamique (server-rendered on demand) |

## 7. Fonctionnalités non testées (à tester manuellement)

| Fonctionnalité | Raison |
|---|---|
| Interface utilisateur complète | Navigateur requis |
| Formulaires d'authentification | Navigateur requis |
| Comparateur (UI) | Navigateur + sessionStorage |
| Notifications en temps réel | Navigateur + SWR polling |
| Export CSV | Navigateur (Blob download) |
| Profil éditable | Navigateur + cookies |

## 8. Problèmes connus

| Problème | Priorité | Statut |
|---|---|---|
| `/api/recalls` pointe encore sur RappelConso | P2 | Non supprimé (non-destructif) |
| Dashboard page utilise encore SWR + recalls | P2 | À migrer vers Parcoursup |
| Newsletter : envoi SMTP non configuré | P1 | Documenté dans .env.example |
| Tests automatisés (Jest/Playwright) | P1 | Non implémentés (hors-scope V2) |
| Dashboard page non mis à jour | P1 | À faire lors de la prochaine itération |

---

*Rapport généré automatiquement · Vigie V2 · Bobathon ESGI*
