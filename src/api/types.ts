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

export type AiFeedback = 'Useful' | 'NotUseful'

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
  /** Durum listesinde seçilebilecek hedefler (backend'in kuralları; arayüz kendi başına karar vermez). */
  allowedTransitions: CaseStatus[]
  canProposeResolution: boolean
  canAssign: boolean
  /** Yalnızca "Çözüm Önerildi" durumundaki kayıtlarda dolu. */
  pendingResolution: PendingResolution | null
}

export interface PendingResolution {
  text: string
  proposedByName: string | null
  proposedAt: string
}

export interface ApprovalItem {
  caseId: number
  caseNumber: string
  errorCode: ErrorCode
  errorDescription: string
  transactionType: TransactionType
  amount: string
  currency: string
  proposedByName: string | null
  proposedAt: string
  slaBreached: boolean
}

export interface FourEyesCheck {
  passed: boolean
  message: string
}

export interface AuditLine {
  at: string
  username: string
  action: string
  /** Ham JSON metni (örn. {"from":"InReview","to":"SolutionProposed"}). */
  details: string | null
}

export interface ApprovalReview {
  caseId: number
  caseNumber: string
  errorCode: ErrorCode
  priority: Priority
  resolutionText: string
  proposedByName: string | null
  proposedAt: string
  fourEyes: FourEyesCheck
  aiAnalysisUsed: boolean
  aiFeedback: AiFeedback | null
  /** Kayıt açılışından çözüm önerisine kadar geçen çalışma süresi (dakika). */
  resolutionMinutes: number
  recentAudit: AuditLine[]
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

export interface AiPossibleCause {
  cause: string
  supportingCaseIds: string[]
}

export interface AiAnalysisResult {
  summary: string
  possibleCauses: AiPossibleCause[]
  recommendedSteps: string[]
  warnings: string[]
  referencedCaseIds: string[]
}

/** Analizin dayandığı geçmiş kayıt. Seed'den gelen eski analizlerde benzerlik skoru yoktur. */
export interface AiReference {
  caseNumber: string
  errorCode: ErrorCode
  similarity: number | null
  matchReason: string | null
  resolutionText: string
}

/** available=false: güvenilir geçmiş kayıt yok, model çağrılmadı; message boş durum olarak gösterilir. */
export interface AiAnalysis {
  id: number | null
  available: boolean
  message: string | null
  result: AiAnalysisResult | null
  references: AiReference[]
  similarRecordCount: number
  maskedFieldCount: number
  modelName: string | null
  createdAt: string
  feedback: AiFeedback | null
  cached: boolean
}

export interface KnowledgeBaseItem {
  caseId: number
  caseNumber: string
  errorCode: ErrorCode
  transactionType: TransactionType
  text: string
  proposedByName: string
  approvedByName: string
  approvedAt: string
  aiReferenceCount: number
}

export interface KnowledgeBaseFilters {
  search?: string
  errorCode?: ErrorCode
  page?: number
  pageSize?: number
}
