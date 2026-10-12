// Verrouillage temporaire PAR ADRESSE EMAIL (en plus de la limite par IP).
// Stockage en mémoire : suffisant pour une seule instance ; à remplacer par Redis si vous passez à plusieurs instances.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

type Entry = { count: number; resetAt: number };
const failures = new Map<string, Entry>();

function prune(now: number) {
  if (failures.size < 5_000) return;
  for (const [key, entry] of failures) {
    if (entry.resetAt <= now) failures.delete(key);
  }
  if (failures.size > 10_000) failures.clear();
}

export const isLocked = (key: string): boolean => {
  const entry = failures.get(key);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
};

export const retryAfterSeconds = (key: string): number => {
  const entry = failures.get(key);
  return entry ? Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)) : 0;
};

export const recordFailure = (key: string): void => {
  const now = Date.now();
  prune(now);
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= now) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
};

export const clearFailures = (key: string): void => {
  failures.delete(key);
};
