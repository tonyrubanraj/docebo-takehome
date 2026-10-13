/** Build-time feature flags, read from Vite env vars. Restart `npm run dev` after changing one. */
export const FLAGS = { paceBadge: import.meta.env.VITE_FLAG_PACE !== 'false' };
