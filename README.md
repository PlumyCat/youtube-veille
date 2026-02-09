# YouTube Veille

Application web pour suivre les vidéos YouTube de chaînes tech/IA, transcrire les vidéos sélectionnées, et générer des résumés pour la veille technologique.

## Fonctionnalités

- **Gestion des chaînes** : Ajouter/supprimer des chaînes YouTube
- **Liste des vidéos** : Dashboard avec les vidéos récentes, filtres par statut
- **Transcription** : Extraction des sous-titres YouTube, fallback Gemini AI si indisponibles
- **Lecture** : Affichage de la transcription complète avec actions rapides

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | SQLite (via Drizzle ORM) |
| YouTube | YouTube Data API v3 |
| Transcription | yt-dlp (sous-titres YouTube) + Gemini 2.0 Flash (fallback) |

## Installation

### Prérequis

- Node.js 18+
- npm
- Une clé API Google (YouTube Data API v3 + Gemini API)

### Obtenir une clé API YouTube

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet
3. Activer les APIs "YouTube Data API v3" et "Generative Language API" (Gemini)
4. Créer des identifiants (clé API)
5. Copier la clé

### Setup

```bash
# Cloner le repo
git clone https://github.com/PlumyCat/youtube-veille.git
cd youtube-veille

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local et ajouter votre YOUTUBE_API_KEY

# Initialiser la base de données
npm run db:push

# Lancer en développement
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Note importante : Protection anti-bot YouTube

YouTube détecte et bloque les accès via des outils d'automatisation (Puppeteer, Playwright, Chrome DevTools Protocol, etc.). **Cette application doit être utilisée dans un navigateur normal**, pas via des MCP comme `chrome-devtools` ou `chrome-gui`.

### Pourquoi ?

- YouTube vérifie les signatures du navigateur et bloque les bots
- La transcription utilise `yt-dlp --cookies-from-browser chrome` pour réutiliser tes cookies d'authentification
- L'interface web est conçue pour une utilisation manuelle

### Workflow avec Claude Code

```
Toi (navigateur)              Claude (terminal)
─────────────────             ──────────────────
http://localhost:3000
 → Gérer les chaînes
 → Sélectionner vidéos
 → Cliquer "Transcrire"
                              /veille analyze
                               → Lit la DB SQLite
                               → Analyse les transcripts
                               → Documente les findings
```

## Utilisation

1. **Ajouter une chaîne** : Aller sur "Gérer les chaînes" et entrer l'URL ou le handle d'une chaîne YouTube
2. **Voir les vidéos** : Les 10 dernières vidéos de chaque chaîne sont automatiquement récupérées
3. **Transcrire** : Sélectionner une ou plusieurs vidéos et cliquer sur "Transcrire la sélection"
4. **Lire** : Cliquer sur une vidéo pour voir sa transcription complète

## Scripts disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Build pour production
npm run start        # Lancer en production
npm run db:push      # Appliquer le schéma à la DB
npm run db:studio    # Ouvrir Drizzle Studio (GUI DB)
```

## Structure du projet

```
youtube-veille/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard vidéos
│   │   ├── channels/page.tsx     # Gestion chaînes
│   │   ├── video/[id]/page.tsx   # Détail vidéo
│   │   └── api/                  # Routes API
│   ├── components/               # Composants React
│   ├── lib/                      # Utilitaires (DB, YouTube, etc.)
│   └── db/                       # Schéma Drizzle
├── data/                         # Base SQLite (créé automatiquement)
├── drizzle.config.ts
└── .env.local                    # Configuration (non versionné)
```

## Roadmap (v2)

- [ ] Résumé automatique via Claude API
- [ ] Tags/catégories pour les vidéos
- [ ] Export markdown pour veille.md
- [ ] Notifications de nouvelles vidéos
- [x] ~~Support Whisper pour vidéos sans sous-titres~~ Remplacé par Gemini 2.0 Flash

## License

MIT
