import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useCase } from '@/api/cases'
import type { CaseDetail, HistoryEntry } from '@/api/types'
import { ErrorMessage } from '@/components/ErrorMessage'
import { PriorityBadge, StatusChip } from '@/components/badges'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime, formatDuration, formatMoney } from '@/lib/format'
import { CHANNEL_LABELS, STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { ActionCard } from './ActionCard'

export function CaseDetailPage() {
  const { id } = useParams()
  const { data, isPending, isError, error, refetch } = useCase(id)

  return (
    <>
      <Link to="/queue" className="mb-4 inline-block text-sm text-primary hover:underline">← İşlem Kuyruğu</Link>

      {isPending && <DetailSkeleton />}
      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}
      {data && <DetailContent detail={data} />}
    </>
  )
}

function DetailContent({ detail }: { detail: CaseDetail }) {
  const { transaction } = detail
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold">{detail.caseNumber}</h1>
            <PriorityBadge priority={detail.priority} />
            <StatusChip status={detail.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {TRANSACTION_TYPE_LABELS[transaction.type]} · <span className="font-mono">{detail.errorCode}</span> · {detail.errorDescription}
          </p>
        </div>
        <SlaBanner detail={detail} />
      </div>

      <div className="grid max-w-4xl gap-6">
        <Card title="İşlem Bilgileri">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Gönderen" value={transaction.senderName} />
            <Field label="Tutar" value={formatMoney(transaction.amount, transaction.currency)} mono strong />
            <Field label="Alıcı" value={transaction.receiverName} />
            <Field label="Alıcı IBAN" value={transaction.receiverIban} mono />
            <Field label="Gönderen IBAN" value={transaction.senderIban} mono />
            <Field label="İşlem referansı" value={transaction.reference} mono />
            <Field label="Açıklama" value={transaction.description ?? '—'} />
            <Field label="Kanal · Talimat zamanı" value={`${CHANNEL_LABELS[transaction.channel]} · ${formatDateTime(transaction.createdAt)}`} />
            <Field label="Valör tarihi" value={formatDate(transaction.valueDate)} />
            <Field label="Atanan uzman" value={detail.assignedTo?.fullName ?? 'Atanmadı'} />
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">IBAN ve kişi adları gizlilik gereği maskeli gösterilir.</p>

          <div className="mt-4 rounded-md bg-neutral-bg p-4">
            <p className="text-xs font-medium text-muted-foreground">Hata açıklaması</p>
            <p className="mt-1">{detail.errorDescription}</p>
          </div>
        </Card>

        <Card title="İşlem Geçmişi">
          <ol className="space-y-3">
            {detail.history.map((entry, index) => (
              <HistoryRow key={index} entry={entry} />
            ))}
          </ol>
        </Card>

        {detail.notes.length > 0 && (
          <Card title="Notlar">
            <ul className="space-y-3">
              {detail.notes.map((note) => (
                <li key={note.id}>
                  <p className="text-xs text-muted-foreground">{note.authorName ?? 'Sistem'} · {formatDateTime(note.createdAt)}</p>
                  <p>{note.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {detail.pendingResolution && (
          <Card title="Önerilen Çözüm">
            <p>{detail.pendingResolution.text}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {detail.pendingResolution.proposedByName ?? 'Uzman'} · {formatDateTime(detail.pendingResolution.proposedAt)} · Takım liderinin onayını bekliyor
            </p>
          </Card>
        )}

        <ActionCard detail={detail} />

      </div>
    </>
  )
}

/** SLA uyarı bandı: yalnızca açık ve süresi aşılmış/yaklaşan kayıtlarda görünür. */
function SlaBanner({ detail }: { detail: CaseDetail }) {
  if (!detail.sla) return null
  const { state, remainingMinutes } = detail.sla
  if (state === 'Normal') return null

  const escalatedTo = [...detail.history].reverse().find((entry) => entry.type === 'ESCALATION')?.escalatedToName
  const text =
    state === 'Breached'
      ? `SLA ${formatDuration(remainingMinutes)} aşıldı${detail.escalated ? ` · Takım liderine eskale edildi${escalatedTo ? ` (${escalatedTo})` : ''}` : ''}`
      : `SLA yaklaşıyor · ${formatDuration(remainingMinutes)} kaldı`
  return (
    <p
      role="status"
      className={cn('rounded-lg px-4 py-2.5 text-sm font-medium', state === 'Breached' ? 'bg-critical-bg text-critical' : 'bg-warning-bg text-warning')}
    >
      {text}
    </p>
  )
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const isEscalation = entry.type === 'ESCALATION'
  let text: string
  if (isEscalation) {
    text = `SLA aşıldı, eskale edildi${entry.escalatedToName ? ` (Takım Lideri: ${entry.escalatedToName})` : ''}`
  } else if (!entry.fromStatus) {
    text = 'Kayıt oluşturuldu'
  } else {
    text = `Durum: ${STATUS_LABELS[entry.fromStatus]} → ${STATUS_LABELS[entry.toStatus!]}`
  }
  return (
    <li className="grid grid-cols-[8.5rem_1fr] gap-3 text-sm">
      <time dateTime={entry.at} className="text-muted-foreground">{formatDateTime(entry.at)}</time>
      <div>
        <p className={cn(isEscalation && 'font-medium text-critical')}>
          {text}
          {!isEscalation && <span className="text-muted-foreground"> · {entry.changedByName ?? 'Sistem'}</span>}
        </p>
        {entry.reason && entry.fromStatus && <p className="text-muted-foreground">{entry.reason}</p>}
      </div>
    </li>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-0.5', mono && 'font-mono', strong && 'font-semibold')}>{value}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Yükleniyor">
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-56 w-full max-w-4xl" />
      <Skeleton className="h-40 w-full max-w-4xl" />
    </div>
  )
}

