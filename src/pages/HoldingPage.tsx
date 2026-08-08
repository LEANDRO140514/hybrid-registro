import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import RouteMetadata from '../components/RouteMetadata'
import { submitListaEspera } from '../api/listaEspera'
import type { ModalidadListaEspera } from '../api/listaEspera'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const BG_IMAGE =
  'https://3e9sriq7.us-east.insforge.app/api/storage/buckets/images/objects/atmosphere%2Fholding-page-runners-w1600.webp?v=f94bf5d2ec5af6adbe115c27b3ac804a'

const MODALIDAD_OPTIONS: { value: ModalidadListaEspera; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'equipo', label: 'En equipo' },
  { value: 'decidiendo', label: 'Aún estoy decidiendo' },
]

const bodyTextSx = {
  color: 'rgba(255,255,255,0.75)',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: { xs: '0.9rem', sm: '1rem' },
  lineHeight: 1.6,
} as const

const strongTextSx = {
  color: '#fff',
  fontWeight: 700,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: { xs: '0.95rem', sm: '1.05rem' },
} as const

type ViewState = 'form' | 'submitting' | 'done' | 'error'

export default function HoldingPage() {
  const [view, setView] = useState<ViewState>('form')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [modalidad, setModalidad] = useState<ModalidadListaEspera | null>(null)

  const isValid =
    nombre.trim().length > 1 &&
    EMAIL_PATTERN.test(correo.trim()) &&
    telefono.trim().length >= 10 &&
    modalidad != null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid || !modalidad) return
    setView('submitting')
    const result = await submitListaEspera({
      nombre: nombre.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      modalidad,
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
        title="HYBRID EXPERIENCE | Nueva fecha: 13-15 noviembre"
        description="HYBRID EXPERIENCE 2026 tiene nueva fecha: 13, 14 y 15 de noviembre en Club Cumbres, Mérida. Únete a la Lista HYBRID para acceso prioritario."
        path="/"
      />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center' }}>
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

          <Stack spacing={2}>
            <Typography
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontSize: { xs: '1.3rem', sm: '1.6rem' },
              }}
            >
              HYBRID EXPERIENCE tiene nueva fecha
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                color: '#E6F2B1',
                letterSpacing: '0.06em',
                fontSize: { xs: '2rem', sm: '2.6rem' },
              }}
            >
              13 · 14 · 15 NOVIEMBRE
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.85)',
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
              }}
            >
              Más tiempo para entrenar. Más tiempo para prepararte. Más tiempo para vivir el reto.
            </Typography>
          </Stack>

          <Stack spacing={2} sx={{ maxWidth: 520 }}>
            <Typography sx={bodyTextSx}>
              La comunidad HYBRID EXPERIENCE sigue creciendo y queremos que seas parte de lo que viene.
            </Typography>
            <Typography sx={bodyTextSx}>
              Nos encontramos este <strong>13, 14 y 15 de noviembre</strong> para vivir tres días de
              deporte, reto, energía y comunidad.
            </Typography>
          </Stack>

          <Stack spacing={0.25}>
            <Typography sx={bodyTextSx}>HYBRID EXPERIENCE es para quienes ya compiten.</Typography>
            <Typography sx={bodyTextSx}>Para quienes sueñan con hacerlo por primera vez.</Typography>
            <Typography sx={bodyTextSx}>Y para quienes han hecho del deporte una forma de vida.</Typography>
          </Stack>

          <Typography sx={{ ...bodyTextSx, maxWidth: 520 }}>
            No importa si vienes por tu mejor marca, por tu primera competencia o simplemente por la
            experiencia de compartir el reto con una comunidad que siente la misma pasión que tú.
          </Typography>

          <Stack spacing={0.25}>
            <Typography sx={strongTextSx}>Aquí cada entrenamiento suma.</Typography>
            <Typography sx={strongTextSx}>Cada meta inspira.</Typography>
            <Typography sx={strongTextSx}>Y cada persona fortalece nuestra comunidad.</Typography>
          </Stack>

          <Stack spacing={0.25}>
            <Typography sx={bodyTextSx}>No importa cuándo empezaste.</Typography>
            <Typography sx={bodyTextSx}>No importa tu nivel.</Typography>
            <Typography sx={bodyTextSx}>No importa de dónde vienes.</Typography>
          </Stack>

          <Box
            sx={{
              borderTop: '1px solid rgba(230,242,177,0.5)',
              borderBottom: '1px solid rgba(230,242,177,0.5)',
              py: 2,
              px: { xs: 1, sm: 3 },
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                color: '#E6F2B1',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                fontSize: { xs: '1.15rem', sm: '1.4rem' },
                lineHeight: 1.4,
              }}
            >
              Lo importante es que hoy perteneces.
            </Typography>
          </Box>

          <Stack spacing={0.5}>
            <Typography
              sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, letterSpacing: '0.05em' }}
            >
              HYBRID EXPERIENCE
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                color: '#E6F2B1',
                letterSpacing: '0.05em',
              }}
            >
              13 · 14 · 15 NOVIEMBRE
            </Typography>
          </Stack>

          <Divider sx={{ width: '100%', borderColor: 'rgba(230,242,177,0.2)' }} />

          <Stack spacing={1} sx={{ width: '100%' }}>
            <Typography
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#E6F2B1',
                fontSize: { xs: '1.2rem', sm: '1.4rem' },
              }}
            >
              Lista Hybrid
            </Typography>
            <Typography
              sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}
            >
              Sé de los primeros en vivir lo que viene.
            </Typography>
            <Typography sx={bodyTextSx}>
              Déjanos tus datos para recibir las novedades de esta edición y tener{' '}
              <strong>
                acceso prioritario a la información de inscripciones, categorías y próximos anuncios de
                HYBRID EXPERIENCE.
              </strong>
            </Typography>
          </Stack>

          {view === 'done' ? (
            <Typography sx={{ color: '#E6F2B1', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              ¡Listo! Ya estás en la Lista HYBRID — te avisaremos con las novedades.
            </Typography>
          ) : (
            <Stack component="form" spacing={2.5} sx={{ width: '100%' }} onSubmit={(e) => void handleSubmit(e)}>
              <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth required />
              <TextField
                label="WhatsApp"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
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

              <Stack spacing={1} sx={{ textAlign: 'left', width: '100%' }}>
                <Typography
                  sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
                >
                  ¿Cómo quieres vivir HYBRID EXPERIENCE?
                </Typography>
                <ToggleButtonGroup
                  value={modalidad}
                  exclusive
                  onChange={(_e, next: ModalidadListaEspera | null) => next && setModalidad(next)}
                  aria-label="Cómo quieres vivir HYBRID EXPERIENCE"
                  sx={{
                    flexWrap: 'wrap',
                    gap: 1,
                    '& .MuiToggleButtonGroup-grouped': {
                      border: '1px solid rgba(230,242,177,0.4) !important',
                      borderRadius: '0 !important',
                      margin: 0,
                    },
                  }}
                >
                  {MODALIDAD_OPTIONS.map((opt) => (
                    <ToggleButton
                      key={opt.value}
                      value={opt.value}
                      sx={{
                        color: 'rgba(255,255,255,0.75)',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 2,
                        py: 1,
                        '&.Mui-selected': {
                          color: '#000',
                          bgcolor: '#E6F2B1',
                          '&:hover': { bgcolor: '#E6F2B1' },
                        },
                      }}
                    >
                      {opt.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>

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
                {view === 'submitting' ? 'Enviando…' : 'Quiero acceso prioritario'}
              </Button>

              <Typography sx={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>
                Registrarte en la Lista HYBRID no genera ningún cargo ni constituye una inscripción o
                reservación. Te contactaremos con la información necesaria para completar tu registro.
              </Typography>

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
