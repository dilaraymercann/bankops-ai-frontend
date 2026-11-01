import { Button } from '@/components/ui/button'

// Faz 0 yer tutucu ekranı: Tailwind, tema renkleri, yazı tipleri ve shadcn/ui kurulumunu doğrular.
// Gerçek layout (sol menü, ekranlar) Faz 2'de eklenecek.
function App() {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 bg-sidebar p-5 text-sidebar-foreground md:block">
        <p className="text-lg font-semibold">BankOps AI</p>
        <p className="text-sm opacity-70">Ödeme Operasyonları</p>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">BankOps AI</h1>
          <span className="rounded-md border bg-card px-3 py-1 text-xs text-muted-foreground">
            Sentetik demo verisi
          </span>
        </div>

        <div className="mt-6 max-w-xl rounded-lg border bg-card p-6">
          <p>Proje iskeleti hazır. Ekranlar sonraki fazlarda eklenecek.</p>
          <p className="mt-2 font-mono text-sm text-muted-foreground">EXC-2026-10482 · 48.750,00 TL</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded px-2 py-0.5 text-xs font-medium bg-critical-bg text-critical">Kritik</span>
            <span className="rounded px-2 py-0.5 text-xs font-medium bg-warning-bg text-warning">Yüksek</span>
            <span className="rounded px-2 py-0.5 text-xs font-medium bg-info-bg text-info">Orta</span>
            <span className="rounded px-2 py-0.5 text-xs font-medium bg-neutral-bg text-neutral">Düşük</span>
            <span className="rounded px-2 py-0.5 text-xs font-medium bg-success-bg text-success">Onaylı</span>
          </div>

          <Button className="mt-6">Filtrele</Button>
        </div>
      </main>
    </div>
  )
}

export default App
