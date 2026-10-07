import type { Producto, EtapaComercial } from '../data/catalogo'
import type { PaymentGroupKey } from './paymentLinks'
import { getPaymentGroupKey } from './paymentLinks'
import { resolveEtapaComercial } from './pricingStage'

// PLANB-CLIP-PAYMENT-01: espejo de paymentLinks.ts para Clip, el segundo
// método de pago. Mismo criterio de agrupación por CONCEPTO (10 grupos, no
// 23 productos) — la clave y el mapeo se reutilizan de paymentLinks.ts en
// vez de duplicarse, para que ambos métodos no puedan divergir.
// Los links los crea el Project Owner a mano en el panel de Clip.

// ⚠️ LINKS CLIP VÁLIDOS SOLO PARA ETAPA "LANZAMIENTO".
// Cada link de Clip lleva el monto fijo del precio de lanzamiento. Al
// cambiar de etapa hay que generar nuevos links en Clip y actualizarlos
// aquí. Mientras eso no pase, `getClipLinkForProducto` devuelve null fuera
// de lanzamiento (ver guard abajo) para no cobrar precio de lanzamiento en
// preventa/regular.
export const CLIP_LINKS_ETAPA: EtapaComercial = 'lanzamiento'

// Auditoría 2026-10-07: los links de Clip de abajo marcados null están
// muertos — error_code=completed ("Este link ya fue pagado": parece que cada
// link de Clip es de un solo uso) o error_code=expired. Null en vez de dejar
// el link muerto: el botón de Clip simplemente no se muestra hasta tener un
// link nuevo/reutilizable. Verificar monto/concepto al regenerar — Clip no
// avisa cuándo vencen.
//   DOBLES        c62baa3b-…  completed
//   RELAY         7c12cc00-…  expired
//   HALF_DOBLES   48a3b03d-…  completed
//   INDIVIDUAL    b05fd69f-…  expired
//   HALF_INDIVIDUAL 98467a51-… expired
//   PUB_1D        5c6ca209-…  completed
//   WORKOUT       9e3a6598-…  expired
export const CLIP_LINKS_BY_GROUP: Record<PaymentGroupKey, string | null> = {
  DOBLES: null,
  RELAY: null,
  HALF_DOBLES: null,
  INDIVIDUAL: null,
  HALF_INDIVIDUAL: null,
  WORKOUT: null,
  PUB_1D: null,
  PUB_3D: 'https://pago.clip.mx/v3/51f529fe-51c3-44e8-8580-07946b989d94',
  FOT_1D: 'https://pago.clip.mx/v3/75b091ca-1b58-4417-b372-6531d025650a',
  FOT_3D: 'https://pago.clip.mx/v3/6bf79e04-3e27-4abf-83c3-a51dd8881ba6',
}

// `etapa` es inyectable para que quien ya la resolvió (la pantalla de
// inscripción calcula el precio con ella) use exactamente el mismo valor:
// re-resolver aquí podría dar una etapa distinta si el cambio de etapa
// ocurre entre ambas llamadas, y el link cobraría un monto que no coincide
// con el precio mostrado.
export function getClipLinkForProducto(
  producto: Producto,
  etapa: EtapaComercial = resolveEtapaComercial(),
): string | null {
  if (etapa !== CLIP_LINKS_ETAPA) return null
  return CLIP_LINKS_BY_GROUP[getPaymentGroupKey(producto)] ?? null
}
