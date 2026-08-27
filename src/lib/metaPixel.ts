// Meta Pixel (Enforma Sports Society) — base PageView code lives in
// index.html. This is the only place that fires custom events, so the
// event vocabulary stays in one spot instead of scattered fbq() calls.

type FbqFn = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: FbqFn
  }
}

/** Best-effort: a blocked/missing pixel (ad blockers, script failed to load) must never break the app. */
export function trackLead(params?: Record<string, unknown>): void {
  try {
    window.fbq?.('track', 'Lead', params)
  } catch {
    // ignore
  }
}
