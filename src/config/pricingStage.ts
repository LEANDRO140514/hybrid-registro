import type { EtapaComercial } from '../data/catalogo'

// Calendario comercial confirmado (11 ago 2026):
//   lanzamiento: 11 ago – 31 ago 2026
//   preventa:     1 sep – 30 sep 2026
//   regular:      1 oct –  7 nov 2026 (cierre de ventas: 7 nov)
const FECHA_FIN_LANZAMIENTO = '2026-08-31'
const FECHA_FIN_PREVENTA    = '2026-09-30'

// Cierre de ventas. resolveEtapaComercial() sigue devolviendo 'regular' después
// de esta fecha (el precio no cambia); el cierre real se opera cambiando
// SALES_CONFIG.status a 'closed' en salesConfig.ts ese día.
export const FECHA_CIERRE_VENTAS = '2026-11-07'

// Encender manualmente cuando el equipo de ventas autorice el arranque de la etapa.
export const ventasArrancadas = false

// CONGELAMIENTO MANUAL DE PRECIOS (2026-09-01, autorizado por el Project Owner).
// Mientras esto no sea null, resolveEtapaComercial() ignora el calendario y
// devuelve siempre esta etapa. Decisión de negocio: los precios se mantienen
// en 'lanzamiento' hasta nuevo aviso (no se avanza a 'preventa' por fecha).
// Los links de pago vigentes (Clip y Mercado Pago) corresponden a este monto.
// Para reanudar el cálculo por fecha: poner ETAPA_CONGELADA = null.
export const ETAPA_CONGELADA: EtapaComercial | null = 'lanzamiento'

export function resolveEtapaComercial(): EtapaComercial {
  if (ETAPA_CONGELADA) return ETAPA_CONGELADA

  const ahoraMerida = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Merida' }),
  )
  const finLanzamiento = new Date(`${FECHA_FIN_LANZAMIENTO}T23:59:59`)
  const finPreventa    = new Date(`${FECHA_FIN_PREVENTA}T23:59:59`)

  if (ahoraMerida <= finLanzamiento) return 'lanzamiento'
  if (ahoraMerida <= finPreventa)    return 'preventa'
  return 'regular'
}
