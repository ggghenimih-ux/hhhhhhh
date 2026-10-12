import 'dotenv/config'; // sûr si déjà chargé : garantit que .env est lu même dans les tests / scripts
import crypto from 'crypto';

const KNOWN_WEAK_SECRETS = new Set([
  'gsm_tunisia_jwt_super_secret_access_key_2024',
  'gsm_tunisia_jwt_super_secret_key_2024_secure',
  'MY_JWT_SECRET',
  'secret',
  'changeme',
]);

const nodeEnv = (process.env.NODE_ENV ?? '').trim();

/**
 * Fail-safe : SEULS "development" et "test" sont des environnements non-production.
 * Si NODE_ENV est absent ou mal écrit ("prod", "staging"...), on applique les règles de production
 * (secret JWT obligatoire, cookie Secure, CSP activée).
 */
export const isDevLike = nodeEnv === 'development' || nodeEnv === 'test';
export const isProduction = !isDevLike;

if (!nodeEnv) {
  console.warn('[SECURITY] NODE_ENV non défini : le mode production est appliqué par sécurité.');
}

function isStrongSecret(value: string | undefined): value is string {
  return (
    !!value &&
    value.length >= 32 &&
    new Set(value).size >= 10 && // rejette "aaaa…" ou "1212…"
    !KNOWN_WEAK_SECRETS.has(value)
  );
}

function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (isStrongSecret(fromEnv)) return fromEnv;

  if (isProduction) {
    throw new Error(
      'JWT_SECRET manquant ou trop faible. Définissez une valeur aléatoire d’au moins 32 caractères ' +
        '(ex: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))").'
    );
  }

  console.warn(
    '[SECURITY] JWT_SECRET absent/faible : un secret aléatoire temporaire est utilisé (développement uniquement).'
  );
  return crypto.randomBytes(48).toString('hex');
}

export const JWT_SECRET = resolveJwtSecret();
export const JWT_ALGORITHM = 'HS256' as const;
