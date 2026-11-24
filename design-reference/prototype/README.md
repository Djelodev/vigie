# Vigie — Maquettes responsive V1

Ouvrir index.html dans un navigateur (ou le fichier autonome Vigie_Prototype_Interactif.html). Les 7 vues sont navigables : accueil public (clic logo), tableau de bord, explorer, comparer, mes choix, alertes, profil (avatar sur mobile). Aucun serveur requis pour la version autonome. Les modifications sont simulées en mémoire, réinitialisées au rechargement.

## Règles de cohérence
- Charte V1 : tokens.css original, bleu #090994, accents #2424F5 / #FF4655 / #FFAA00 / #25DBB0 / #7542F5, surfaces #F6F7FB, texte #17172B. Les badges utilisent des teintes sémantiques de la charte et un texte explicite.
- SVG exact du pack logo validé, sans substitution par le logo présent sur la planche de mascotte. Portrait de Vigi recadré depuis la planche validée.
- Plus Jakarta Sans (titres) / Inter (interface) chargées via Google Fonts si connexion disponible. Aucun fichier de police fourni. Captures réalisées hors ligne avec fallback system-ui.
- Carte 20 px, bouton 12 px, grille d'espacement 4/8 px. Quelques exceptions documentées : hero desktop 24 px, landing visual 32 px, composants tactiles ≥44 px en majorité.
- Mobile ≤780 px : navigation basse, profil via avatar, cartes empilées. Desktop : navigation latérale. Même contenu et mêmes états métier.
- Données et établissements fictifs, aucune promesse d'admission, pas de connexion réelle Parcoursup, aucun envoi de newsletter/notification. Le sujet Parcoursup du brief est privilégié, le lien RappelConso incohérent est écarté.

## Tests
Chromium (HTML autonome injecté dans le navigateur de test), 1440×1000 et 390×844 : 7 vues chacune, aucune erreur JS ni débordement horizontal. Navigation vers comparaison, recherche BTS, ajout favori, ouverture/fermeture fiche au clavier, recherche vide, lecture des alertes et checklist vérifiés. Les captures mobiles sont des vues de la fenêtre (défilement possible dans le prototype). Pas d'audit WCAG exhaustif, pas de validation sur tous les appareils ni connexion de données réelle. Les icônes SVG intégrées sont des pictogrammes filaires compatibles visuellement avec Lucide, à remplacer par le package Lucide lors de l'intégration finale si souhaité.

## Handoff à IBM Bob
1. Reprendre les composants et les tokens de index.html et assets/tokens.css, ainsi que les SVG.
2. Implémenter les états de chargement et d'erreur réseau, l'authentification, la persistance et les données officielles autorisées.
3. Conserver les libellés de source, années, et avertissements sur les taux historiques ; valider les règles d'accessibilité.
4. Ne pas transformer le suivi personnel en suivi officiel des candidatures sans intégration autorisée.
