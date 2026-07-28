// PLANB-LANDING-01: número de WhatsApp de soporte pendiente de confirmar.
export const SUPPORT_WHATSAPP_NUMBER: string | null = null

export function getSupportWhatsAppUrl(message?: string): string | null {
  if (!SUPPORT_WHATSAPP_NUMBER) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}${text}`
}
