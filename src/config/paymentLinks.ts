// PLANB-LANDING-01: uno de estos 9 links debe existir por cada precio del
// catálogo (creados manualmente por el Project Owner en el dashboard de
// Mercado Pago > Cobrar > Links de pago — no se generan desde código).
// Mientras falten, la pantalla de confirmación cae al contacto de soporte.
export const PAYMENT_LINKS_BY_PRICE: Record<number, string | null> = {
  2500: null,
  3400: null,
  1500: null,
  1700: null,
  850: null,
  350: null,
  600: null,
  250: null,
  800: null,
}

export function getPaymentLinkForPrice(precio: number): string | null {
  return PAYMENT_LINKS_BY_PRICE[precio] ?? null
}
