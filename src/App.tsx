import { Outlet } from '@tanstack/react-router'
import { HOLDING_MODE_ACTIVE } from './config/holdingMode'
import HoldingPage from './pages/HoldingPage'

export default function App() {
  if (HOLDING_MODE_ACTIVE) return <HoldingPage />
  return <Outlet />
}
