# Configuration IBM watsonx Orchestrate — Vigie

> Guide de mise en production · Instance SaaS AWS · ADK 2.19.1 · Bobathon ESGI 2025

## Ce qui est installé

```
✅ ibm-watsonx-orchestrate 2.19.1
✅ .venv/bin/orchestrate --version → ADK Version: 2.19.1
✅ Python 3.14.4 (compatible)
✅ Auth type : mcsp_v2 (confirmé par l'ADK au runtime)
✅ URL d'auth MCSP v2 : https://account-iam.platform.saas.ibm.com/api/2.0/apikeys/token
```

---

## Étape 1 — Variables d'environnement

Copiez `.env.example` en `.env` et renseignez les valeurs **directement dans le fichier** (sans les communiquer dans la conversation) :

```bash
cp .env.example .env
# Ouvrir .env dans un éditeur et renseigner :
# WXO_ENABLED=true
# WXO_INSTANCE_URL=https://VOTRE-INSTANCE.app.aws.watsonxorchestrate.ibm.com
# WXO_API_KEY=votre-cle-api-ibm
# WXO_AGENT_ID=vigi_ai
```

**Récupérer WXO_INSTANCE_URL :**
1. Connectez-vous à https://www.ibm.com/mysupport/saas/console
2. Sélectionnez votre abonnement watsonx Orchestrate
3. L'URL de l'instance ressemble à `https://xxxxxx.app.aws.watsonxorchestrate.ibm.com`

**Récupérer WXO_API_KEY :**
1. Dans l'interface watsonx Orchestrate → icône utilisateur en haut à droite
2. **My API keys** → **Create API key**
3. Copiez la clé (elle ne sera plus visible après fermeture)

> ⚠️ La clé API des instances SaaS AWS est générée dans **watsonx Orchestrate directement**, pas dans IBM Cloud IAM. L'ADK gère l'authentification MCSP automatiquement.

---

## Étape 2 — Connexion à l'instance

L'ADK infère automatiquement le type d'auth **`mcsp_v2`** pour les URLs
`*.app.aws.watsonxorchestrate.ibm.com`.
Pas besoin de spécifier `--type`.

```bash
cd /home/generaldjelo/Téléchargements/project-hackaton

# Supprimer d'abord l'environnement placeholder créé avec la mauvaise URL
.venv/bin/orchestrate env remove --name vigie-prod

# Recréer avec la VRAIE URL de ton instance
.venv/bin/orchestrate env add \
  --name vigie-prod \
  --url https://VOTRE-VRAIE-INSTANCE.app.aws.watsonxorchestrate.ibm.com \
  --activate
# L'ADK affichera :
# [WARNING] - Using 'mcsp_v2' Auth Type  ← c'est le bon type
# [DEBUG]   - Invoking scopeless MCSP v2 token service: https://account-iam.platform.saas.ibm.com/api/2.0/apikeys/token

# Vérifier que l'environnement est actif
.venv/bin/orchestrate env list
# → vigie-prod  https://VOTRE-VRAIE-INSTANCE...  (active)
```

L'ADK demandera la clé API **de manière interactive** (ne la tapez pas dans la conversation).

```bash
# Alternative : exporter avant la commande
export WO_API_KEY="votre-cle-api-wco"
.venv/bin/orchestrate env add \
  --name vigie-prod \
  --url https://VOTRE-VRAIE-INSTANCE.app.aws.watsonxorchestrate.ibm.com \
  --activate
```

---

## Étape 3 — Vérifier les modèles disponibles

```bash
.venv/bin/orchestrate models list
```

Cherchez un modèle Granite compatible avec le français et le tool calling :
- `ibm/granite-3-3-8b-instruct` (recommandé)
- `ibm/granite-3-2-8b-instruct` (alternative)

Si `ibm/granite-3-3-8b-instruct` n'est pas disponible, modifiez le champ `llm` dans [`ai/agents/vigi_ai.yaml`](../ai/agents/vigi_ai.yaml).

---

## Étape 4 — Importer les outils OpenAPI

Les outils sont définis dans [`ai/tools/vigie_openapi.yaml`](../ai/tools/vigie_openapi.yaml).
Ils appellent les routes `/api/ai/tools/*` de Vigie.

**Prérequis** : Vigie doit être accessible depuis le cloud IBM.
Pour le développement local, utilisez ngrok ou un tunnel similaire
(voir la section "Accès depuis le cloud" plus bas).

```bash
# Mettre à jour l'URL de base dans vigie_openapi.yaml d'abord
# servers.variables.base_url.default: https://votre-url-publique.example.com

# Importer les outils
.venv/bin/orchestrate tools import \
  --kind openapi \
  -f ai/tools/vigie_openapi.yaml

# Vérifier que les outils sont importés
.venv/bin/orchestrate tools list
# → 14 outils vigie_* listés
```

---

## Étape 5 — Importer l'agent Vigi

```bash
# Importer la définition de l'agent (les outils doivent être importés avant)
.venv/bin/orchestrate agents import \
  -f ai/agents/vigi_ai.yaml

# Vérifier que l'agent est disponible
.venv/bin/orchestrate agents list
# → vigi_ai  Vigi  native  react_core
```

