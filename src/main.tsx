import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './lib/sentry'
import { theme } from './theme'
import { routeTree } from './routeTree.gen'
import NotFoundPage from './pages/NotFoundPage'

const router = createRouter({ routeTree, defaultNotFoundComponent: NotFoundPage })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function ErrorFallback() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Algo salió mal
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Recarga la página. Si el problema sigue, contáctanos.
        </Typography>
      </Box>
    </Box>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
