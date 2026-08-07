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

export const CLIP_LINKS_BY_GROUP: Record<PaymentGroupKey, string | null> = {
  DOBLES: 'https://pago.clip.mx/v3/96483c99-987a-4cd5-bc1c-d381932a828d',
  RELAY: 'https://pago.clip.mx/v3/55546ca9-27c7-47a9-8afa-827d4925080e',
  HALF_DOBLES: 'https://pago.clip.mx/v3/36e10dc0-6cfa-4bc9-b37c-f741f86681af',
  INDIVIDUAL: 'https://pago.clip.mx/v3/31ab0c0c-6491-449c-9e3f-d5cf03365050',
  HALF_INDIVIDUAL: 'https://pago.clip.mx/v3/8d3f578a-f221-4dc1-bd77-2405bd548df6',
  WORKOUT: 'https://pago.clip.mx/v3/b4437682-d5e2-4613-98f5-30ed10301f65',
  PUB_1D: 'https://pago.clip.mx/v3/cc0fbd16-0452-4946-854e-3efbd03f97f2',
  PUB_3D: 'https://pago.clip.mx/v3/ac8ee7d8-5738-470a-b667-93852103c874',
  FOT_1D: 'https://pago.clip.mx/v3/52c6bfc0-f77c-4e4b-816b-fe068ededed1',
  FOT_3D: 'https://pago.clip.mx/v3/2672c15c-16f9-4098-9c3d-66ea0323b9f9',
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
