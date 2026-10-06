import crypto from 'crypto';

const KNOWN_WEAK_SECRETS = new Set([
  'gsm_tunisia_jwt_super_secret_access_key_2024',
  'gsm_tunisia_jwt_super_secret_key_2024_secure',
  'MY_JWT_SECRET',
  'secret',
  'changeme',
]);

export const isProduction = process.env.NODE_ENV === 'production';

function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;

  if (fromEnv && fromEnv.length >= 32 && !KNOWN_WEAK_SECRETS.has(fromEnv)) {
    return fromEnv;
  }

  if (isProduction) {
    throw new Error(
      'JWT_SECRET manquant ou trop faible. Définissez une valeur aléatoire d’au moins 32 caractères ' +
        '(ex: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))").'
    );
  }

  // Development: random per-process secret (sessions reset on restart) instead of a public default.
  console.warn(
    '[SECURITY] JWT_SECRET absent/faible : un secret aléatoire temporaire est utilisé (développement uniquement).'
  );
  return crypto.randomBytes(48).toString('hex');
}

export const JWT_SECRET = resolveJwtSecret();
export const JWT_ALGORITHM = 'HS256' as const;