---

## Étape 6 — Tester l'agent dans le terminal

```bash
# Lancer une conversation dans le terminal
.venv/bin/orchestrate chat
# ou directement avec l'agent :
# naviguer sur votre instance WXO → Chat avec vigi_ai
```

> Note : La commande `orchestrate chat` lance l'interface de chat du Developer Edition local.
> Pour tester l'agent sur l'instance SaaS, utilisez l'interface web watsonx Orchestrate.

---

## Accès depuis le cloud (résolution localhost)

watsonx Orchestrate (hébergé sur AWS) ne peut pas atteindre `localhost:3000`.

**Pour les tests de démonstration**, exposez temporairement Vigie via ngrok :

```bash
# Installer ngrok (https://ngrok.com)
# Démarrer Vigie
npm run dev

# Dans un autre terminal, créer un tunnel HTTPS
ngrok http 3000
# → https://xxxx-xx-xx-xx.ngrok-free.app

# Mettre à jour l'URL dans vigie_openapi.yaml
# servers.variables.base_url.default: https://xxxx-xx-xx-xx.ngrok-free.app

# Réimporter les outils avec la nouvelle URL
.venv/bin/orchestrate tools import \
  --kind openapi \
  -f ai/tools/vigie_openapi.yaml
```

> ⚠️ Ne jamais exposer la base de données directement. Seules les routes `/api/ai/tools/*` sont nécessaires. L'authentification iron-session protège l'accès aux données personnelles.

---

## Étape 7 — Configurer la connexion WXO → Vigie

Dans l'interface watsonx Orchestrate :

1. Aller dans **Connections** → **Create connection**
2. Choisir **API key** ou **Bearer token**
3. URL : `https://votre-url-publique.example.com`
4. Associer la connexion aux outils importés

---

## Étape 8 — Test de bout en bout depuis Vigie

Après avoir configuré `.env` avec `WXO_ENABLED=true` :

```bash
# Démarrer l'application
npm run dev

# Dans un autre terminal, tester avec un cookie de session
# 1. Se connecter
curl -c /tmp/vigie-cookies.txt \
  -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vigie.fr","password":"demo1234"}'

# 2. Envoyer un message à Vigi AI
curl -b /tmp/vigie-cookies.txt \
  -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Trouve-moi des BUT informatique à Toulouse"}'
```

**Résultat attendu :**
```json
{
  "reply": "Voici les formations BUT Informatique disponibles à Toulouse...",
  "conversationId": "...",
  "toolCalls": [{"tool": "search_formations", "success": true, "durationMs": 850}],
  "correlationId": "..."
}
```

---

## Résumé des commandes ADK 2.19.1

| Action | Commande |
|---|---|
| Vérifier la version | `.venv/bin/orchestrate --version` |
| Lister les environnements | `.venv/bin/orchestrate env list` |
| Ajouter un environnement | `.venv/bin/orchestrate env add --name xxx --url https://... --activate` |
| Lister les modèles | `.venv/bin/orchestrate models list` |
| Importer les outils | `.venv/bin/orchestrate tools import --kind openapi -f ai/tools/vigie_openapi.yaml` |
| Lister les outils | `.venv/bin/orchestrate tools list` |
| Importer l'agent | `.venv/bin/orchestrate agents import -f ai/agents/vigi_ai.yaml` |
| Lister les agents | `.venv/bin/orchestrate agents list` |
| Supprimer un agent | `.venv/bin/orchestrate agents remove --name vigi_ai --kind native` |

---

## Limitations connues

| Limitation | Impact | Solution |
|---|---|---|
| localhost non accessible depuis AWS | Outils OpenAPI ne peuvent pas appeler localhost | ngrok pour la démo / Tool Execution Loop pour la prod |
| Clé API MCSP ≠ IBM Cloud IAM key | Méthode d'auth différente | Clé API générée dans WXO directement |
| `python-dateutil 3.0.0` vs `ibm-cos-sdk-core` | Warning de dépendance | Non bloquant pour l'ADK |
| Modèle peut ne pas être disponible | granite-3-3-8b peut manquer | Vérifier `models list` et adapter `vigi_ai.yaml` |
| Essai SaaS limité dans le temps | Peut expirer | `WXO_ENABLED=false` → mode dégradé actif |

---

## Réinstallation complète

```bash
# 1. Nettoyer
rm -rf .venv .data/vigie.db

# 2. Réinstaller Python ADK
python3 -m venv .venv
.venv/bin/pip install git+https://github.com/IBM/ibm-watsonx-orchestrate-adk

# 3. Reconfigurer WXO
.venv/bin/orchestrate env add \
  --name vigie-prod \
  --url $WXO_INSTANCE_URL \
  --activate

# 4. Importer les outils et l'agent
.venv/bin/orchestrate tools import --kind openapi -f ai/tools/vigie_openapi.yaml
.venv/bin/orchestrate agents import -f ai/agents/vigi_ai.yaml

# 5. Démarrer Vigie
npm run dev
```
