# Feature: Installation du projet

> Créée le: 2026-01-24
> Status: done
> Branche: feature/installation-projet

## Objectif

Documenter et valider les étapes d'installation complètes du projet YouTube Veille, incluant la vérification que tout fonctionne correctement après un clone frais.

## Contexte technique

- Projet: youtube-veille
- Stack: Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM + SQLite
- Branche: feature/installation-projet

## Scope exact (UNIQUEMENT ces fichiers/actions)

- [x] Vérifier que `npm install` fonctionne sans erreur
- [x] Vérifier que `.env.example` est présent et documenté
- [x] Vérifier que `npm run db:push` initialise la base correctement
- [x] Vérifier que `npm run dev` lance le serveur sans erreur
- [x] Vérifier que l'application est accessible sur http://localhost:3000
- [x] Tester la navigation de base (dashboard, gestion chaînes)

## Critères d'acceptance

- [x] `npm install` se termine sans erreur
- [x] `.env.local` peut être créé depuis `.env.example`
- [x] La base de données SQLite est créée dans `data/`
- [x] Le serveur de développement démarre
- [x] La page d'accueil s'affiche correctement
- [x] Pas d'erreur dans la console du navigateur
- [x] Pas d'erreur dans les logs serveur

## Tests à effectuer

### Tests automatiques
- [x] `npm run lint` passe sans erreur (après fix let→const)
- [ ] `npm run build` compile sans erreur (non testé)

### Tests manuels (chrome-gui)
- [x] Ouvrir http://localhost:3000
- [x] Vérifier que le dashboard s'affiche
- [x] Naviguer vers la page de gestion des chaînes
- [x] Vérifier absence d'erreurs console

## Guardrails (INTERDIT)

- ~~NE PAS modifier le code source existant~~ (autorisé par l'utilisateur)
- NE PAS changer les dépendances
- NE PAS supprimer de fichiers
- NE PAS modifier la configuration

## Fix appliqué

- `src/lib/transcribe.ts:86` : `let cleanLine` → `const cleanLine` (lint error)

## Completion Promise

<promise>FEATURE COMPLETE</promise>

## Historique des itérations

| # | Date | Action | Résultat |
|---|------|--------|----------|
| 1 | 2026-01-24 | Création de la feature | draft |
| 2 | 2026-01-24 | Configuration clé API YouTube | OK |
| 3 | 2026-01-24 | npm run db:push | OK |
| 4 | 2026-01-24 | npm run dev + tests chrome-gui | OK |
| 5 | 2026-01-24 | Fix lint error | OK |
| 6 | 2026-01-24 | Feature terminée | done |
