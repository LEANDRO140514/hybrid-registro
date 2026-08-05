import { useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Button, Container, Stack, TextField, Typography } from '@mui/material'
import RouteMetadata from '../components/RouteMetadata'
import { submitListaEspera } from '../api/listaEspera'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const BG_IMAGE =
  'https://3e9sriq7.us-east.insforge.app/api/storage/buckets/images/objects/atmosphere%2Fholding-page-runners-w1600.webp?v=f94bf5d2ec5af6adbe115c27b3ac804a'

type ViewState = 'form' | 'submitting' | 'done' | 'error'

export default function HoldingPage() {
  const [view, setView] = useState<ViewState>('form')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')

  const isValid = nombre.trim().length > 1 && EMAIL_PATTERN.test(correo.trim()) && telefono.trim().length >= 10

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setView('submitting')
    const result = await submitListaEspera({
      nombre: nombre.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
    })
    setView(result.ok ? 'done' : 'error')
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        bgcolor: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        py: 8,
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.85) 100%)',
        },
      }}
    >
      <RouteMetadata
        title="HYBRID EXPERIENCE | Muy pronto"
        description="HYBRID EXPERIENCE 2026 — 9 al 11 de octubre en Club Cumbres, Mérida. Las inscripciones reabren muy pronto."
        path="/"
      />
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'tt-norms-pro-extra-black-italic, sans-serif',
              fontStyle: 'italic',
              color: '#E6F2B1',
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
              lineHeight: 1.1,
            }}
          >
            HYBRID
            <br />
            EXPERIENCE
          </Typography>

          <Stack spacing={0.5}>
            <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>
              9–11 OCTUBRE 2026
            </Typography>
            <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", color: 'rgba(255,255,255,0.6)' }}>
              Club Cumbres · Mérida, Yucatán
            </Typography>
          </Stack>

          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Space Grotesk', sans-serif" }}>
            Estamos ajustando los detalles del itinerario. Las inscripciones vuelven a abrir muy pronto —
            deja tus datos y te avisamos en cuanto estén disponibles.
          </Typography>

          {view === 'done' ? (
            <Typography sx={{ color: '#E6F2B1', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              ¡Listo! Te avisaremos en cuanto reabramos las inscripciones.
            </Typography>
          ) : (
            <Stack component="form" spacing={2} sx={{ width: '100%' }} onSubmit={(e) => void handleSubmit(e)}>
              <TextField
                label="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="WhatsApp"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                fullWidth
                required
              />
              <Button
                type="submit"
                variant="outlined"
                size="large"
                disabled={!isValid || view === 'submitting'}
                sx={{
                  borderRadius: 0,
                  borderWidth: 2,
                  borderColor: '#E6F2B1',
                  color: '#E6F2B1',
                  fontWeight: 700,
                  py: 1.25,
                  '&:hover': { borderWidth: 2, borderColor: '#E6F2B1', bgcolor: 'rgba(230,242,177,0.1)' },
                }}
              >
                {view === 'submitting' ? 'Enviando…' : 'Avísame cuando abran'}
              </Button>
              {view === 'error' && (
                <Typography sx={{ color: '#ff8a8a', fontSize: '0.85rem' }}>
                  No pudimos guardar tu reserva. Inténtalo de nuevo en unos minutos.
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
