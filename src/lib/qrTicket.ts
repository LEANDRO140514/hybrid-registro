import QRCode from 'qrcode'
import type { Producto } from '../data/catalogo'

interface QrTicketInput {
  registrationId: string
  producto: Producto
  participants: string[]
  precio: number
}

// Kept out of the encoded text: email/phone. This is meant to double as a
// door ticket, so it only carries what staff need to verify someone.
function buildQrText({ registrationId, producto, participants, precio }: QrTicketInput): string {
  return [
    'HYBRID EXPERIENCE — Registro',
    `Ref: ${registrationId}`,
    producto.nombre,
    `Participantes: ${participants.join(', ')}`,
    `$${precio.toLocaleString('es-MX')} MXN`,
  ].join('\n')
}

// Generated entirely client-side as a data: URL — InsForge Storage does not
// support anonymous (unauthenticated) uploads, and this flow has no login,
// so there is nowhere to persist the image server-side yet.
export async function generateQrTicket(input: QrTicketInput): Promise<string | null> {
  try {
    return await QRCode.toDataURL(buildQrText(input), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 480,
    })
  } catch {
    return null
  }
}
