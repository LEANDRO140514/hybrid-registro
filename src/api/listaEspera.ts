import { insforge } from '../lib/insforgeClient'

export interface ListaEsperaInput {
  nombre: string
  correo: string
  telefono: string
}

export async function submitListaEspera(
  input: ListaEsperaInput,
): Promise<{ ok: boolean; error: string | null }> {
  // No `.select()`: la politica anon solo otorga INSERT, a proposito — un
  // visitante no debe poder leer la lista (ni la propia fila ni las demas).
  const { error } = await insforge.database.from('hybrid_registro_lista_espera').insert([
    {
      nombre: input.nombre,
      correo: input.correo,
      telefono: input.telefono,
    },
  ])

  if (error) {
    return { ok: false, error: typeof error === 'string' ? error : 'No se pudo guardar tu reserva.' }
  }

  return { ok: true, error: null }
}
