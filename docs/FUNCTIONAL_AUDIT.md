# Audit Fonctionnel — Vigie V2
> Réalisé le 2026-11-24 · Stack : Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4, Recharts 3

---

## 1. Architecture détectée

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Composants UI | shadcn/ui (base-ui), lucide-react |
| Graphiques | Recharts 3.8 |
| Données asynchrones | SWR 2.5 |
| Gestionnaire de paquets | pnpm 12 |
| Langage | TypeScript 5.7 |
| Base de données | ❌ Aucune (pas de Prisma, pas de SQLite, pas de Postgres) |
| Authentification | ❌ Aucune |
| Backend API | Next.js Route Handlers uniquement |
| Déploiement | Vercel (Analytics présent) |

---

## 2. Routes existantes

| Route | Type | Statut |
|---|---|---|
| `/` | Landing page | ✅ Fonctionnel, design validé |
| `/dashboard` | Dashboard | ⚠️ Données entièrement fictives, RappelConso (hors-sujet) |
| `/explorer` | Recherche de formations | ⚠️ 4 formations fictives, pas de vraies données |
| `/comparer` | Comparateur | ⚠️ Données fictives, graphiques statiques |
| `/mes-choix` | Favoris / suivi | ❌ État non persistant, 0 vraie donnée |
| `/alertes` | Notifications | ❌ Notifications codées en dur, aucune logique réelle |
| `/profil` | Profil utilisateur | ❌ Aucune auth, profil fictif non modifiable |
| `/api/recalls` | API proxy RappelConso | ⚠️ Hors-sujet (rappels produits), fonctionnel mais à remplacer |

---

## 3. Fonctionnalités opérationnelles

- ✅ Design system complet (tokens CSS, composants, typographie, couleurs)
- ✅ Logo, mascotte Vigi, assets graphiques validés
- ✅ Navigation sidebar + bottom nav mobile
- ✅ Responsive design (desktop / tablette / mobile)
- ✅ Toast notifications (composant Toast)
- ✅ Bouton retour / liens de navigation
- ✅ SEO metadata de base
- ✅ En-têtes de sécurité HTTP (CSP, HSTS, etc.)
- ✅ AppShell (layout partagé)

---

## 4. Fonctionnalités partiellement opérationnelles

- ⚠️ Recherche Explorer : fonctionne mais sur 4 formations fictives
- ⚠️ Comparateur : graphique Recharts opérationnel mais données inventées
- ⚠️ Toast system : fonctionne mais les actions ne persistent pas
- ⚠️ API route `/api/recalls` : fonctionnelle mais connectée à RappelConso (hors-sujet)

---

## 5. Fonctionnalités simulées / codées en dur

- ❌ Formations Explorer : 4 entrées hardcodées ("établissement démo A/B/C/D")
- ❌ Favoris Mes choix : `[1, 2]` fixés en dur dans useState
- ❌ Taux d'accès : valeurs inventées (53%, 64%, 71%, 78%)
- ❌ Notifications Alertes : 2 notifications codées en dur
- ❌ Profil : "Étudiant·e · profil fictif", "Espace de démonstration"
- ❌ Tableau de bord : stats fictives, RappelConso présent
- ❌ Années historiques "2023, 2024, 2025" : toutes inventées

---

## 6. Boutons sans action réelle

| Bouton | Localisation | Problème |
|---|---|---|
| "Voir la fiche" | Explorer, Mes choix | Pas de route `/explorer/[id]` |
| "Modifier" (profil) | Profil | Absent, aucun formulaire d'édition |
| Coeur favori (Mes choix) | Mes choix | Ne retire pas réellement la formation |
| "Comparer" | Explorer | État non partagé avec /comparer |
| Préférences notifications | Profil | Ne sauvegarde pas (defaultChecked) |

---

## 7. Problèmes identifiés

### Données
- API route pointe sur RappelConso (copier-coller du sujet Bobathon → à remplacer par Parcoursup)
- API Parcoursup officielle confirmée opérationnelle : `https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/records`
- 14 252 enregistrements réels session 2025 disponibles

### Persistance
- Aucune base de données : tout l'état est en mémoire React
- Un rafraîchissement efface tous les favoris, tâches, préférences
- Aucun système d'authentification

### Navigation
- Pas de pages de détail formation (`/explorer/[id]`)
- "Ajouter une formation" dans Comparer renvoie vers Explorer mais l'état de comparaison n'est pas partagé

### Sécurité
- `typescript: { ignoreBuildErrors: true }` dans next.config.mjs (risque)
- Aucune validation côté serveur des paramètres API
- Aucune protection CSRF (pas nécessaire sans auth/forms POST)

---

## 8. Matrice exigences ↔ implémentation

| Exigence Cahier des charges | Implémenté | Testé | Statut |
|---|---|---|---|
| Données publiques data.gouv.fr | ❌ | ❌ | Non implémenté |
| Application web de recherche | ⚠️ | ❌ | Simulé |
| Outils d'analyse / graphiques | ⚠️ | ❌ | Simulé |
| Suivi des choix étudiants | ⚠️ | ❌ | Simulé, non persistant |
| Newsletter / alertes | ⚠️ | ❌ | Interface seulement |
| Authentification | ❌ | ❌ | Non implémenté |
| Fiches détaillées formations | ❌ | ❌ | Non implémenté |
| Comparateur intelligent | ⚠️ | ❌ | Données fictives |
| Calendrier / échéances | ❌ | ❌ | Non implémenté |
| Carte géographique | ❌ | ❌ | Non implémenté |
| Export CSV/PDF | ❌ | ❌ | Non implémenté |

---

## 9. Risques de régression

- Le design system CSS en `globals.css` est central — tout changement de classe CSS peut casser plusieurs pages
- Le composant `AppShell` est partagé entre toutes les routes authentifiées
- Les styles inline (`<style>` tags) dans chaque page rendent les modifications globales délicates
- `typescript: { ignoreBuildErrors: true }` peut masquer des erreurs critiques

---

## 10. Plan d'action prioritaire

1. **Remplacer l'API RappelConso** par une couche données Parcoursup réelle
2. **Ajouter SQLite** (via better-sqlite3 ou Prisma) pour la persistance locale sans infrastructure externe
3. **Implémenter les routes de détail** `/explorer/[id]`
4. **Connecter l'Explorer** aux vraies données avec pagination et filtres
5. **Implémenter l'auth** (iron-session ou next-auth avec email+mdp simple)
6. **Rendre les favoris/tâches persistants** en base de données
7. **Implémenter les alertes** avec logique temporelle réelle
8. **Implémenter la newsletter** avec Nodemailer + MailHog local

---

*Généré automatiquement · Vigie V2 · Bobathon ESGI*
