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

// Regenerados el 2026-09-16: los anteriores expiraron del lado de Clip
// (redirigían a /error?error_code=expired) y varios registros quedaron
// atorados sin poder pagar. Verificar monto/concepto cada vez que se
// regeneren — Clip no avisa cuándo vencen.
export const CLIP_LINKS_BY_GROUP: Record<PaymentGroupKey, string | null> = {
  DOBLES: 'https://pago.clip.mx/v3/c62baa3b-2ede-4bd1-b050-e32c6435c905',
  RELAY: 'https://pago.clip.mx/v3/7c12cc00-d6ff-453d-b15c-25d2da96f89d',
  HALF_DOBLES: 'https://pago.clip.mx/v3/48a3b03d-602c-4e9a-83b8-911a5471b4f9',
  INDIVIDUAL: 'https://pago.clip.mx/v3/b05fd69f-d1cf-4e95-a6b0-c11db156dea7',
  HALF_INDIVIDUAL: 'https://pago.clip.mx/v3/98467a51-485c-44ff-b909-eb94771642b2',
  // También expiró (error_code=expired) — no vino un link nuevo en la
  // regeneración del 2026-09-16. Null en vez de dejar el link muerto:
  // Mercado Pago sigue funcionando para esta categoría, así que el botón
  // de Clip simplemente no se muestra hasta tener el link nuevo.
  WORKOUT: null,
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
