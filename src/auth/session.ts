import type { UserSummary } from '@/api/types'

export interface Session {
  token: string
  expiresAt: string
  user: UserSummary
}

const STORAGE_KEY = 'bankops.session'

// Token sessionStorage'da tutulur: sekme kapanınca silinir ve localStorage'a göre daha kısa ömürlüdür.
// Uzun vadede daha güvenli seçenek HttpOnly cookie'dir; bu demo için yeterli bir ödünleşimdir.
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
