import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { useApprovalReview, useApprovals, useApprove, useRequestRevision } from '@/api/approvals'
import type { ApprovalItem, AuditLine, CaseStatus } from '@/api/types'
import { PageHeader } from '@/components/AppLayout'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime, formatDuration, formatMoney, formatTime } from '@/lib/format'
import { STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

/** Takım Lideri Onayı (CLAUDE.md §12.3): solda bekleyen çözümler, sağda seçili çözümün incelemesi. */
export function ApprovalsPage() {
  const [params, setParams] = useSearchParams()
  const approvals = useApprovals()
  const [message, setMessage] = useState<string | null>(null)

  const items = approvals.data ?? []
  const requested = Number(params.get('case'))
  const selectedId = items.some((item) => item.caseId === requested) ? requested : items[0]?.caseId

  function select(caseId: number) {
    setMessage(null)
    setParams({ case: String(caseId) })
  }

  return (
    <>
      <PageHeader title="Onay Bekleyen Çözümler" subtitle="Onaylanan çözümler kaydı kapatır ve bilgi tabanına güvenilir kaynak olarak eklenir." />

      {message && (
        <p role="status" className="mb-4 rounded-lg bg-success-bg px-4 py-3 text-sm font-medium text-success">{message}</p>
      )}

      {approvals.isError ? (
        <ErrorMessage error={approvals.error} onRetry={() => approvals.refetch()} />
      ) : approvals.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : items.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Onay bekleyen çözüm yok.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <ul aria-label="Onay bekleyen kayıtlar" className="space-y-3">
            {items.map((item) => (
              <li key={item.caseId}>
                <ApprovalCard item={item} selected={item.caseId === selectedId} onSelect={() => select(item.caseId)} />
              </li>
            ))}
          </ul>
          {selectedId !== undefined && (
            <ReviewPanel
              key={selectedId}
              caseId={selectedId}
              onDone={(text) => {
                setMessage(text)
                setParams({})
              }}
            />
          )}
        </div>
      )}
    </>
  )
}

