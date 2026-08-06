import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Button, Card, CardContent, Container, IconButton, Stack, TextField, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import RouteMetadata from '../components/RouteMetadata'
import { CATALOGO, formatPrecio, getPrecioParaEtapa } from '../data/catalogo'
import type { Producto } from '../data/catalogo'
import { resolveEtapaComercial } from '../config/pricingStage'
import { submitInscripcion } from '../api/inscripciones'
import { generateQrTicket } from '../lib/qrTicket'
import { buildTicketPdfBase64 } from '../lib/registrationPdf'
import { sendRegistrationEmail } from '../api/registrationEmail'
import { getPaymentLinkForProducto } from '../config/paymentLinks'
import { getSupportWhatsAppUrl } from '../config/supportConfig'

type ViewState =
  | { kind: 'form' }
  | { kind: 'submitting' }
  | { kind: 'done'; qrUrl: string | null; pdfBase64: string | null; registrationId: string }
  | { kind: 'error'; message: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getMensajePago(producto: Producto): string {
  if (producto.msi) {
    return '3 MESES SIN INTERESES — Disponible con tarjetas participantes a través de Mercado Pago.'
  }
  if (producto.tipo === 'Workout Experience') {
    return `PRECIO ÚNICO ${formatPrecio(producto.precios as number)} durante todas las etapas. Sin meses sin intereses.`
  }
  return 'Pago seguro mediante Mercado Pago. Este producto no participa en 3 meses sin intereses.'
}

export default function InscribirPage() {
  const search = useSearch({ from: '/inscribir' })
  const producto = useMemo(() => CATALOGO.find((p) => p.code === search.cat), [search.cat])
  const etapaActual = resolveEtapaComercial()
  const precioActual = producto ? getPrecioParaEtapa(producto, etapaActual) : 0
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back()
    } else {
      void router.navigate({ to: '/' })
    }
  }

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
          <IconButton onClick={handleBack} aria-label="Volver" sx={{ color: '#E6F2B1', borderRadius: 0, mb: 1 }}>
            <ArrowBackIcon />
          </IconButton>
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
      precioPagado: precioActual,
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

    const qrUrl = await generateQrTicket({ registrationId, producto, participants, precio: precioActual })
    const amountLabel = `${formatPrecio(precioActual)} · ${producto.precioUnidad}`
    const pdfBase64 = buildTicketPdfBase64({
      registrationId,
      categoryName: producto.nombre,
      amountLabel,
      participants,
      qrDataUrl: qrUrl,
    })
    setView({ kind: 'done', qrUrl, pdfBase64, registrationId })

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
    // Código corto derivado del UUID de la fila: permite ubicar el registro
    // exacto desde el mensaje de WhatsApp (LIKE 'xxxxxxxx%' sobre id::text).
    const inscriptionCode = `HEX-${view.registrationId.slice(0, 8).toUpperCase()}`
    const paidWhatsappUrl = getSupportWhatsAppUrl(
      `Hola, ya pagué mi inscripción a ${producto.nombre} (${formatPrecio(precioActual)}). Mi código es ${inscriptionCode}. Nombre: ${contactName.trim()}.`,
    )
    const whatsappUrl = getSupportWhatsAppUrl(
      `Hola, acabo de registrarme para ${producto.nombre} (${formatPrecio(precioActual)}) y necesito el link de pago. Mi código es ${inscriptionCode}.`,
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
              {formatPrecio(precioActual)} · {producto.precioUnidad}
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
                  Ir a pagar {formatPrecio(precioActual)}
                </Button>
                {paidWhatsappUrl && (
                  <>
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                      Ya que pagues, avísanos por WhatsApp para confirmarte tu lugar. Tu código es{' '}
                      <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>{inscriptionCode}</Box>.
                    </Typography>
                    <Button
                      component="a"
                      href={paidWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="large"
                    >
                      Ya pagué — avisar por WhatsApp
                    </Button>
                  </>
                )}
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
        <IconButton onClick={handleBack} aria-label="Volver" sx={{ color: '#E6F2B1', borderRadius: 0, mb: 1 }}>
          <ArrowBackIcon />
        </IconButton>
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
                {formatPrecio(precioActual)} · {producto.precioUnidad}
              </Typography>
              <Typography sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em', mt: 0.5 }}>
                {getMensajePago(producto)}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', mt: 1 }}>
                Llena tus datos{producto.integrantes > 1 ? ' y los de tu equipo' : ''}. Al continuar te
                mostramos el link de pago de Mercado Pago para confirmar tu lugar, y te enviamos tu
                boleto (QR + PDF) por correo.
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
