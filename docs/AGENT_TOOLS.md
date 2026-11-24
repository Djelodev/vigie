# Outils de l'agent Vigi AI

> Documentation des 14 outils métier · lib/ai-tools.ts

## Architecture

Les outils sont exécutés **localement** dans le serveur Next.js via la Tool Execution Loop.
Ils accèdent directement à la BDD SQLite locale et à l'API Parcoursup officielle.

---

## Outils de recherche et d'analyse (publics)

### `search_formations`

Recherche des formations Parcoursup par critères.

**Paramètres :**
| Param | Type | Obligatoire | Description |
|---|---|---|---|
| `q` | string | Non | Mots-clés de recherche |
| `filiere` | string | Non | Filière (BUT, BTS, Licence…) |
| `region` | string | Non | Région (nom exact) |
| `ville` | string | Non | Ville (recherche partielle) |
| `departement` | string | Non | Code département |
| `statut` | enum | Non | `public` ou `prive` |
| `selectivite` | enum | Non | `selective` ou `non_selective` |
| `limit` | number | Non | 1–20 (défaut : 10) |

**Contraintes :** au moins un critère requis.

**Retour :** `{ total, formations[{id, nom, etablissement, filiere, ville, region, tauxAcces, ...}], fromCache, source }`

---

### `get_formation_details`

Fiche complète d'une formation par son identifiant.

**Paramètres :**
| Param | Type | Obligatoire | Description |
|---|---|---|---|
| `id` | string | Oui | `cod_aff_form` Parcoursup |

**Retour :** `{ found, formation, source }` ou `{ found: false }`

---

### `get_formation_statistics`

Statistiques détaillées avec définitions.

**Paramètres :** `id` (string, obligatoire)

**Retour :** toutes les statistiques avec `{ valeur, unite, definition }` + avertissement sur la nature historique des données.

---

### `compare_formations`

Compare jusqu'à 4 formations côte à côte.

**Paramètres :**
| Param | Type | Obligatoire | Description |
|---|---|---|---|
| `ids` | string[] | Oui | 2 à 4 identifiants Parcoursup |

**Retour :** `{ formations[], criteres[], source, avertissement }`

---

### `get_alternative_formations`

Trouve des alternatives selon les critères.

**Paramètres :** `filiere`, `region`, `q` (au moins un requis), `limit`

---

### `get_official_deadlines`

Calendrier officiel Parcoursup 2025.

**Paramètres :** aucun

**Retour :** toutes les échéances avec `{ label, date, type, passed }` + source officielle.

---

## Outils utilisateur (authentifiés)

Ces outils vérifient que l'utilisateur est connecté via la session serveur.

### `get_user_preferences`

Préférences de l'utilisateur.

**Retour :** `{ hasPreferences, preferences: { niveau, typeBac, interets, domaines, regions, mobilite, budget, alternance } }`

---

### `get_user_favorites`

Formations sauvegardées (max 20).

**Retour :** `{ count, favorites[{ codAff, status, notes, priority, listName }] }`

---

### `get_user_progress`

Tâches et progression (max 20 tâches).

**Retour :** `{ progression (%), taches[], resume }`

---

### `get_user_reminders`

Rappels en attente (max 10).

**Retour :** `{ count, rappels[{ id, label, note, dueDate }] }`

---

## Outils de proposition (actions confirmées)

Ces outils ne modifient rien directement.
Ils créent une **PendingAction** stockée en BDD, retournée au client pour confirmation.

La confirmation passe par `POST /api/ai/actions { actionId, decision: "confirm" | "cancel" }`.

### `propose_add_favorite`

| Param | Type | Obligatoire |
|---|---|---|
| `codAff` | string | Oui |
| `formationNom` | string | Non |

Vérifie que la formation n'est pas déjà en favori avant de proposer.

---

### `propose_create_reminder`

| Param | Type | Obligatoire |
|---|---|---|
| `label` | string | Oui |
| `note` | string | Non |
| `dueDate` | string ISO 8601 | Oui |

---

### `propose_create_task`

| Param | Type | Obligatoire |
|---|---|---|
| `label` | string | Oui |
| `note` | string | Non |
| `dueDate` | string ISO 8601 | Non |
| `category` | enum | Non | `general`, `orientation`, `parcoursup`, `admin`, `autre` |

---

### `propose_update_choice_status`

| Param | Type | Obligatoire |
|---|---|---|
| `codAff` | string | Oui |
| `status` | enum | Oui | `a_decouvrir`, `en_reflexion`, `favori`, `candidature_soumise`, `accepte`, `refuse` |

---

## Tests manuels des outils

```bash
# 1. Formation existante
curl "http://localhost:3000/api/formations/25184"

# 2. Identifiant inexistant
curl "http://localhost:3000/api/formations/INEXISTANT_999"

# 3. Recherche sans résultat
curl "http://localhost:3000/api/formations?q=xyzformationinexistante"

# 4. Paramètres invalides (filtre non accepté → ignoré)
curl "http://localhost:3000/api/formations?statut=inconnu"

# 5. Utilisateur non authentifié
curl "http://localhost:3000/api/favorites"
# → 401

# 6. Action sans auth
curl -X POST "http://localhost:3000/api/ai/actions" \
  -H "Content-Type: application/json" \
  -d '{"actionId":"fake","decision":"confirm"}'
# → 401
```