function ApprovalCard({ item, selected, onSelect }: { item: ApprovalItem; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn('w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/50', selected && 'border-2 border-primary')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm text-primary">{item.caseNumber}</span>
        {item.slaBreached && <span className="text-xs font-medium text-critical">SLA aşıldı</span>}
      </div>
      <p className="mt-1 text-sm">{item.errorDescription}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {TRANSACTION_TYPE_LABELS[item.transactionType]} · {formatMoney(item.amount, item.currency)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Öneren: {item.proposedByName ?? '—'} · {formatTime(item.proposedAt)}</p>
    </button>
  )
}

interface DecisionForm {
  includeInKnowledgeBase: boolean
  note: string
}

function ReviewPanel({ caseId, onDone }: { caseId: number; onDone: (message: string) => void }) {
  const review = useApprovalReview(caseId)
  const approve = useApprove()
  const revise = useRequestRevision()
  const { register, getValues, setError, clearErrors, formState: { errors } } = useForm<DecisionForm>({
    defaultValues: { includeInKnowledgeBase: true, note: '' },
  })

  if (review.isPending) return <Skeleton className="h-96 w-full" />
  if (review.isError) return <ErrorMessage error={review.error} onRetry={() => review.refetch()} />
  const data = review.data
  const busy = approve.isPending || revise.isPending

  function approveCase() {
    clearErrors()
    const { includeInKnowledgeBase, note } = getValues()
    approve.mutate(
      { caseId, body: { includeInKnowledgeBase, note: note.trim() || undefined } },
      { onSuccess: () => onDone(`${data.caseNumber} kapatıldı${includeInKnowledgeBase ? ' ve bilgi tabanına eklendi' : ''}.`) },
    )
  }

  function requestRevision() {
    const note = getValues('note').trim()
    if (!note) {
      setError('note', { message: 'Revizyon istemek için nedenini yazın' })
      return
    }
    clearErrors()
    revise.mutate({ caseId, body: { note } }, { onSuccess: () => onDone(`${data.caseNumber} revizyon için uzmana geri gönderildi.`) })
  }

  const feedback =
    !data.aiAnalysisUsed ? 'AI analizi kullanılmadı'
    : data.aiFeedback === 'Useful' ? 'AI önerisi faydalı'
    : data.aiFeedback === 'NotUseful' ? 'AI önerisi faydalı değil'
    : 'Geri bildirim verilmedi'

  const mutationError = approve.error ?? revise.error

  return (
    <section className="rounded-lg border bg-card p-6" aria-label="Çözüm incelemesi">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Çözüm İncelemesi · <span className="font-mono">{data.caseNumber}</span>
        </h2>
        <Link to={`/cases/${caseId}`} className="shrink-0 text-sm text-primary hover:underline">Kaydın tamamını gör →</Link>
      </div>

      <p
        role="status"
        className={cn('rounded-md px-4 py-3 text-sm', data.fourEyes.passed ? 'bg-success-bg text-success' : 'bg-critical-bg text-critical')}
      >
        <strong>{data.fourEyes.passed ? 'Dört göz kontrolü geçti.' : 'Dört göz kontrolü geçmedi.'}</strong> {data.fourEyes.message}
      </p>

      <div className="mt-5">
        <p className="text-xs font-medium text-muted-foreground">Önerilen çözüm</p>
        <p className="mt-1 rounded-md bg-neutral-bg p-4">{data.resolutionText}</p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Summary label="Uzman geri bildirimi" value={feedback} />
        <Summary label="Toplam çözüm süresi (mesai)" value={formatDuration(data.resolutionMinutes)} />
      </dl>

      <label className="mt-5 flex items-start gap-3 rounded-md border border-primary/30 bg-info-bg p-4">
        <input type="checkbox" className="mt-1 size-4 accent-primary" {...register('includeInKnowledgeBase')} />
        <span>
          <span className="block text-sm font-semibold">Bilgi tabanına güvenilir çözüm olarak ekle</span>
          <span className="text-sm text-muted-foreground">Bu çözüm, ileride benzer kayıtlarda AI analizinin kaynağı olarak kullanılacak.</span>
        </span>
      </label>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="decision-note">Onay notu (isteğe bağlı)</Label>
        <Textarea id="decision-note" rows={2} placeholder="Revizyon istiyorsanız nedenini yazın" aria-invalid={!!errors.note} {...register('note')} />
        {errors.note && <p className="text-sm text-critical">{errors.note.message}</p>}
      </div>

      {mutationError && (
        <p role="alert" className="mt-4 rounded-md bg-critical-bg px-3 py-2 text-sm text-critical">
          {mutationError instanceof Error ? mutationError.message : 'İşlem tamamlanamadı.'}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" className="bg-success text-white hover:bg-success/90" disabled={busy || !data.fourEyes.passed} onClick={approveCase}>
          {approve.isPending ? 'Onaylanıyor…' : 'Onayla ve Kapat'}
        </Button>
        <Button type="button" variant="outline" disabled={busy || !data.fourEyes.passed} onClick={requestRevision}>
          {revise.isPending ? 'Gönderiliyor…' : 'Revizyon İste'}
        </Button>
      </div>

      <details className="group mt-6 border-t pt-4">
        <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
          <span className="group-open:hidden">▸ Audit log (son kayıtlar) · göster</span>
          <span className="hidden group-open:inline">▾ Audit log (son kayıtlar) · gizle</span>
        </summary>
        <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
          {data.recentAudit.map((line, index) => (
            <li key={index}>{formatDateTime(line.at)} {line.username} {describeAudit(line)}</li>
          ))}
        </ul>
      </details>
    </section>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'Durum değişti',
  NOTE_ADD: 'Not eklendi',
  ASSIGN: 'Atama yapıldı',
  RESOLUTION_PROPOSE: 'Çözüm önerildi',
  APPROVE: 'Çözüm onaylandı',
  REVISION_REQUEST: 'Revizyon istendi',
  ESCALATE: 'Eskale edildi',
  AI_ANALYZE: 'AI analizi çalıştırıldı',
  AI_FEEDBACK: 'AI geri bildirimi verildi',
}

/** "Durum değişti: İncelemede → Çözüm Önerildi" gibi tek satırlık özet; ham JSON ekranda gösterilmez. */
function describeAudit(line: AuditLine): string {
  const label = AUDIT_ACTION_LABELS[line.action] ?? line.action
  if (line.action === 'STATUS_CHANGE' && line.details) {
    try {
      const { from, to } = JSON.parse(line.details) as { from: CaseStatus | null; to: CaseStatus }
      return `${label}: ${from ? STATUS_LABELS[from] : '—'} → ${STATUS_LABELS[to]}`
    } catch {
      return label
    }
  }
  return label
}
