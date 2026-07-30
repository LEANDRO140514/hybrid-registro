import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.PROD ? 'production' : 'development',
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Ruido de navegadores in-app (Facebook/Instagram/Messenger inyectan su
    // propio puente window.webkit.messageHandlers al abrir links compartidos;
    // en Android ese puente no existe y su script truena — no es nuestro bug).
    ignoreErrors: [
      /window\.webkit\.messageHandlers/,
      'sendDataToNative',
      'sendPageHideMessage',
      // Falla conocida entre el propio tracing de Sentry (browserTracingIntegration,
      // que usa performance.mark/measure) y ciertos navegadores Chromium/Electron —
      // no tiene relación con el código de la app.
      /Failed to execute 'measure' on 'Performance'/,
    ],
  })
}
