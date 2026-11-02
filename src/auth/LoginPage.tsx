import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from './AuthContext'
import { homePathFor } from './navigation'

const schema = z.object({
  username: z.string().min(1, 'Kullanıcı adı gerekli'),
  password: z.string().min(1, 'Parola gerekli'),
})
type LoginForm = z.infer<typeof schema>

// Demo kullanıcı adları (parola burada yazılmaz, sunumda paylaşılır)
const DEMO_USERS = [
  { username: 'elif.kaya', label: 'Elif Kaya · Uzman' },
  { username: 'burak.demir', label: 'Burak Demir · Takım Lideri' },
  { username: 'selin.aydin', label: 'Selin Aydın · Yönetici' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? homePathFor(user.role)} replace />
  }

  async function onSubmit(values: LoginForm) {
    setServerError(null)
    try {
      await login(values.username, values.password)
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Giriş yapılamadı.')
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">BankOps AI</h1>
          <p className="text-sm text-muted-foreground">Ödeme Operasyonları · Sentetik demo verisi</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Kullanıcı adı</Label>
            <Input id="username" autoComplete="username" aria-invalid={!!errors.username} {...register('username')} />
            {errors.username && <p className="text-sm text-critical">{errors.username.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Parola</Label>
            <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
            {errors.password && <p className="text-sm text-critical">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p role="alert" className="rounded-md bg-critical-bg px-3 py-2 text-sm text-critical">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </Button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Demo kullanıcıları</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.username}
                type="button"
                onClick={() => setValue('username', demo.username, { shouldValidate: true })}
                className="rounded-md border bg-neutral-bg px-2 py-1 text-xs text-neutral hover:bg-muted"
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
