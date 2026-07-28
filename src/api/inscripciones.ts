import { insforge } from '../lib/insforgeClient'
import type { Producto } from '../data/catalogo'

export interface InscripcionInput {
  id: string
  producto: Producto
  teamName: string | null
  participants: string[]
  contactName: string
  contactEmail: string
  contactPhone: string
}

export async function submitInscripcion(
  input: InscripcionInput,
): Promise<{ ok: boolean; error: string | null }> {
  // No `.select()`: the anon RLS policy only grants INSERT, by design — a
  // registrant must not be able to read back rows (their own or anyone
  // else's). `id` is generated client-side (instead of relying on the
  // column default) so the QR ticket can reference the exact row.
  const { error } = await insforge.database.from('hybrid_registro_inscripciones').insert([
    {
      id: input.id,
      category_code: input.producto.code,
      category_name: input.producto.nombre,
      category_bloque: input.producto.bloque,
      team_name: input.teamName,
      participants: input.participants,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      amount: input.producto.precio,
      currency: 'MXN',
      status: 'pending',
    },
  ])

  if (error) {
    return { ok: false, error: typeof error === 'string' ? error : 'No se pudo guardar el registro.' }
  }

  return { ok: true, error: null }
}
