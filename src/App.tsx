import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HexCalculatorPage } from './pages/HexCalculatorPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/tools/hex-calculator" element={<HexCalculatorPage />} />
          <Route path="/" element={<Navigate to="/tools/hex-calculator" replace />} />
          <Route path="*" element={<Navigate to="/tools/hex-calculator" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
