# Outils Réparation GSM Tunisie

## Prérequis

- Node.js 20 ou plus récent
- npm

## Installation et démarrage en développement

1. Créez le fichier d’environnement local :

   ```powershell
   Copy-Item .env.example .env
   ```

2. Générez un secret JWT aléatoire :

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Copiez la valeur générée dans `JWT_SECRET` dans `.env`. Ne partagez pas et ne commitez pas ce fichier.

3. Renseignez `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env` avant de créer le compte administrateur. Choisissez un mot de passe d’au moins 12 caractères.

4. Installez les dépendances :

   ```powershell
   npm install
   ```

5. Créez ou mettez à jour la base de données :

   ```powershell
   npm run db:migrate
   ```

6. Créez les données et le compte administrateur :

   ```powershell
   npm run db:seed
   ```

   Pour une première installation, `npm run db:setup` exécute la mise à jour du schéma puis le seed.

7. Démarrez l’application :

   ```powershell
   npm run dev
   ```

Le serveur de développement et l’interface sont disponibles sur `http://localhost:3000`.

## Production

Construisez l’interface avec `npm run build`, puis démarrez le serveur avec `npm start`. Configurez les variables nécessaires dans l’environnement de déploiement, notamment `NODE_ENV`, `JWT_SECRET`, `DATABASE_URL` et `CORS_ORIGIN`.
