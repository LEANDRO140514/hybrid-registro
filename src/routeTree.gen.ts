import { createRootRoute, createRoute } from '@tanstack/react-router'
import App from './App'
import LandingPage from './pages/LandingPage'
import CheckoutConfirmPage from './pages/CheckoutConfirmPage'
import InscribirPage from './pages/InscribirPage'

// ---- Root ----
const rootRoute = createRootRoute({ component: App })

// ---- Public Routes (The Hybrid Experience) ----
const landingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: LandingPage })
const checkoutConfirmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout/confirmando',
  validateSearch: (search: Record<string, unknown>) => ({
    // Mercado Pago may append collection_* etc.; only `ref` is optionally used as fallback.
    ref: typeof search.ref === 'string' ? search.ref : undefined,
  }),
  component: CheckoutConfirmPage,
})
// PLANB-LANDING-01: formulario de inscripción + guardado en InsForge.
const inscribirRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inscribir',
  validateSearch: (search: Record<string, unknown>) => ({
    cat: typeof search.cat === 'string' ? search.cat : undefined,
  }),
  component: InscribirPage,
})

export const routeTree = rootRoute.addChildren([
  landingRoute,
  checkoutConfirmRoute,
  inscribirRoute,
])
