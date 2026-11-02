import type { Channel, CaseStatus, Priority, Role, SlaState, TransactionType } from '@/api/types'

// Arayüz metinleri Türkçedir (CLAUDE.md §2); kodda ve API'de İngilizce adlar kullanılır.

export const STATUS_LABELS: Record<CaseStatus, string> = {
  New: 'Yeni',
  Assigned: 'Atandı',
  InReview: 'İncelemede',
  AwaitingInfo: 'Bilgi Bekleniyor',
  SolutionProposed: 'Çözüm Önerildi',
  Escalated: 'Eskale Edildi',
  Closed: 'Kapatıldı',
  Rejected: 'Reddedildi',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  Critical: 'Kritik',
  High: 'Yüksek',
  Medium: 'Orta',
  Low: 'Düşük',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  Transfer: 'Havale',
  Fast: 'FAST',
  BulkPayment: 'Toplu Ödeme',
  CorporateOrder: 'Kurumsal Talimat',
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  InternetBranch: 'İnternet Şubesi',
  Mobile: 'Mobil',
  Branch: 'Şube',
  CorporateApi: 'Kurumsal API',
}

export const SLA_STATE_LABELS: Record<SlaState, string> = {
  Breached: 'SLA aşıldı',
  Approaching: 'SLA yaklaşıyor',
  Normal: 'Normal',
}

export const ROLE_LABELS: Record<Role, string> = {
  Specialist: 'Operasyon Uzmanı',
  TeamLead: 'Takım Lideri',
  Manager: 'Yönetici',
}
