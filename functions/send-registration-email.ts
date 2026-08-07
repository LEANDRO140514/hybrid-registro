// PLANB-LANDING-01: sends the registration email via Resend. Public
// function (anon-invokable from /inscribir), so it builds the subject/HTML
// itself server-side instead of trusting client-supplied HTML — the client
// only supplies structured registration data.
//
// PLANB-CLIP-PAYMENT-01: this mail is sent at registration time, BEFORE any
// payment exists. It is a PENDING-PAYMENT notice, not a confirmation, and
// carries no QR or PDF ticket: handing over a ticket here would vouch for a
// spot nobody has paid for. It lists every available payment method
// (Mercado Pago and, when it applies, Clip). Issuing the real ticket once
// the payment is validated is Frente B, a separate future phase.

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
  clipPaymentLink: string | null
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

function paymentButton(href: string, label: string, primary: boolean): string {
  const style = primary
    ? 'background:#111;color:#E6F2B1'
    : 'background:#fff;color:#111;border:2px solid #111'
  return `<a href="${escapeHtml(href)}" style="${style};padding:14px 24px;text-decoration:none;font-weight:700;display:inline-block;margin:0 8px 12px 0">${escapeHtml(label)}</a>`
}

function buildHtml(payload: RegistrationEmailPayload): string {
  const participantsHtml = payload.participants.map((p) => escapeHtml(p)).join(', ')

  const buttons = [
    payload.paymentLink ? paymentButton(payload.paymentLink, 'Pagar con Mercado Pago', true) : null,
    payload.clipPaymentLink ? paymentButton(payload.clipPaymentLink, 'Pagar con Clip', false) : null,
  ].filter((b): b is string => b !== null)

  const paymentBlock = buttons.length > 0
    ? `<p style="margin:8px 0 0;font-weight:700">Elige cómo pagar:</p>
       <p style="margin:12px 0 0">${buttons.join('')}</p>`
    : `<p style="margin:24px 0;color:#444">Aún no está disponible el link de pago para esta categoría — te contactaremos en breve para completarlo.</p>`

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <p style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin-bottom:4px">Hybrid Experience</p>
      <h1 style="font-size:22px;margin:0 0 16px">Recibimos tu registro, ${escapeHtml(payload.contactName)}</h1>
      <p style="margin:0 0 4px"><strong>${escapeHtml(payload.categoryName)}</strong></p>
      <p style="margin:0 0 16px;color:#444">${escapeHtml(payload.amountLabel)}</p>
      <p style="margin:0 0 16px;color:#444">Participantes: ${participantsHtml}</p>
      <p style="margin:0 0 8px;color:#444">Tu lugar todavía <strong>no está confirmado</strong>. Para confirmarlo, completa tu pago con cualquiera de los métodos disponibles.</p>
      ${paymentBlock}
      <p style="margin:24px 0 0;color:#666;font-size:13px">Cuando validemos tu pago te enviamos tu boleto con el código de acceso al evento.</p>
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

  const html = buildHtml({
    to: payload.to,
    contactName: payload.contactName,
    categoryName: payload.categoryName,
    amountLabel: payload.amountLabel,
    participants: payload.participants.filter(isNonEmptyString),
    paymentLink: isNonEmptyString(payload.paymentLink) ? payload.paymentLink : null,
    clipPaymentLink: isNonEmptyString(payload.clipPaymentLink) ? payload.clipPaymentLink : null,
  })

  // Sin adjuntos a propósito: no se entrega boleto antes del pago.
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
