import 'dotenv/config'; // must be first: loads .env (DATABASE_URL, JWT_SECRET...) before anything else
import { pathToFileURL } from 'url';
import { createApp } from './server/app';
import { initDatabase, disconnectDatabase } from './server/db/client';

export async function startServer() {
  const { app, port, dispose } = await createApp();
  await initDatabase();

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`> Outils Réparation GSM Tunisie`);
    console.log(`> Server running on: http://0.0.0.0:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || '(non défini → production)'}`);
    console.log(`====================================================`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nReceived ${signal}. Shutting down server gracefully...`);

    // Garde-fou : on force l'arrêt si des connexions restent ouvertes
    setTimeout(() => process.exit(1), 10_000).unref();

    // Ferme SSE avant server.close(), sinon les connexions ouvertes empêchent son callback.
    const disposePromise = dispose();
    server.close(async () => {
      try {
        await disposePromise;
        await disconnectDatabase();
      } finally {
        console.log('HTTP server closed.');
        process.exit(0);
      }
    });
    server.closeIdleConnections();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

// Démarre seulement quand le fichier est lancé directement (pas quand un test l'importe)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((err) => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  });
}

export default startServer;
