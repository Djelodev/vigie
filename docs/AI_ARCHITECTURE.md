# Architecture IA — Vigi AI

> Document technique · Vigie + IBM watsonx Orchestrate · Bobathon ESGI 2025

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VIGIE APPLICATION                                  │
│                                                                              │
│  ┌─────────────────┐          ┌──────────────────────────────────────────┐  │
│  │   BROWSER       │          │   NEXT.JS SERVER (Node.js)               │  │
│  │  (React 19)     │  HTTPS   │                                          │  │
│  │                 │◄────────►│  POST /api/ai/chat       ← Proxy sécurisé│  │
│  │  VigiaChat.tsx  │          │  POST /api/ai/actions    ← Confirmation  │  │
│  │  (composant UI) │          │  GET  /api/ai/conversations              │  │
│  │                 │          │                                          │  │
│  └─────────────────┘          │  lib/watsonx.ts    ← Client IBM (server) │  │
│                               │  lib/ai-tools.ts   ← Outils métier      │  │
│                               │  lib/ai-actions.ts ← Actions confirmées  │  │
│                               └───────────────┬──────────────────────────┘  │
│                                               │ Bearer Token (IAM)          │
└───────────────────────────────────────────────┼─────────────────────────────┘
                                                │
                                   ┌────────────▼────────────┐
                                   │  IBM watsonx Orchestrate │
                                   │  (SaaS AWS)              │
                                   │                          │
                                   │  Agent : vigi_ai         │
                                   │  Modèle : granite-3-3-8b │
                                   │  Tools : exécutés local  │
                                   └──────────────────────────┘
```

## Principe de sécurité fondamental

**WXO_API_KEY n'atteint jamais le navigateur.**

Tous les appels à IBM watsonx Orchestrate sont effectués côté serveur uniquement.

## Résolution du problème localhost → cloud

watsonx Orchestrate (hébergé sur AWS) ne peut pas appeler `localhost:3000`.

**Solution retenue : Tool Execution Loop locale**

1. Le navigateur envoie un message à `/api/ai/chat` (Next.js server)
2. Le serveur appelle l'agent WXO via l'API cloud
3. L'agent retourne un appel d'outil structuré (`search_formations`, etc.)
4. Le serveur exécute l'outil **localement** (`lib/ai-tools.ts`)
5. Le résultat est renvoyé à l'agent WXO
6. L'agent génère la réponse finale
7. La réponse est retournée au navigateur

Cette architecture ne nécessite pas d'exposer localhost publiquement.

## Outils de l'agent

| Outil | Type | Accès | Description |
|---|---|---|---|
| `search_formations` | Lecture | Public | Recherche Parcoursup |
| `get_formation_details` | Lecture | Public | Fiche formation |
| `get_formation_statistics` | Lecture | Public | Statistiques officielles |
| `compare_formations` | Lecture | Public | Comparaison jusqu'à 4 formations |
| `get_alternative_formations` | Lecture | Public | Formations alternatives |
| `get_official_deadlines` | Lecture | Public | Calendrier Parcoursup 2025 |
| `get_user_preferences` | Lecture | Auth | Préférences utilisateur |
| `get_user_favorites` | Lecture | Auth | Favoris de l'utilisateur |
| `get_user_progress` | Lecture | Auth | Tâches et progression |
| `get_user_reminders` | Lecture | Auth | Rappels personnels |
| `propose_add_favorite` | Écriture (propose) | Auth | Proposition ajout favori |
| `propose_create_reminder` | Écriture (propose) | Auth | Proposition rappel |
| `propose_create_task` | Écriture (propose) | Auth | Proposition tâche |
| `propose_update_choice_status` | Écriture (propose) | Auth | Proposition statut |

## Modèle d'action sécurisée

Les actions d'écriture suivent un cycle en 3 étapes :

```
1. PROPOSITION  → L'agent génère une PendingAction (stockée en BDD)
2. CONFIRMATION → L'utilisateur clique "Confirmer" dans l'UI
3. EXÉCUTION    → POST /api/ai/actions vérifie et exécute l'action réelle
```

Garanties :
- L'action expire après 5 minutes
- Une action ne peut être exécutée qu'une seule fois (protection doublon)
- Le userId est extrait de la session serveur, jamais du message IA
- La formation est vérifiée dans Parcoursup avant tout ajout

## Tables de base de données ajoutées

```sql
ai_pending_actions  -- Actions en attente de confirmation
ai_conversations    -- Conversations Vigi AI
ai_messages         -- Messages d'une conversation
```

## Feature flag

L'intégration IA est désactivée par défaut (`WXO_ENABLED=false`).

L'application Vigie fonctionne normalement sans watsonx Orchestrate.

## Fichiers créés

| Fichier | Rôle |
|---|---|
| `lib/watsonx.ts` | Client IBM WXO (server-only) |
| `lib/ai-tools.ts` | Outils métier locaux |
| `lib/ai-actions.ts` | Gestion actions confirmées |
| `app/api/ai/chat/route.ts` | Endpoint de conversation |
| `app/api/ai/actions/route.ts` | Endpoint de confirmation |
| `app/api/ai/conversations/route.ts` | Gestion conversations |
| `app/vigi/page.tsx` | Page dédiée Vigi AI |
| `components/VigiaChat.tsx` | Composant UI |
| `ai/agents/vigi_ai.yaml` | Définition agent WXO |
