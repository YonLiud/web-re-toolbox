import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('toolbox-theme') === 'dark' ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('toolbox-theme', theme)
  }, [theme])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b pb-6">
          <Link to="/tools/hex-calculator" className="text-sm font-medium text-muted-foreground">
            Web RE Toolbox
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(open => !open)}
                aria-expanded={isMenuOpen}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Tools
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border bg-card p-1 text-card-foreground shadow-md">
                  <Link
                    to="/tools/hex-calculator"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex rounded-sm bg-accent px-2 py-2 text-sm font-medium text-accent-foreground"
                  >
                    Hex calculator
                  </Link>
                  <p className="px-2 py-2 text-xs text-muted-foreground">More tools will appear here.</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </main>
  )
}
