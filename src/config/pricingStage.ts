import type { EtapaComercial } from '../data/catalogo'

// Ajusta estas fechas antes de cada evento para controlar las transiciones.
const FECHA_FIN_LANZAMIENTO = '2026-08-31'
const FECHA_FIN_PREVENTA    = '2026-09-30'

// Encender manualmente cuando el equipo de ventas autorice el arranque de la etapa.
export const ventasArrancadas = false

export function resolveEtapaComercial(): EtapaComercial {
  const ahoraMerida = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Merida' }),
  )
  const finLanzamiento = new Date(`${FECHA_FIN_LANZAMIENTO}T23:59:59`)
  const finPreventa    = new Date(`${FECHA_FIN_PREVENTA}T23:59:59`)

  if (ahoraMerida <= finLanzamiento) return 'lanzamiento'
  if (ahoraMerida <= finPreventa)    return 'preventa'
  return 'regular'
}
