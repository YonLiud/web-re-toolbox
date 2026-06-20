import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { Shell } from './components/Shell'
import { Home } from './pages/Home'
import { tools } from './tools/registry'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            {tools.map(({ meta, Component }) => (
              <Route key={meta.slug} path={`/${meta.slug}`} element={<Component />} />
            ))}
          </Routes>
        </Shell>
      </BrowserRouter>
    </ThemeProvider>
  )
}
