# Sources de données — Vigie V2

## Source principale : Parcoursup officiel

| Champ | Valeur |
|---|---|
| **Fournisseur** | Ministère de l'Enseignement supérieur et de la Recherche |
| **Plateforme** | data.enseignementsup-recherche.gouv.fr |
| **Jeu de données** | `fr-esr-parcoursup` |
| **Millésime** | Session 2025 |
| **Nombre d'enregistrements** | 14 252 (vérifié le 2026-11-24) |
| **Licence** | Licence Ouverte Etalab 2.0 |
| **API** | ODSQL — ODS Explore v2.1 |
| **URL API** | `https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/records` |
| **URL dataset** | `https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-parcoursup` |

### Champs utilisés

| Champ source | Type | Description |
|---|---|---|
| `cod_aff_form` | String | Identifiant stable de la formation |
| `session` | String | Année de campagne |
| `cod_uai` | String | Code UAI établissement |
| `g_ea_lib_vx` | String | Nom de l'établissement |
| `lib_for_voe_ins` | String | Libellé de la formation |
| `lib_comp_voe_ins` | String | Libellé complet |
| `fili` | String | Filière (Licence, BTS, BUT, etc.) |
| `form_lib_voe_acc` | String | Type de formation |
| `select_form` | String | Sélective / Non sélective |
| `contrat_etab` | String | Public / Privé |
| `dep` | String | Code département |
| `dep_lib` | String | Nom département |
| `region_etab_aff` | String | Région |
| `acad_mies` | String | Académie |
| `ville_etab` | String | Ville |
| `g_olocalisation_des_formations` | Object | Coordonnées géographiques |
| `capa_fin` | Integer | Capacité d'accueil finale |
| `voe_tot` | Integer | Total vœux |
| `prop_tot` | Integer | Total propositions |
| `acc_tot` | Integer | Total admis |
| `taux_acces_ens` | Integer | Taux d'accès officiel (%) |
| `pct_f` | Float | % femmes admises |
| `pct_bg` | Float | % bac général admis |
| `pct_bt` | Float | % bac technologique admis |
| `pct_bp` | Float | % bac professionnel admis |
| `lien_form_psup` | String | URL fiche Parcoursup officielle |

### Définitions officielles

> **Taux d'accès** = nombre d'admis / nombre de candidats classés en liste d'appel.
> Ce taux **ne représente pas** la probabilité individuelle d'admission.
> Source : [Glossaire Parcoursup](https://www.parcoursup.gouv.fr/index.php?desc=glossaire)

### Stratégie de cache

- Cache HTTP Next.js : `revalidate: 3600` (1 heure) sur les requêtes API
- Cache SQLite local : activé automatiquement si l'API est indisponible
- Affichage de l'indicateur "cache" lorsque les données proviennent du cache local

### Limitations connues

- Le dataset n'inclut pas les frais de scolarité détaillés
- Les coordonnées géographiques peuvent être manquantes pour certains établissements
- Les données sont celles de la campagne 2025 — les données 2026 ne sont pas encore publiées

---

## Calendrier Parcoursup 2025

Dates manuellement vérifiées et intégrées dans `lib/notifications.ts` :

| Date | Événement |
|---|---|
| 15 janvier 2025 | Ouverture du service |
| 22 janvier 2025 | Début de la saisie des vœux |
| 13 mars 2025 | Date limite de saisie des vœux |
| 10 avril 2025 | Date limite de confirmation |
| 30 mai 2025 | Début phase principale d'admission |
| 11 juillet 2025 | Fin phase principale / début phase complémentaire |
| 12 septembre 2025 | Fermeture de Parcoursup |

> ⚠️ Ces dates sont indicatives. Vérifier toujours sur [parcoursup.gouv.fr](https://www.parcoursup.gouv.fr).

---

## API supplémentaire (ancienne, à supprimer)

| Champ | Valeur |
|---|---|
| **Nom** | RappelConso |
| **URL** | `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records` |
| **Statut** | ⚠️ HORS-SUJET — Route `/api/recalls` conservée mais à ne plus utiliser |
| **Action** | Désactiver ou supprimer lors de la prochaine itération |

---

## Référence

Toutes les données Parcoursup utilisées dans Vigie sont couvertes par la **Licence Ouverte Etalab version 2.0**.

Mention légale affichée dans l'application :
> *Source : Ministère de l'Enseignement supérieur et de la Recherche — data.enseignementsup-recherche.gouv.fr · Session 2025*
