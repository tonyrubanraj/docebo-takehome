/** Stub analytics client: one structured JSON line per event on the console. */
export function track(event: string, props: Record<string, unknown>): void {
  try {
    console.info('[analytics]', JSON.stringify({ event, ts: new Date().toISOString(), ...props }));
  } catch {
    // Analytics must never break the page (e.g. a prop that can't be serialised).
  }
}
