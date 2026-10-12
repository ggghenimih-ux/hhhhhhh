/**
 * TRACK_STOCK=false (default) means products are treated as always available.
 * Set TRACK_STOCK=true to enable the normal inventory checks and deductions.
 */
export const TRACK_STOCK = process.env.TRACK_STOCK === 'true';
export const UNLIMITED_STOCK = 999_999;
