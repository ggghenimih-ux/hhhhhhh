import 'dotenv/config';
import { z } from 'zod';

// Validation centralisée des variables d'environnement : une seule erreur claire au démarrage
// au lieu d'un échec obscur au premier appel.
const schema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),
  CORS_ORIGIN: z.string().optional().default(''),
  TRUST_PROXY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  RETURN_TOKEN_IN_BODY: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues
      .map((i) => `  - ${i.path.map(String).join('.') || '(env)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuration invalide :\n${lines}`);
  }
  return parsed.data;
}
