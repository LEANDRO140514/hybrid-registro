// PLANB-LANDING-01: sends the registration confirmation email via Resend.
// Public function (anon-invokable from /inscribir), so it builds the
// subject/HTML itself server-side instead of trusting client-supplied
// HTML — the client only supplies structured registration data.

const FROM_ADDRESS = 'HYBRID EXPERIENCE <registro@mail.hybrid-registro.enforma.mx>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface RegistrationEmailPayload {
  to: string
  contactName: string
  categoryName: string
  amountLabel: string
  participants: string[]
  paymentLink: string | null
  qrDataUrl: string | null
  pdfBase64: string | null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const QR_CONTENT_ID = 'registro-qr'

function buildHtml(payload: RegistrationEmailPayload): string {
  const participantsHtml = payload.participants.map((p) => escapeHtml(p)).join(', ')
  const paymentBlock = payload.paymentLink
    ? `<p style="margin:24px 0"><a href="${escapeHtml(payload.paymentLink)}" style="background:#111;color:#E6F2B1;padding:14px 24px;text-decoration:none;font-weight:700;display:inline-block">Completar pago — ${escapeHtml(payload.amountLabel)}</a></p>`
    : `<p style="margin:24px 0;color:#444">Aún no está disponible el link de pago para esta categoría — te contactaremos en breve para completarlo.</p>`
  // Referenced via Content-ID (cid:), not a data: URI — Gmail and other
  // clients strip inline base64 images from received mail.
  const qrBlock = payload.qrDataUrl
    ? `<p style="margin:24px 0"><img src="cid:${QR_CONTENT_ID}" alt="Código QR de tu registro" width="220" height="220" /></p>`
    : ''
  const pdfNote = payload.pdfBase64
    ? '<p style="margin:24px 0 0;color:#666;font-size:13px">Adjuntamos tu boleto en PDF con este mismo código.</p>'
    : ''

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin-bottom:4px">Hybrid Experience</p>
      <h1 style="font-size:22px;margin:0 0 16px">¡Registro recibido, ${escapeHtml(payload.contactName)}!</h1>
      <p style="margin:0 0 4px"><strong>${escapeHtml(payload.categoryName)}</strong></p>
      <p style="margin:0 0 16px;color:#444">${escapeHtml(payload.amountLabel)}</p>
      <p style="margin:0 0 16px;color:#444">Participantes: ${participantsHtml}</p>
      ${paymentBlock}
      ${qrBlock}
      ${pdfNote}
    </div>
  `
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: Partial<RegistrationEmailPayload>
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (
    !isNonEmptyString(payload.to) ||
    !isNonEmptyString(payload.contactName) ||
    !isNonEmptyString(payload.categoryName) ||
    !isNonEmptyString(payload.amountLabel) ||
    !Array.isArray(payload.participants)
  ) {
    return new Response(JSON.stringify({ error: 'Missing required registration fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Email service not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const qrDataUrl = isNonEmptyString(payload.qrDataUrl) ? payload.qrDataUrl : null
  const pdfBase64 = isNonEmptyString(payload.pdfBase64) ? payload.pdfBase64 : null
  const html = buildHtml({
    to: payload.to,
    contactName: payload.contactName,
    categoryName: payload.categoryName,
    amountLabel: payload.amountLabel,
    participants: payload.participants.filter(isNonEmptyString),
    paymentLink: isNonEmptyString(payload.paymentLink) ? payload.paymentLink : null,
    qrDataUrl,
    pdfBase64,
  })

  const qrBase64 = qrDataUrl?.split(',')[1] ?? null
  const attachments = [
    qrBase64 ? { filename: 'registro-qr.png', content: qrBase64, content_id: QR_CONTENT_ID } : null,
    pdfBase64 ? { filename: 'boleto-hybrid-experience.pdf', content: pdfBase64 } : null,
  ].filter((a): a is NonNullable<typeof a> => a !== null)

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: payload.to,
      subject: `Registro recibido — ${payload.categoryName}`,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    }),
  })

  const resendBody = await resendResponse.json().catch(() => null)
  if (!resendResponse.ok) {
    return new Response(JSON.stringify({ error: 'Resend send failed', detail: resendBody }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, id: resendBody?.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
