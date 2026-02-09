# /veille-youtube - Ouvrir l'app YouTube Veille

Ouvre l'application YouTube Veille déployée sur Azure dans le navigateur avec authentification automatique.

## Instructions

1. Ouvre l'URL avec Basic Auth intégrée dans le navigateur :
   ```bash
   xdg-open "https://eric:XcR4fdh3OnQFD+gotmFQ@veille-eric.francecentral.cloudapp.azure.com" 2>/dev/null &
   ```

2. Affiche un résumé :
   - URL : `https://veille-eric.francecentral.cloudapp.azure.com`
   - Connexion automatique avec Basic Auth
   - Si le site ne répond pas, vérifier que la VM Azure est démarrée

## Options

- `/veille-youtube` - Ouvre l'app dans le navigateur
- `/veille-youtube status` - Vérifie que l'app est en ligne (curl)
