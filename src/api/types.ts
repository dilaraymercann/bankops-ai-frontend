// Backend DTO'larının (bankops_backend/application) TypeScript karşılıkları.
// Sabit değerler API ile birebir aynıdır; tutarlar string taşınır.

export const ROLES = ['Specialist', 'TeamLead', 'Manager'] as const
export type Role = (typeof ROLES)[number]

export const CASE_STATUSES = [
  'New', 'Assigned', 'InReview', 'AwaitingInfo', 'SolutionProposed', 'Escalated', 'Closed', 'Rejected',
] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const
export type Priority = (typeof PRIORITIES)[number]

export const TRANSACTION_TYPES = ['Transfer', 'Fast', 'BulkPayment', 'CorporateOrder'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const ERROR_CODES = [
  'IBAN_CHECKSUM', 'NAME_MISMATCH', 'DUPLICATE_SUSPECT', 'FAST_LIMIT', 'OUT_OF_HOURS',
  'HOLIDAY_VALUE_DATE', 'ACCOUNT_BLOCKED', 'SANCTION_HIT', 'BATCH_FORMAT', 'TIMEOUT',
] as const
export type ErrorCode = (typeof ERROR_CODES)[number]

export const SLA_STATES = ['Breached', 'Approaching', 'Normal'] as const
export type SlaState = (typeof SLA_STATES)[number]

export type Channel = 'InternetBranch' | 'Mobile' | 'Branch' | 'CorporateApi'

export interface UserSummary {
  id: number
  fullName: string
  username: string
  role: Role
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: UserSummary
}

export interface SlaView {
  state: SlaState
  /** Kalan çalışma süresi (dakika); süre aşıldıysa negatif. */
  remainingMinutes: number
  /** 0..1: sürenin ne kadarı doldu. */
  progress: number
}

export interface CaseListItem {
  id: number
  caseNumber: string
  transactionType: TransactionType
  errorCode: ErrorCode
  errorDescription: string
  amount: string
  currency: string
  priority: Priority
  status: CaseStatus
  escalated: boolean
  slaDeadline: string
  /** Kapalı kayıtlarda null. */
  sla: SlaView | null
  createdAt: string
  assignedToName: string | null
}

export interface PageResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface CaseSummary {
  open: number
  slaBreached: number
  slaApproaching: number
  awaitingReview: number
  inReview: number
}

export interface TransactionView {
  reference: string
  type: TransactionType
  amount: string
  currency: string
  senderName: string
  senderIban: string
  receiverName: string
  receiverIban: string
  description: string | null
  channel: Channel
  valueDate: string
  createdAt: string
}

export interface NoteView {
  id: number
  authorName: string | null
  text: string
  createdAt: string
}

export interface HistoryEntry {
  type: 'STATUS_CHANGE' | 'ESCALATION'
  fromStatus: CaseStatus | null
  toStatus: CaseStatus | null
  reason: string | null
  changedByName: string | null
  escalatedToName: string | null
  at: string
}

export interface CaseDetail {
  id: number
  caseNumber: string
  errorCode: ErrorCode
  errorDescription: string
  priority: Priority
  status: CaseStatus
  escalated: boolean
  slaDeadline: string
  sla: SlaView | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  assignedTo: UserSummary | null
  transaction: TransactionView
  notes: NoteView[]
  history: HistoryEntry[]
}

export interface CaseFilters {
  search?: string
  priority?: Priority
  errorCode?: ErrorCode
  transactionType?: TransactionType
  slaState?: SlaState
  page?: number
  pageSize?: number
}
