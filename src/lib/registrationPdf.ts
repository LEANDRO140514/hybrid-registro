import { jsPDF } from 'jspdf'

export interface TicketPdfInput {
  registrationId: string
  categoryName: string
  amountLabel: string
  participants: string[]
  qrDataUrl: string | null
}

const BRAND_LIME: [number, number, number] = [230, 242, 177]

export function buildTicketPdfBase64(input: TicketPdfInput): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...BRAND_LIME)
  doc.rect(0, 0, pageWidth, 90, 'F')
  doc.setTextColor(17, 17, 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('HYBRID EXPERIENCE', 40, 45)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('by ENFORMA', 40, 68)

  doc.setTextColor(0, 0, 0)
  let y = 130
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  // No dice "confirmado": este PDF se genera al registrar, antes de pagar.
  // El boleto válido se emite tras validar el pago (Frente B).
  doc.text('Registro recibido — pendiente de pago', 40, y)

  y += 35
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const lines: [string, string][] = [
    ['Categoría', input.categoryName],
    ['Monto', input.amountLabel],
    ['Participantes', input.participants.join(', ')],
    ['Referencia', input.registrationId],
  ]
  for (const [label, value] of lines) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 40, y)
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(value, pageWidth - 160)
    doc.text(wrapped, 150, y)
    y += 22 * Math.max(wrapped.length, 1)
  }

  if (input.qrDataUrl) {
    y += 20
    doc.addImage(input.qrDataUrl, 'PNG', 40, y, 180, 180)
  }

  return doc.output('datauristring').split(',')[1]
}
