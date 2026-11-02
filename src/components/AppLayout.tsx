import { NavLink, Outlet } from 'react-router'
import { navigationFor } from '@/auth/navigation'
import { useAuth } from '@/auth/AuthContext'
import { ROLE_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

function initials(fullName: string): string {
  return fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

/** Sol menü (mobilde üste taşınır) + sayfa içeriği. Her ekranda "Sentetik demo verisi" etiketi görünür. */
export function AppLayout() {
  const { user, logout } = useAuth()
  if (!user) return null
  const items = navigationFor(user.role)

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground md:min-h-svh md:w-60 md:shrink-0 md:p-5">
        <div className="flex items-center justify-between gap-3 md:block">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold">BO</span>
            <div>
              <p className="font-semibold leading-tight">BankOps AI</p>
              <p className="text-xs opacity-70">Ödeme Operasyonları</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="rounded-md px-2 py-1 text-xs opacity-80 hover:bg-white/10 md:hidden">
            Çıkış
          </button>
        </div>

        <nav aria-label="Ana menü" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-white/10', isActive && 'bg-white/15 font-medium')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden items-center gap-3 border-t border-white/15 pt-4 md:flex">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-medium">{initials(user.fullName)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs opacity-70">{ROLE_LABELS[user.role]}</p>
          </div>
          <button type="button" onClick={logout} className="rounded-md px-2 py-1 text-xs opacity-80 hover:bg-white/10">
            Çıkış
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}

/** Her sayfanın başlık satırı: başlık/alt başlık solda, demo etiketi sağda. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <span className="shrink-0 rounded-md border bg-card px-3 py-1 text-xs text-muted-foreground">Sentetik demo verisi</span>
    </div>
  )
}
