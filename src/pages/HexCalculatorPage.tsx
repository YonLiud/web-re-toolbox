import { HexCalculator } from '../tools/hex-calculator'

export function HexCalculatorPage() {
  return (
    <div className="py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Hex calculator</h1>
        <p className="mt-2 text-sm text-muted-foreground">Evaluate hexadecimal and decimal integer expressions.</p>
      </header>
      <HexCalculator />
    </div>
  )
}
