import { insforge } from '../lib/insforgeClient'

export type IndividualProModalidad = 'hombre' | 'mujer'
export type DoblesProModalidad = 'hombres' | 'mujeres' | 'mixto'

export interface SimulacroProInput {
  nombre: string
  correo: string
  telefono: string
  individualPro: IndividualProModalidad | null
  doblesPro: DoblesProModalidad | null
}

export async function submitSimulacroPro(
  input: SimulacroProInput,
): Promise<{ ok: boolean; error: string | null }> {
  // No `.select()`: la politica anon solo otorga INSERT, a proposito — un
  // visitante no debe poder leer la lista de interesados.
  const { error } = await insforge.database.from('hybrid_registro_simulacro_pro').insert([
    {
      nombre: input.nombre,
      correo: input.correo,
      telefono: input.telefono,
      individual_pro: input.individualPro,
      dobles_pro: input.doblesPro,
    },
  ])

  if (error) {
    return { ok: false, error: typeof error === 'string' ? error : 'No se pudo guardar tu interés.' }
  }

  return { ok: true, error: null }
}
