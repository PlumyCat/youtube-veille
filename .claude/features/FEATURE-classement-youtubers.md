# Feature: Classement par YouTubers

> Créée le: 2026-01-25
> Status: done

## Objectif

Ajouter un système de groupement/classement des vidéos par YouTuber sur la page d'accueil, permettant de visualiser les vidéos organisées par chaîne plutôt qu'en liste chronologique.

## Contexte technique

- Projet: youtube-veille (Next.js 16 + SQLite/Drizzle)
- Les vidéos ont déjà un `channelId` et `channelName`
- Table `channels` existante avec `id`, `name`, `thumbnail`

## Scope exact (UNIQUEMENT ces fichiers/actions)

- [x] `src/app/page.tsx` - Ajouter toggle vue "Par date" / "Par chaîne"
- [x] `src/app/page.tsx` - Implémenter le groupement côté client
- [x] `src/components/ChannelGroup.tsx` - Créer composant de groupe par chaîne (collapsible)

## Critères d'acceptance

- [ ] Toggle visible dans le header entre "Par date" et "Par chaîne"
- [ ] Vue "Par chaîne" : vidéos groupées avec header par YouTuber
- [ ] Chaque groupe affiche le nom de la chaîne et le nombre de vidéos
- [ ] Les groupes sont collapsibles (expand/collapse)
- [ ] La sélection multiple fonctionne dans les deux vues
- [ ] État du toggle persisté en localStorage
- [ ] Pas de régression sur la vue chronologique existante

## Tests à effectuer

### Tests manuels
- [ ] Basculer entre les deux modes d'affichage
- [ ] Vérifier que toutes les vidéos apparaissent dans les deux modes
- [ ] Sélectionner des vidéos en mode "Par chaîne" et transcrire
- [ ] Expand/collapse des groupes de chaînes
- [ ] Rafraîchir la page et vérifier la persistence du mode

## Guardrails (INTERDIT)

- NE PAS modifier le schéma de base de données
- NE PAS modifier l'API `/api/videos`
- NE PAS supprimer de fonctionnalités existantes
- NE PAS modifier les fichiers hors scope

## Décisions validées

1. **Ordre des groupes** : Par date de dernière vidéo (chaîne avec vidéo la plus récente en premier)
2. **État par défaut des groupes** : Tous ouverts
3. **Tri dans les groupes** : Par date (récent → ancien)

## Completion Promise

Quand TOUS les critères sont verts, output:
<promise>FEATURE COMPLETE</promise>

## Historique des itérations

| # | Date | Action | Résultat |
|---|------|--------|----------|
| 1 | 2026-01-25 | Story créée | En attente validation |
| 2 | 2026-01-25 | Clarifications validées | Prêt pour implémentation |
| 3 | 2026-01-25 | Implémentation | ChannelGroup.tsx créé, page.tsx modifié |
