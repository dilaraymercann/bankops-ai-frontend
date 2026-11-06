import { loadSession } from '@/auth/session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/** API'nin ProblemDetail (RFC 9457) hata yanıtını taşır. */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Oturum süresi dolduğunda ya da token geçersiz olduğunda AuthProvider'a haber verilir. */
export const UNAUTHORIZED_EVENT = 'bankops:unauthorized'

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = loadSession()?.token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.')
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new ApiError(response.status, problem?.detail ?? 'Beklenmeyen bir hata oluştu.')
  }
  // 204 No Content (örn. henüz AI analizi yok): gövde yoktur
  if (response.status === 204) return null as T
  return (await response.json()) as T
}
