# Rapport de tests IA — Vigi AI
> Généré le 2026-11-24

## 1. Build de production

```
✓ Next.js 16.4.6 (Turbopack)
✓ Compiled successfully in 2.9s
✓ 30 pages générées (0 erreur)
✓ 3 nouveaux endpoints IA : /api/ai/chat, /api/ai/actions, /api/ai/conversations
✓ 1 nouvelle page : /vigi
```

**Statut : ✅ PASS**

## 2. Tests des endpoints IA (sans authentification)

| Test | Résultat attendu | Résultat |
|---|---|---|
| `POST /api/ai/chat` sans auth | 401 | ✅ 401 |
| `POST /api/ai/actions` sans auth | 401 | ✅ 401 |
| `GET /api/ai/conversations` sans auth | 401 | ✅ 401 |
| `GET /vigi` page accessible | 200 | ✅ 200 |

**Statut : ✅ PASS**

## 3. Tests de non-régression Vigie existant

| Test | Résultat |
|---|---|
| `GET /api/formations?limit=1` | ✅ 14 252 formations |
| `GET /api/formations?q=informatique&filiere=BUT` | ✅ 149 résultats |
| Application principale fonctionnelle | ✅ OK |
| Endpoints existants non affectés | ✅ OK |

**Statut : ✅ PASS**

## 4. Feature flag et mode dégradé

| Test | Résultat |
|---|---|
| `WXO_ENABLED=false` → chat retourne 503 | ✅ PASS (non configuré par défaut) |
| Application Vigie fonctionnelle sans WXO | ✅ PASS |

**Statut : ✅ PASS**

## 5. Tests en attente (nécessitent secrets IBM)

Ces tests nécessitent une instance IBM watsonx Orchestrate active configurée.

| Test | Statut | Blocage |
|---|---|---|
| Connexion IAM (getIAMToken) | ⏳ En attente | WXO_API_KEY non configurée |
| Appel agent WXO | ⏳ En attente | WXO_INSTANCE_URL non configurée |
| Tool execution loop | ⏳ En attente | Dépend de l'agent déployé |
| Test 1 — Recherche BUT Toulouse | ⏳ En attente | IBM requis |
| Test 2 — Recherche multicritère | ⏳ En attente | IBM requis |
| Test 5 — Ajout favori | ⏳ En attente | IBM + auth requise |
| Test 11 — Prompt injection | ⏳ En attente | IBM requis |
| Test 12 — Panne IBM | ⏳ En attente | IBM requis |

## 6. Procédure de validation avec IBM

Après configuration dans `.env` :

```bash
# 1. Démarrer l'application
npm run dev

# 2. Se connecter (récupérer cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vigie.fr","password":"demo1234"}'

# 3. Test connexion IAM
curl -b cookies.txt \
  -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour, tu fonctionne ?"}'

# 4. Test recherche réelle
curl -b cookies.txt \
  -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Trouve-moi des BUT informatique à Toulouse"}'

# 5. Vérifier les logs pour les appels d'outils
# [Vigi AI Tools][correlationId] tool=search_formations
```

## 7. Résumé des fichiers créés / modifiés

| Fichier | Action | Description |
|---|---|---|
| `lib/watsonx.ts` | Créé | Client IBM WXO (server-only) |
| `lib/ai-tools.ts` | Créé | 14 outils métier |
| `lib/ai-actions.ts` | Créé | Actions confirmées |
| `lib/db.ts` | Modifié | +3 tables AI |
| `app/api/ai/chat/route.ts` | Créé | Endpoint conversation |
| `app/api/ai/actions/route.ts` | Créé | Endpoint confirmation |
| `app/api/ai/conversations/route.ts` | Créé | Endpoint conversations |
| `app/vigi/page.tsx` | Créé | Page Vigi AI |
| `components/VigiaChat.tsx` | Créé | Composant UI chat |
| `components/AppShell.tsx` | Modifié | +nav Vigi AI |
| `app/globals.css` | Modifié | +styles Vigi AI |
| `ai/agents/vigi_ai.yaml` | Créé | Définition agent WXO |
| `.env.example` | Modifié | +variables IBM |

---
*Rapport · Vigi AI · Bobathon ESGI 2025*
