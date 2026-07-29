// PLANB-LANDING-01: número de WhatsApp de soporte.
// Formato wa.me: código de país + número, solo dígitos, sin +, espacios ni guiones.
// México: 52 + 10 dígitos (ej. '529991234567').
// Mientras siga en null, los botones de WhatsApp no se renderizan.
export const SUPPORT_WHATSAPP_NUMBER: string | null = '529902302378'

export function getSupportWhatsAppUrl(message?: string): string | null {
  if (!SUPPORT_WHATSAPP_NUMBER) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}${text}`
}
