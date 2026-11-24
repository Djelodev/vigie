# Plan d'intégration IA — Vigie + IBM watsonx Orchestrate

> Document préparatoire · Ne pas implémenter avant validation de la mission IA.

## Objectif

Exposer les services métier de Vigie à un agent IBM watsonx Orchestrate,
afin que l'assistant Vigi puisse aider les étudiants via une interface conversationnelle.

## Capacités futures envisagées

| Capacité | Endpoint métier | Prêt pour exposition |
|---|---|---|
| Rechercher des formations | `GET /api/formations` | ✅ Oui |
| Obtenir une fiche formation | `GET /api/formations/[id]` | ✅ Oui |
| Lister les filtres disponibles | `GET /api/formations/filters` | ✅ Oui |
| Consulter les favoris | `GET /api/favorites` | ⚠️ Auth requise |
| Ajouter un favori | `POST /api/favorites` | ⚠️ Auth requise |
| Consulter les tâches | `GET /api/tasks` | ⚠️ Auth requise |
| Créer une tâche | `POST /api/tasks` | ⚠️ Auth requise |
| Consulter les notifications | `GET /api/notifications` | ⚠️ Auth requise |
| Consulter les échéances | Données statiques calendrier | ✅ Oui (read-only) |
| Comparer des formations | `GET /api/formations` × n | ✅ Oui |

## Schéma Formation (openapi-compatible)

```json
{
  "Formation": {
    "type": "object",
    "properties": {
      "id":           { "type": "string", "description": "Identifiant stable cod_aff_form" },
      "nom":          { "type": "string", "description": "Libellé de la formation" },
      "etablissement":{ "type": "string", "description": "Nom de l'établissement" },
      "filiere":      { "type": "string", "description": "Filière (BUT, BTS, Licence, ...)" },
      "ville":        { "type": "string" },
      "region":       { "type": "string" },
      "statut":       { "type": "string", "enum": ["public", "prive"] },
      "selectivite":  { "type": "string", "enum": ["selective", "non_selective"] },
      "capacite":     { "type": "integer" },
      "voeux":        { "type": "integer" },
      "admis":        { "type": "integer" },
      "tauxAcces":    { "type": "integer", "description": "Taux d'accès officiel (%)" },
      "lienParcoursup": { "type": "string", "format": "uri" },
      "session":      { "type": "string" },
      "sourceLabel":  { "type": "string" }
    }
  }
}
```

## Contraintes de sécurité

- Les endpoints privés (favoris, tâches, notifications) ne doivent jamais être accessibles sans authentification
- L'agent watsonx ne doit pas avoir accès aux données d'un utilisateur sans présentation d'un token valide
- Aucune donnée personnelle ne doit transiter vers un service externe sans consentement explicite

## Prochaines étapes (hors-scope mission actuelle)

1. Générer un fichier OpenAPI spec depuis les routes API existantes
2. Créer un fichier `watsonx.openapi.json` exposant les endpoints publics
3. Configurer watsonx Orchestrate avec ce fichier
4. Implémenter l'interface conversationnelle Vigi
5. Tests d'intégration agent ↔ API

## Note sur l'assistant Vigi

Vigi est actuellement une mascotte statique. Elle ne génère aucune réponse IA.
Toute intégration IA doit être clairement signalée à l'utilisateur.
