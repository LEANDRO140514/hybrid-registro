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
  DOBLES: 'https://pago.clip.mx/v3/05426bf8-efa0-456f-9cfa-598f9f43c9e4',
  RELAY: 'https://pago.clip.mx/v3/5f3f6d27-a9fc-465f-a179-2e23e5fa300c',
  HALF_DOBLES: 'https://pago.clip.mx/v3/c05c7c03-bb27-42ba-b739-295b9a8e460d',
  INDIVIDUAL: 'https://pago.clip.mx/v3/6491e5ae-504c-4e9d-b244-40aa2630bd30',
  HALF_INDIVIDUAL: 'https://pago.clip.mx/v3/c61eb8e7-dc37-4292-92d8-28c4c0607a3c',
  WORKOUT: 'https://pago.clip.mx/v3/9e3a6598-4a8c-49c2-86b6-9426aaf01aff',
  PUB_1D: 'https://pago.clip.mx/v3/5c6ca209-a1b8-4be5-87a4-dd8087e84b04',
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
