import { DOMAINS } from '../config'

export type ProductoBloque = 'COMPITE' | 'EXPERIENCE' | 'ASISTE'
export type ProductoDia = 'Viernes' | 'Sábado' | 'Domingo' | 'Vie-Dom'
export type ProductoSesion = 'AM' | 'PM'
export type EtapaComercial = 'lanzamiento' | 'preventa' | 'regular'

export interface PreciosPorEtapa {
  lanzamiento: number
  preventa: number
  regular: number
}

export interface Producto {
  code: string
  nombre: string
  bloque: ProductoBloque
  tipo: string
  integrantes: number
  dia: ProductoDia
  sesion: ProductoSesion
  precios: number | PreciosPorEtapa
  msi: boolean
  precioUnidad: string
  incluyeChip: boolean
}

export function getPrecioParaEtapa(producto: Producto, etapa: EtapaComercial): number {
  if (typeof producto.precios === 'number') return producto.precios
  return producto.precios[etapa]
}

export const CATALOGO: Producto[] = [
  // ── COMPITE — Viernes 9 · PM · Dobles ──
  { code: 'DOB-VIE-MM', nombre: 'Dobles Mujeres',  bloque: 'COMPITE', tipo: 'Dobles', integrantes: 2, dia: 'Viernes', sesion: 'PM', precios: { lanzamiento: 2500, preventa: 2750, regular: 3000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },
  { code: 'DOB-VIE-HH', nombre: 'Dobles Hombres',  bloque: 'COMPITE', tipo: 'Dobles', integrantes: 2, dia: 'Viernes', sesion: 'PM', precios: { lanzamiento: 2500, preventa: 2750, regular: 3000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },
  { code: 'DOB-VIE-MH', nombre: 'Dobles Mixto',    bloque: 'COMPITE', tipo: 'Dobles', integrantes: 2, dia: 'Viernes', sesion: 'PM', precios: { lanzamiento: 2500, preventa: 2750, regular: 3000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },

  // ── COMPITE — Sábado 10 · AM · Dobles ──
  { code: 'DOB-SAB-MM', nombre: 'Dobles Mujeres',  bloque: 'COMPITE', tipo: 'Dobles', integrantes: 2, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 2500, preventa: 2750, regular: 3000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },
  { code: 'DOB-SAB-HH', nombre: 'Dobles Hombres',  bloque: 'COMPITE', tipo: 'Dobles', integrantes: 2, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 2500, preventa: 2750, regular: 3000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },
  { code: 'DOB-SAB-MH', nombre: 'Dobles Mixto',    bloque: 'COMPITE', tipo: 'Dobles', integrantes: 2, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 2500, preventa: 2750, regular: 3000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },

  // ── COMPITE — Sábado 10 · PM · Relay (4 personas) ──
  { code: 'REL-4H',   nombre: 'Relay 4 Hombres',    bloque: 'COMPITE', tipo: 'Relay', integrantes: 4, dia: 'Sábado', sesion: 'PM', precios: { lanzamiento: 3200, preventa: 3500, regular: 3800 }, msi: true, precioUnidad: 'por equipo', incluyeChip: true },
  { code: 'REL-4M',   nombre: 'Relay 4 Mujeres',    bloque: 'COMPITE', tipo: 'Relay', integrantes: 4, dia: 'Sábado', sesion: 'PM', precios: { lanzamiento: 3200, preventa: 3500, regular: 3800 }, msi: true, precioUnidad: 'por equipo', incluyeChip: true },
  { code: 'REL-2H2M', nombre: 'Relay Mixto 2H+2M',  bloque: 'COMPITE', tipo: 'Relay', integrantes: 4, dia: 'Sábado', sesion: 'PM', precios: { lanzamiento: 3200, preventa: 3500, regular: 3800 }, msi: true, precioUnidad: 'por equipo', incluyeChip: true },

  // ── COMPITE — Domingo 11 · AM · Individual ──
  { code: 'IND-H',     nombre: 'Individual Hombre (Open)', bloque: 'COMPITE', tipo: 'Individual', integrantes: 1, dia: 'Domingo', sesion: 'AM', precios: { lanzamiento: 1500, preventa: 1650, regular: 1800 }, msi: true, precioUnidad: 'por persona', incluyeChip: true },
  { code: 'IND-M',     nombre: 'Individual Mujer (Open)',  bloque: 'COMPITE', tipo: 'Individual', integrantes: 1, dia: 'Domingo', sesion: 'AM', precios: { lanzamiento: 1500, preventa: 1650, regular: 1800 }, msi: true, precioUnidad: 'por persona', incluyeChip: true },
  { code: 'IND-PRO-H', nombre: 'Individual Pro Hombre',    bloque: 'COMPITE', tipo: 'Individual', integrantes: 1, dia: 'Domingo', sesion: 'AM', precios: { lanzamiento: 1500, preventa: 1650, regular: 1800 }, msi: true, precioUnidad: 'por persona', incluyeChip: true },
  { code: 'IND-PRO-M', nombre: 'Individual Pro Mujer',     bloque: 'COMPITE', tipo: 'Individual', integrantes: 1, dia: 'Domingo', sesion: 'AM', precios: { lanzamiento: 1500, preventa: 1650, regular: 1800 }, msi: true, precioUnidad: 'por persona', incluyeChip: true },

  // ── EXPERIENCE — ½ Hybrid — Sábado 10 · AM ──
  { code: 'HALF-IND-M',  nombre: '½ Hybrid Individual Mujer',    bloque: 'EXPERIENCE', tipo: '½ Hybrid Individual', integrantes: 1, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 800, preventa: 900, regular: 1000 }, msi: true, precioUnidad: 'por persona', incluyeChip: true },
  { code: 'HALF-IND-H',  nombre: '½ Hybrid Individual Hombre',   bloque: 'EXPERIENCE', tipo: '½ Hybrid Individual', integrantes: 1, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 800, preventa: 900, regular: 1000 }, msi: true, precioUnidad: 'por persona', incluyeChip: true },
  { code: 'HALF-DOB-MM', nombre: '½ Hybrid Dobles Mujeres',      bloque: 'EXPERIENCE', tipo: '½ Hybrid Dobles', integrantes: 2, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 1600, preventa: 1800, regular: 2000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },
  { code: 'HALF-DOB-HH', nombre: '½ Hybrid Dobles Hombres',      bloque: 'EXPERIENCE', tipo: '½ Hybrid Dobles', integrantes: 2, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 1600, preventa: 1800, regular: 2000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },
  { code: 'HALF-DOB-MH', nombre: '½ Hybrid Dobles Mixto',        bloque: 'EXPERIENCE', tipo: '½ Hybrid Dobles', integrantes: 2, dia: 'Sábado', sesion: 'AM', precios: { lanzamiento: 1600, preventa: 1800, regular: 2000 }, msi: true, precioUnidad: 'por pareja', incluyeChip: true },

  // ── EXPERIENCE — Workout Experience — Sábado 10 · AM · $350 fijo ──
  { code: 'WOD-M', nombre: 'Workout Experience Mujer',   bloque: 'EXPERIENCE', tipo: 'Workout Experience', integrantes: 1, dia: 'Sábado', sesion: 'AM', precios: 350, msi: false, precioUnidad: 'por persona', incluyeChip: false },
  { code: 'WOD-H', nombre: 'Workout Experience Hombre',  bloque: 'EXPERIENCE', tipo: 'Workout Experience', integrantes: 1, dia: 'Sábado', sesion: 'AM', precios: 350, msi: false, precioUnidad: 'por persona', incluyeChip: false },

  // ── ASISTE — Público · $250 por día / $600 pase 3 días ──
  { code: 'PUB-VIE', nombre: 'Público — Viernes',      bloque: 'ASISTE', tipo: 'Público', integrantes: 1, dia: 'Viernes', sesion: 'AM', precios: 250, msi: false, precioUnidad: 'por día', incluyeChip: false },
  { code: 'PUB-SAB', nombre: 'Público — Sábado',       bloque: 'ASISTE', tipo: 'Público', integrantes: 1, dia: 'Sábado',  sesion: 'AM', precios: 250, msi: false, precioUnidad: 'por día', incluyeChip: false },
  { code: 'PUB-DOM', nombre: 'Público — Domingo',      bloque: 'ASISTE', tipo: 'Público', integrantes: 1, dia: 'Domingo', sesion: 'AM', precios: 250, msi: false, precioUnidad: 'por día', incluyeChip: false },
  { code: 'PUB-3D',  nombre: 'Público — Pase 3 Días',  bloque: 'ASISTE', tipo: 'Público', integrantes: 1, dia: 'Vie-Dom', sesion: 'AM', precios: 600, msi: false, precioUnidad: 'pase 3 días', incluyeChip: false },

  // ── ASISTE — Fotógrafo · $350 por día / $800 pase 3 días ──
  { code: 'FOT-VIE', nombre: 'Fotógrafo — Viernes',    bloque: 'ASISTE', tipo: 'Fotógrafo', integrantes: 1, dia: 'Viernes', sesion: 'AM', precios: 350, msi: false, precioUnidad: 'por día', incluyeChip: false },
  { code: 'FOT-SAB', nombre: 'Fotógrafo — Sábado',     bloque: 'ASISTE', tipo: 'Fotógrafo', integrantes: 1, dia: 'Sábado',  sesion: 'AM', precios: 350, msi: false, precioUnidad: 'por día', incluyeChip: false },
  { code: 'FOT-DOM', nombre: 'Fotógrafo — Domingo',    bloque: 'ASISTE', tipo: 'Fotógrafo', integrantes: 1, dia: 'Domingo', sesion: 'AM', precios: 350, msi: false, precioUnidad: 'por día', incluyeChip: false },
  { code: 'FOT-3D',  nombre: 'Fotógrafo — Pase 3 Días', bloque: 'ASISTE', tipo: 'Fotógrafo', integrantes: 1, dia: 'Vie-Dom', sesion: 'AM', precios: 800, msi: false, precioUnidad: 'pase 3 días', incluyeChip: false },
]

export function getInscribirUrl(code: string): string {
  return `https://${DOMAINS.registration}/inscribir?cat=${code}`
}

export function formatPrecio(precio: number): string {
  return `$${precio.toLocaleString('es-MX')} MXN`
}

export function porBloque(bloque: ProductoBloque): Producto[] {
  return CATALOGO.filter((p) => p.bloque === bloque)
}
