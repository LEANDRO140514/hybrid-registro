import type { Producto } from '../data/catalogo'

// PLANB-LANDING-01: un link de pago simple de Mercado Pago por CONCEPTO
// (10 en total — no por precio: Workout y Fotógrafo 1 día comparten precio
// $350 pero son conceptos distintos). Los crea el Project Owner a mano en
// el dashboard de Mercado Pago > Cobrar > Links de pago.
export type PaymentGroupKey =
  | 'DOBLES'
  | 'RELAY'
  | 'HALF_DOBLES'
  | 'INDIVIDUAL'
  | 'HALF_INDIVIDUAL'
  | 'WORKOUT'
  | 'PUB_1D'
  | 'PUB_3D'
  | 'FOT_1D'
  | 'FOT_3D'

export function getPaymentGroupKey(producto: Producto): PaymentGroupKey {
  switch (producto.tipo) {
    case 'Dobles':
      return 'DOBLES'
    case 'Relay':
      return 'RELAY'
    case '½ Hybrid Dobles':
      return 'HALF_DOBLES'
    case '½ Hybrid Individual':
      return 'HALF_INDIVIDUAL'
    case 'Individual':
      return 'INDIVIDUAL'
    case 'Workout Experience':
      return 'WORKOUT'
    case 'Público':
      return producto.dia === 'Vie-Dom' ? 'PUB_3D' : 'PUB_1D'
    case 'Fotógrafo':
      return producto.dia === 'Vie-Dom' ? 'FOT_3D' : 'FOT_1D'
    default:
      throw new Error(`Sin concepto de pago mapeado para tipo "${producto.tipo}"`)
  }
}

export const PAYMENT_LINKS_BY_GROUP: Record<PaymentGroupKey, string | null> = {
  // Regenerados el 2026-09-16: los anteriores expiraron del lado de Mercado
  // Pago (mostraban "Lo que querías pagar ya no está disponible") y varios
  // registros quedaron atorados sin poder pagar. Verificar monto/concepto
  // cada vez que se regeneren — Mercado Pago no avisa cuándo vencen.
  DOBLES: 'https://mpago.li/11GKwpC',
  RELAY: 'https://mpago.li/2iDqVaf',
  HALF_DOBLES: 'https://mpago.li/14K9nhv',
  INDIVIDUAL: 'https://mpago.li/1wMbEj7',
  HALF_INDIVIDUAL: 'https://mpago.li/2ePoSmT',
  // Precio fijo, sin cambio entre etapas — links originales
  WORKOUT: 'https://mpago.la/1sf1rQb',
  PUB_1D: 'https://mpago.la/1vSSuK1',
  PUB_3D: 'https://mpago.la/1J9EGt1',
  FOT_1D: 'https://mpago.la/1F6NEJz',
  FOT_3D: 'https://mpago.la/1rFvYXm',
}

export function getPaymentLinkForProducto(producto: Producto): string | null {
  return PAYMENT_LINKS_BY_GROUP[getPaymentGroupKey(producto)] ?? null
}
