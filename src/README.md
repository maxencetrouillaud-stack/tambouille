# Tambouille — documentation technique

## Architecture
Application web monopage publiée en artefact claude.ai : HTML/CSS/JS sans framework ni étape de build serveur.
- `core.js` : logique métier pure, testable sous Node (unités, catégories, DLC/DDM, allergènes, saisonnalité, coûts, analyse recette ↔ stock, filtres, planificateur).
- `recipes.js` : 40 recettes de base (valeurs nutritionnelles estimées par portion).
- `app.js` : interface (10 vues, feuilles, mode cuisine, assistant), persistance, adaptateur IA.
- `shell.html` : structure et styles (thèmes clair/sombre, 4 couleurs d'accent).
- `build.sh` : assemble `index.html` (shell + core + recipes + app).

## Installation
Aucune clé API, aucun fichier `.env`, aucun serveur : l'IA et la base de données sont fournies par la plateforme (capacités `sample`, `db`, `user`, `assets`, `downloads`) et appelées avec le compte de la personne connectée.
1. Modifier les sources, puis lancer `./build.sh`.
2. Republier `index.html` à la même adresse.
Hors claude.ai, la page fonctionne en local (localStorage) sans IA.

## Changer de fournisseur IA
Ajouter une entrée dans `AI_PROVIDERS` (`connect`, `json`, `text`, `images`) puis changer `AI.name`. Une clé secrète ne doit jamais être placée dans la page : passer par un proxy serveur.

## Données (équivalent des migrations)
Un document JSON par clé, dans `data/users/<id>/` (privé à chaque personne) :
`pantry, spaces, moves, shopping, shopLists, plan, hist, ai, notes, stats, fav, views, food, prefs`.
Foyer partagé (optionnel) : collection `foyer`, mêmes clés partagées + `m_<id>` (allergies et régime de chaque membre). Règle d'accès : lecture et écriture au niveau « peut interagir ».
Migration v1 → v2 automatique au chargement (`migrate()`) : nouvelles catégories, type de date, espaces, normalisation des anciennes recettes IA.

## Règles de sécurité alimentaire
- Un aliment dont la DLC est dépassée, ou dont la date estimée l'est, n'est jamais proposé dans une recette.
- DDM dépassée : utilisable, avec avertissement.
- Produits ouverts : date effective = min(date limite, ouverture + durée par catégorie).
- Allergies : exclusion stricte, sur les allergènes déclarés et sur ceux détectés dans les noms d'ingrédients (y compris pour les recettes produites par l'IA).
- Les aliments détectés avec un doute restent marqués « à vérifier » jusqu'à confirmation.

## Tests
- `node` : tests unitaires de `core.js` (catégories, allergènes, régimes, DLC/DDM, conversions, saisie libre, planificateur).
- Playwright : parcours complet des 10 sections, sur mobile et ordinateur, en clair et en sombre, avec une IA et une base simulées, plus une migration depuis des données v1.
