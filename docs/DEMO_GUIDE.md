# Guide de démonstration — Vigie V2
> Bobathon ESGI · IBM · Arrow — Durée : 5 minutes

## Préparation avant la démo

### 1. Démarrer l'application

```bash
cd project-hackaton
pnpm run dev
# Accès sur http://localhost:3000
```

### 2. Créer le compte de démonstration

1. Ouvrir `http://localhost:3000`
2. Cliquer sur **Découvrir mon espace**
3. Cliquer sur **Créer un compte** dans la navigation
4. Renseigner :
   - Prénom : `Alex`
   - E-mail : `demo@vigie.fr`
   - Mot de passe : `demo1234`
5. Se connecter automatiquement

### 3. Vérifier les données

```bash
curl http://localhost:3000/api/formations?limit=1
# Doit retourner fromCache: false et 14252 formations
```

---

## Scénario de démonstration (5 minutes)

### ⏱ Minute 1 — La page d'accueil (30 s)

1. Afficher `http://localhost:3000`
2. Mettre en avant le **slogan** et la **mascotte Vigi**
3. Cliquer sur **Commencer à explorer**

**Message clé** : *"Vigie est un assistant indépendant d'orientation basé sur les données officielles Parcoursup."*

### ⏱ Minute 1–2 — Recherche réelle (1 min 30 s)

1. Aller sur **Explorer**
2. Taper `informatique` dans la barre de recherche
3. Montrer le compteur de résultats → **données officielles 2025**
4. Appliquer le filtre **BUT**
5. Filtrer par région **Île-de-France**
6. Montrer la **pagination** et les **badges officiels**

**Message clé** : *"14 252 formations réelles du Ministère de l'Enseignement supérieur, session 2025."*

### ⏱ Minute 2–3 — Fiche de formation (1 min)

1. Cliquer sur **Voir la fiche** d'une formation
2. Montrer les statistiques officielles :
   - Capacité d'accueil
   - Nombre de candidatures
   - Nombre d'admis
   - **Taux d'accès officiel**
3. Montrer le **graphique répartition par bac**
4. Cliquer sur **Ajouter** (favori)
5. Montrer le lien **Fiche Parcoursup officielle**

**Message clé** : *"Chaque donnée affiche sa source et son année. Aucune valeur inventée."*

### ⏱ Minute 3 — Comparateur (45 s)

1. Revenir à **Explorer**
2. Cliquer sur **Comparer** sur 2 autres formations
3. Aller sur **Comparer**
4. Montrer les **critères côte à côte**
5. Montrer le **graphique taux d'accès comparé**
6. Montrer le graphique **Candidatures vs Admis**

**Message clé** : *"Comparaison sur données réelles, pas de scores fictifs, transparence totale."*

### ⏱ Minute 3–4 — Suivi personnel (45 s)

1. Aller sur **Mes choix**
2. Montrer la formation ajoutée — **persistante** après navigation
3. Modifier le **statut** (ex. : "À analyser" → "Formation favorite")
4. Cocher une **tâche de préparation**
5. Montrer la **barre de progression**
6. Cliquer sur **Exporter CSV**

**Message clé** : *"Le suivi personnel est persistent grâce à une base de données SQLite locale."*

### ⏱ Minute 4–5 — Alertes et calendrier (1 min)

1. Aller sur **Alertes**
2. Montrer le **calendrier Parcoursup 2025** avec dates officielles
3. Créer un **rappel personnel** : "Vérifier ma lettre de motivation", date dans 30 jours
4. Cliquer sur **Traiter les rappels maintenant** → notification générée
5. Voir la **notification** apparaître dans la liste
6. Montrer le **badge de notification** dans la barre latérale

**Message clé** : *"Les notifications sont générées automatiquement côté serveur à partir d'événements réels."*

### ⏱ Dernière minute — Profil et newsletter (30 s)

1. Aller sur **Mon profil**
2. Montrer le profil de Alex avec ses préférences
3. Montrer le formulaire d'abonnement newsletter
4. Souligner que l'abonnement est **enregistré en base de données**

---

## Points forts à mettre en avant

| Point | Preuve |
|---|---|
| Données réelles | Parcoursup 2025 · 14 252 formations |
| Persistance | SQLite local · rechargement conserve les données |
| Authentification | Mot de passe bcrypt, session sécurisée |
| Calendrier officiel | Dates vérifiées 2025 |
| Transparence | Source affichée sur chaque donnée |
| Pas de simulation | "Données fictives" supprimé, badges "Données officielles 2025" |

---

## En cas de problème réseau

Si l'API Parcoursup est indisponible :
- L'application affiche un indicateur **"cache"**
- Les données du cache SQLite local sont utilisées
- Un message clair est affiché : *"Données du cache local"*

```bash
# Vérifier l'état du cache
curl http://localhost:3000/api/formations?limit=1 | jq '.fromCache'
```

---

## Réinitialisation des données de démo

```bash
# Supprimer la base de données (NE PAS faire en démo !)
rm .data/vigie.db

# Ou conserver les autres utilisateurs et supprimer uniquement le compte démo
# → Se connecter et aller dans Profil → Supprimer le compte
```

---

## Configuration requise

| Élément | Valeur |
|---|---|
| Node.js | >= 18 |
| pnpm | 12.x |
| Réseau | Accès internet pour l'API Parcoursup |
| Port | 3000 (ou 3001 si occupé) |

---

*Vigie V2 · Bobathon ESGI · IBM · Arrow · 2025*
