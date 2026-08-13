// RELANZAMIENTO-NOVIEMBRE-01 follow-up: minimal "Frente B lite". Sends the
// PAYMENT-CONFIRMED email (positive framing, unlike send-registration-email
// which is a pending-payment notice) with a PDF ticket attached — category
// photo + QR door-ticket, built server-side with jsPDF/qrcode via npm:
// specifiers (Deno Subhosting).
//
// NOT wired to the public frontend on purpose: this is an admin-only tool,
// invoked via `npx @insforge/cli functions invoke send-payment-confirmation
// --data '{...}'` after a payment is manually confirmed and the
// registration's `status` is set to 'paid' in hybrid_registro_inscripciones.
// No anon CORS access is declared.

import { jsPDF } from 'npm:jspdf'
import QRCode from 'npm:qrcode'

const FROM_ADDRESS = 'HYBRID EXPERIENCE <registro@mail.hybrid-registro.enforma.mx>'
const BRAND_LIME: [number, number, number] = [230, 242, 177]

interface ConfirmationPayload {
  to: string
  contactName: string
  categoryName: string
  teamName: string | null
  amountLabel: string
  participants: string[]
  registrationId: string
  eventDateLabel: string
  cardImageUrl: string | null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

async function fetchImageAsDataUrl(url: string): Promise<{ dataUrl: string; format: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    const format = contentType.includes('webp') ? 'WEBP' : contentType.includes('png') ? 'PNG' : 'JPEG'
    const buf = new Uint8Array(await res.arrayBuffer())
    let binary = ''
    for (const byte of buf) binary += String.fromCharCode(byte)
    const base64 = btoa(binary)
    return { dataUrl: `data:${contentType};base64,${base64}`, format }
  } catch {
    return null
  }
}

async function buildTicketPdf(payload: ConfirmationPayload): Promise<string> {
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
  doc.setFontSize(18)
  doc.text('Tu pago fue confirmado', 40, y)

  y += 32
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const lines: [string, string][] = [
    ['Categoría', payload.categoryName],
    ...(payload.teamName ? ([['Equipo', payload.teamName]] as [string, string][]) : []),
    ['Monto', payload.amountLabel],
    ['Participantes', payload.participants.join(', ')],
    ['Fecha del evento', payload.eventDateLabel],
    ['Referencia', payload.registrationId],
  ]
  for (const [label, value] of lines) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 40, y)
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(value, pageWidth - 160)
    doc.text(wrapped, 150, y)
    y += 22 * Math.max(wrapped.length, 1)
  }

  y += 20
  if (payload.cardImageUrl) {
    const image = await fetchImageAsDataUrl(payload.cardImageUrl)
    if (image) {
      const imgWidth = 240
      const imgHeight = 160
      doc.addImage(image.dataUrl, image.format, 40, y, imgWidth, imgHeight)
    }
  }

  const qrText = [
    'HYBRID EXPERIENCE — Boleto confirmado',
    `Ref: ${payload.registrationId}`,
    payload.categoryName,
    `Participantes: ${payload.participants.join(', ')}`,
  ].join('\n')
  try {
    const qrDataUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel: 'M', margin: 2, width: 480 })
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 220, y, 160, 160)
  } catch {
    // QR is best-effort — a missing QR should not block sending the confirmation.
  }

  return doc.output('datauristring').split(',')[1]
}

function buildHtml(payload: ConfirmationPayload): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin-bottom:4px">Hybrid Experience</p>
      <h1 style="font-size:22px;margin:0 0 16px">¡Tu pago fue confirmado, ${payload.contactName}!</h1>
      <p style="margin:0 0 4px"><strong>${payload.categoryName}</strong>${payload.teamName ? ` — ${payload.teamName}` : ''}</p>
      <p style="margin:0 0 16px;color:#444">${payload.amountLabel}</p>
      <p style="margin:0 0 16px;color:#444">Tu lugar está asegurado para el ${payload.eventDateLabel}.</p>
      <p style="margin:0 0 8px;color:#444">Adjuntamos tu boleto en PDF.</p>
      <p style="margin:24px 0 0;color:#666;font-size:13px">¡Nos vemos en la línea de salida!</p>
    </div>
  `
}

export default async function (req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let payload: Partial<ConfirmationPayload>
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (
    !isNonEmptyString(payload.to) ||
    !isNonEmptyString(payload.contactName) ||
    !isNonEmptyString(payload.categoryName) ||
    !isNonEmptyString(payload.amountLabel) ||
    !isNonEmptyString(payload.registrationId) ||
    !isNonEmptyString(payload.eventDateLabel) ||
    !Array.isArray(payload.participants)
  ) {
    return new Response(JSON.stringify({ error: 'Missing required confirmation fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const full: ConfirmationPayload = {
    to: payload.to,
    contactName: payload.contactName,
    categoryName: payload.categoryName,
    teamName: isNonEmptyString(payload.teamName) ? payload.teamName : null,
    amountLabel: payload.amountLabel,
    participants: payload.participants.filter(isNonEmptyString),
    registrationId: payload.registrationId,
    eventDateLabel: payload.eventDateLabel,
    cardImageUrl: isNonEmptyString(payload.cardImageUrl) ? payload.cardImageUrl : null,
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Email service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const pdfBase64 = await buildTicketPdf(full)
  const html = buildHtml(full)

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: full.to,
      subject: `Tu pago fue confirmado — ${full.categoryName}`,
      html,
      attachments: [
        {
          filename: 'boleto-hybrid-experience.pdf',
          content: pdfBase64,
        },
      ],
    }),
  })

  const resendBody = await resendResponse.json().catch(() => null)
  if (!resendResponse.ok) {
    return new Response(JSON.stringify({ error: 'Resend send failed', detail: resendBody }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, id: resendBody?.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
