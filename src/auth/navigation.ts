import type { Role } from '@/api/types'

export interface NavItem {
  to: string
  label: string
}

// Menü rolüne göre değişir (CLAUDE.md §5, §12)
const NAVIGATION: Record<Role, NavItem[]> = {
  Specialist: [
    { to: '/queue', label: 'İşlem Kuyruğu' },
    { to: '/knowledge-base', label: 'Bilgi Tabanı' },
  ],
  TeamLead: [
    { to: '/queue', label: 'Ekip Kuyruğu' },
    { to: '/approvals', label: 'Onay Bekleyenler' },
    { to: '/knowledge-base', label: 'Bilgi Tabanı' },
    { to: '/dashboard', label: 'Dashboard' },
  ],
  Manager: [{ to: '/dashboard', label: 'Dashboard' }],
}

export function navigationFor(role: Role): NavItem[] {
  return NAVIGATION[role]
}

export function homePathFor(role: Role): string {
  return NAVIGATION[role][0].to
}
