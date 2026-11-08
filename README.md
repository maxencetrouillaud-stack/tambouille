# Tambouille

Assistant culinaire anti-gaspi : inventaire, scan IA, recettes selon le stock, mode cuisine, planning, courses et nutrition.
Une seule base de code pour quatre versions :

| Version | Où | Données | IA |
|---|---|---|---|
| Artefact Claude | claude.ai | compte Claude | incluse |
| Site web / PWA | Vercel (`tambouille-vercel`) | compte Tambouille (Supabase) | via `/api/ai` |
| Android (APK) | GitHub Release | compte Tambouille | via `/api/ai` |
| Windows (installateur NSIS) | GitHub Release | compte Tambouille | via `/api/ai` |

## Structure
- `src/` : sources de l’appli (`core.js` logique pure, `recipes.js`, `app.js` interface, `options.js` options avancées, `cloud.js` comptes/synchro/IA/installation, `boot.js`, `shell.html` styles).
- `tools/build_web.py` : assemble `web/index.html` à partir de `src/` (à relancer après chaque modification).
- `web/` : site statique (manifest PWA, service worker, icônes).
- `api/ai.js` : fonction Vercel qui relaie les requêtes IA vers Anthropic (clé côté serveur, utilisateurs connectés uniquement, limite de débit).
- `scripts/build.mjs` : build Vercel (copie `web/` → `public/`, ajoute supabase-js et `version.json`).
- `desktop/` : application Windows (Electron + electron-builder, installateur NSIS, raccourci bureau et menu Démarrer).
- `mobile/` : application Android (Capacitor 6, permission caméra, icônes et écran de démarrage).
- `.github/workflows/apps.yml` : construit le site, l’APK et l’installateur ; teste les comptes, l’installation Android (émulateur) et Windows ; publie la release.
- `tests/e2e-auth.mjs` : test réel des comptes, de la synchronisation multi-appareils, du temps réel, des règles RLS et de la suppression de compte.

## Base de données (Supabase, projet `tambouille`, région Paris)
- `profiles` (prénom, nom, photo) : créé automatiquement à l’inscription.
- `user_data` (un document JSON par clé : inventaire, planning, courses, favoris, historique, préférences, allergies…) avec temps réel.
- Bucket privé `photos`, un dossier par utilisateur.
- RLS stricte : chaque utilisateur ne lit et n’écrit que ses lignes et son dossier ; aucun accès anonyme.
- `delete_my_account()` : suppression définitive du compte, des données et des photos par l’utilisateur lui-même.

## Configuration à faire (une fois)
1. **Supabase → Authentication → URL Configuration** : *Site URL* = `https://tambouille-vercel.vercel.app` ; *Redirect URLs* : `https://tambouille-vercel.vercel.app/**`. Sans cela, les liens de confirmation et de réinitialisation renvoient vers `localhost`.
2. **Emails (confirmation, mot de passe oublié)** : le service d’email intégré de Supabase n’envoie qu’aux membres de l’organisation et quelques messages par heure. Pour de vrais utilisateurs : *Authentication → Emails → SMTP Settings* avec un fournisseur (Resend, Brevo, Mailjet…) : hôte, port, utilisateur, mot de passe, adresse d’expédition.
3. **Connexion Google (facultatif)** : créer un identifiant OAuth « Application Web » dans Google Cloud Console (URI de redirection : `https://ufqdplmibnczqnpmkgjq.supabase.co/auth/v1/callback`), puis renseigner *Client ID* et *Client Secret* dans *Authentication → Providers → Google*.
4. **IA hors Claude** : dans Vercel → projet `tambouille-vercel` → *Settings → Environment Variables* : `ANTHROPIC_API_KEY` (obligatoire), `ANTHROPIC_MODEL` (facultatif, défaut `claude-sonnet-5-5`). Redéployer ensuite.
5. **Accès au site** : la protection Vercel (connexion Vercel obligatoire) est active. Les comptes protègent déjà chaque donnée ; pour ouvrir le site au public et permettre aux applis Android/Windows d’utiliser l’IA et la détection de mise à jour, désactiver *Settings → Deployment Protection → Vercel Authentication*.
6. **Déploiement automatique** : Vercel → `tambouille-vercel` → *Settings → Git* → connecter le dépôt `tambouille`.

## Développer et publier
```bash
python3 tools/build_web.py          # après toute modification de src/
npm install && npm run build        # vérifier le build web en local (public/)
git commit -am "…" && git push      # Vercel redéploie le site (si le dépôt est connecté)
git tag v3.1.1 && git push --tags   # construit et publie APK + installateur dans une release
```
Penser à aligner la version dans `package.json`, `desktop/package.json`, `mobile/package.json`, `src/cloud.js` (`APP_VERSION`) et `VERSION` dans le workflow.

## Installation
- **Android** : télécharger `Tambouille-<version>.apk` depuis la release, l’ouvrir et autoriser l’installation depuis cette source. APK signé avec la clé de débogage (installation directe ; pour le Play Store, il faudra une clé de signature de production).
- **Windows** : lancer `Tambouille-Setup-<version>.exe`. Windows SmartScreen peut afficher un avertissement (installateur non signé) : *Informations complémentaires → Exécuter quand même*.
- **iPhone / iPad** : ouvrir le site dans Safari → Partager → *Sur l’écran d’accueil*.
- **Ordinateur / Android (web)** : bouton « Installer l’application » dans *Profil → Installer*, ou menu du navigateur.
- **Mises à jour** : le site se met à jour seul ; les applis installées affichent « Nouvelle version disponible » (si le site est public) et se mettent à jour en installant la nouvelle version.
