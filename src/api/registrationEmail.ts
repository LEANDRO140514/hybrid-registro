interface RegistrationEmailInput {
  to: string
  contactName: string
  categoryName: string
  amountLabel: string
  participants: string[]
  paymentLink: string | null
  qrDataUrl: string | null
  pdfBase64: string | null
}

// Plain fetch instead of insforge.functions.invoke(): that SDK method
// reliably fails with a client-side NETWORK_ERROR in this app (never even
// reaches the network per devtools), while a direct fetch to the same
// function URL works every time. Fire-and-forget — email delivery is a
// nice-to-have, not part of the critical path.
export async function sendRegistrationEmail(input: RegistrationEmailInput): Promise<void> {
  try {
    await fetch(`${import.meta.env.VITE_INSFORGE_URL}/functions/send-registration-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    // Swallowed on purpose — see comment above.
  }
}
