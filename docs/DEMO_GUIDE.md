# Guide de démonstration — Vigi AI
> Bobathon ESGI · IBM · Arrow — Segment IA : ~90 secondes

## Préparation avant la démo

### 1. Démarrer l'application

```bash
cd project-hackaton
npm run dev
# → http://localhost:3000
```

### 2. Configurer Vigi AI

```bash
# Dans .env
WXO_ENABLED=true
WXO_INSTANCE_URL=https://VOTRE-INSTANCE.app.aws.watsonxorchestrate.ibm.com
WXO_API_KEY=VOTRE_CLE
WXO_AGENT_ID=vigi_ai
```

### 3. Créer un compte de démonstration isolé

1. Ouvrir `http://localhost:3000`
2. Créer un compte : `demo@vigie.fr` / `demo1234`
3. Vider les favoris et tâches si nécessaire

### 4. Vérifier que l'agent répond

```bash
curl -s -b cookies.txt \
  -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour, tu fonctionne ?"}'
```

---

## Scénario de démonstration Vigi AI (90 secondes)

> Contexte : un étudiant cherche une formation en informatique à Toulouse en alternance.

### ⏱ Secondes 0–15 — Ouverture de Vigi AI

1. Afficher http://localhost:3000 avec l'application Vigie
2. Cliquer sur **Vigi AI** dans la navigation latérale
3. Montrer l'interface conversationnelle propre avec suggestions

**Message clé** : *"Voici Vigi AI — propulsé par IBM watsonx Orchestrate."*

### ⏱ Secondes 15–35 — Recherche réelle

Taper dans le chat :
> *"Je veux travailler dans l'informatique, étudier à Toulouse ou dans les environs, et je préfère l'alternance."*

Vigi doit :
1. Comprendre la demande
2. Appeler `search_formations` avec `q="informatique alternance" region="Occitanie" ville="Toulouse"`
3. Afficher des formations réelles avec taux d'accès et liens officiels

**Message clé** : *"Vigi interroge en temps réel les 14 252 formations Parcoursup 2025."*

### ⏱ Secondes 35–55 — Comparaison

Taper :
> *"Compare les 3 premières formations."*

Vigi doit appeler `compare_formations` et présenter une comparaison structurée.

**Message clé** : *"Chaque chiffre est vérifiable — le jury peut cliquer sur le lien Parcoursup."*

### ⏱ Secondes 55–75 — Action sécurisée

Taper :
> *"Ajoute la première formation à mes favoris."*

Vigi doit :
1. Appeler `propose_add_favorite`
2. Afficher la **carte de confirmation** (pas d'exécution automatique !)
3. L'utilisateur clique **Confirmer**
4. L'action est exécutée via `/api/ai/actions`

**Message clé** : *"L'IA propose, l'étudiant décide. Aucune écriture sans confirmation explicite."*

### ⏱ Secondes 75–90 — Vérification

Taper :
> *"Montre-moi mes formations sauvegardées."*

Vigi appelle `get_user_favorites` et confirme que la formation est bien enregistrée.

**Ou** : naviguer dans **Mes choix** pour montrer la persistance en BDD.

---

## Points à mettre en avant

| Point | Preuve visible |
|---|---|
| Données réelles | Noms de formations, taux d'accès, liens Parcoursup |
| IBM watsonx | Badge "IBM watsonx Orchestrate" dans l'interface |
| Sécurité | Carte de confirmation avant tout ajout |
| Pas d'hallucination | Si formation inexistante : "Aucun résultat trouvé" |
| Mode dégradé | App Vigie fonctionnelle si IBM indisponible |

---

## Scénario alternatif (si IBM indisponible)

Si watsonx Orchestrate ne répond pas :

1. L'interface affiche : *"Vigi AI est temporairement indisponible. L'application Vigie reste disponible."*
2. Montrer que la recherche, les favoris, le comparateur fonctionnent normalement
3. **Message clé** : *"Le feature flag garantit que Vigie ne dépend pas de la disponibilité de l'IA."*

---

## Commandes de vérification rapide avant démo

```bash
# 1. API Parcoursup disponible ?
curl http://localhost:3000/api/formations?limit=1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('total')==14252 else 'PROBLEME')"

# 2. Vigi AI configurée ?
# WXO_ENABLED=true dans .env et agent déployé dans WXO

# 3. Base de données propre ?
# Supprimer .data/vigie.db et redémarrer pour repartir de zéro
```
