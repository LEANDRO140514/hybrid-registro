import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material'
import { Link, useSearch } from '@tanstack/react-router'
import RouteMetadata from '../components/RouteMetadata'
import { CATALOGO, formatPrecio } from '../data/catalogo'
import { submitInscripcion } from '../api/inscripciones'
import { generateQrTicket } from '../lib/qrTicket'
import { buildTicketPdfBase64 } from '../lib/registrationPdf'
import { sendRegistrationEmail } from '../api/registrationEmail'
import { getPaymentLinkForProducto } from '../config/paymentLinks'
import { getSupportWhatsAppUrl } from '../config/supportConfig'

type ViewState =
  | { kind: 'form' }
  | { kind: 'submitting' }
  | { kind: 'done'; qrUrl: string | null; pdfBase64: string | null }
  | { kind: 'error'; message: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function InscribirPage() {
  const search = useSearch({ from: '/inscribir' })
  const producto = useMemo(() => CATALOGO.find((p) => p.code === search.cat), [search.cat])

  const [view, setView] = useState<ViewState>({ kind: 'form' })
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teammateNames, setTeammateNames] = useState<string[]>(
    () => Array.from({ length: Math.max((producto?.integrantes ?? 1) - 1, 0) }, () => ''),
  )
  const [formError, setFormError] = useState<string | null>(null)

  if (!producto) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff', display: 'flex', alignItems: 'center', py: 8 }}>
        <RouteMetadata
          title="Categoría no encontrada | HYBRID EXPERIENCE"
          description="No encontramos la categoría solicitada."
          path="/inscribir"
        />
        <Container maxWidth="sm">
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              No encontramos esta categoría
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
              El link de inscripción no es válido o la categoría ya no está disponible.
            </Typography>
            <Button component={Link} to="/" variant="outlined">
              Volver al inicio
            </Button>
          </Stack>
        </Container>
      </Box>
    )
  }

  const teammatesNeeded = Math.max(producto.integrantes - 1, 0)

  const handleTeammateChange = (index: number, value: string) => {
    setTeammateNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setFormError('Completa nombre, email y teléfono de contacto.')
      return
    }
    if (!EMAIL_PATTERN.test(contactEmail.trim())) {
      setFormError('Revisa el email de contacto.')
      return
    }
    if (teammatesNeeded > 0 && teammateNames.some((name) => !name.trim())) {
      setFormError(`Completa el nombre de ${teammatesNeeded === 1 ? 'tu pareja' : 'todos tus compañeros de equipo'}.`)
      return
    }

    setView({ kind: 'submitting' })
    const registrationId = crypto.randomUUID()
    const participants = [contactName.trim(), ...teammateNames.map((n) => n.trim())]
    const result = await submitInscripcion({
      id: registrationId,
      producto,
      teamName: teammatesNeeded > 0 && teamName.trim() ? teamName.trim() : null,
      participants,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
    })

    if (!result.ok) {
      setView({ kind: 'error', message: result.error ?? 'No pudimos guardar tu registro. Inténtalo de nuevo.' })
      return
    }

    const qrUrl = await generateQrTicket({ registrationId, producto, participants, precio: producto.precio })
    const amountLabel = `${formatPrecio(producto.precio)} · ${producto.precioUnidad}`
    const pdfBase64 = buildTicketPdfBase64({
      registrationId,
      categoryName: producto.nombre,
      amountLabel,
      participants,
      qrDataUrl: qrUrl,
    })
    setView({ kind: 'done', qrUrl, pdfBase64 })

    void sendRegistrationEmail({
      to: contactEmail.trim(),
      contactName: contactName.trim(),
      categoryName: producto.nombre,
      amountLabel,
      participants,
      paymentLink: getPaymentLinkForProducto(producto),
      qrDataUrl: qrUrl,
      pdfBase64,
    })
  }

  if (view.kind === 'done') {
    const paymentLink = getPaymentLinkForProducto(producto)
    const whatsappUrl = getSupportWhatsAppUrl(
      `Hola, acabo de registrarme para ${producto.nombre} (${formatPrecio(producto.precio)}) y necesito el link de pago.`,
    )

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff', display: 'flex', alignItems: 'center', py: { xs: 8, md: 12 } }}>
        <RouteMetadata
          title="Registro recibido | HYBRID EXPERIENCE"
          description="Tu registro para HYBRID EXPERIENCE fue recibido."
          path="/inscribir"
        />
        <Container maxWidth="sm">
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <Typography
              component="p"
              sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}
            >
              Registro recibido
            </Typography>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {producto.nombre}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {formatPrecio(producto.precio)} · {producto.precioUnidad}
            </Typography>

            {view.qrUrl && (
              <Box
                component="img"
                src={view.qrUrl}
                alt="Código QR de tu registro"
                sx={{ width: 220, height: 220, bgcolor: '#fff', p: 1 }}
              />
            )}

            {view.pdfBase64 && (
              <Button
                component="a"
                href={`data:application/pdf;base64,${view.pdfBase64}`}
                download="hybrid-experience-boleto.pdf"
                variant="outlined"
                sx={{ color: 'rgba(255,255,255,0.85)' }}
              >
                Descargar boleto en PDF
              </Button>
            )}

            {paymentLink ? (
              <>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Para confirmar tu lugar, completa el pago con el siguiente link:
                </Typography>
                <Button
                  component="a"
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  color="primary"
                  size="large"
                >
                  Ir a pagar {formatPrecio(producto.precio)}
                </Button>
              </>
            ) : (
              <>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Guardamos tu registro. El link de pago para esta categoría todavía no está disponible —
                  te contactaremos en breve para completarlo.
                </Typography>
                {whatsappUrl && (
                  <Button component="a" href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="outlined">
                    Escribir por WhatsApp
                  </Button>
                )}
              </>
            )}

            <Button component={Link} to="/" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'none' }}>
              Volver al inicio
            </Button>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff', py: { xs: 6, md: 10 } }}>
      <RouteMetadata
        title={`Inscripción — ${producto.nombre} | HYBRID EXPERIENCE`}
        description={`Formulario de inscripción para ${producto.nombre}.`}
        path="/inscribir"
      />
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={0.5} sx={{ mb: 3 }}>
              <Typography
                sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}
              >
                Inscripción
              </Typography>
              <Typography component="h1" variant="h5" sx={{ fontWeight: 900 }}>
                {producto.nombre}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {formatPrecio(producto.precio)} · {producto.precioUnidad}
              </Typography>
            </Stack>

            <Stack component="form" spacing={2.5} onSubmit={(e) => void handleSubmit(e)}>
              <TextField
                label="Nombre completo (contacto)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Email de contacto"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Teléfono de contacto"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                fullWidth
              />

              {teammatesNeeded > 0 && (
                <>
                  <TextField
                    label="Nombre del equipo (opcional)"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    fullWidth
                  />
                  {teammateNames.map((name, index) => (
                    <TextField
                      key={index}
                      label={teammatesNeeded === 1 ? 'Nombre de tu pareja' : `Nombre integrante ${index + 2}`}
                      value={name}
                      onChange={(e) => handleTeammateChange(index, e.target.value)}
                      required
                      fullWidth
                    />
                  ))}
                </>
              )}

              {formError && (
                <Typography role="alert" sx={{ color: 'error.main', fontSize: '0.85rem' }}>
                  {formError}
                </Typography>
              )}
              {view.kind === 'error' && (
                <Typography role="alert" sx={{ color: 'error.main', fontSize: '0.85rem' }}>
                  {view.message}
                </Typography>
              )}

              <Button type="submit" variant="contained" color="primary" size="large" disabled={view.kind === 'submitting'}>
                {view.kind === 'submitting' ? 'Enviando…' : 'Continuar'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
