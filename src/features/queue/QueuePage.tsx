import { type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useCases, useCaseSummary } from '@/api/cases'
import {
  ERROR_CODES, PRIORITIES, SLA_STATES, TRANSACTION_TYPES,
  type CaseFilters, type ErrorCode, type Priority, type SlaState, type TransactionType,
} from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { PageHeader } from '@/components/AppLayout'
import { ErrorMessage } from '@/components/ErrorMessage'
import { PriorityBadge, SlaIndicator, StatusChip } from '@/components/badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatMoney } from '@/lib/format'
import { PRIORITY_LABELS, SLA_STATE_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

/** URL'deki arama parametrelerini filtre nesnesine çevirir; böylece filtreler sayfa yenilense ya da geri dönülse korunur. */
function filtersFrom(params: URLSearchParams): CaseFilters {
  return {
    search: params.get('search') ?? undefined,
    priority: (params.get('priority') as Priority) ?? undefined,
    errorCode: (params.get('errorCode') as ErrorCode) ?? undefined,
    transactionType: (params.get('transactionType') as TransactionType) ?? undefined,
    slaState: (params.get('slaState') as SlaState) ?? undefined,
    page: Number(params.get('page') ?? 0),
    pageSize: PAGE_SIZE,
  }
}

const selectClass = 'h-9 w-full rounded-md border border-input bg-card px-2 text-sm'

export function QueuePage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const filters = filtersFrom(params)
  const cases = useCases(filters)
  const summary = useCaseSummary()

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of ['search', 'priority', 'errorCode', 'transactionType', 'slaState']) {
      const value = String(form.get(key) ?? '').trim()
      if (value) next.set(key, value)
    }
    setParams(next)
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(page))
    setParams(next)
  }

  const subtitle = summary.data
    ? user?.role === 'TeamLead'
      ? `Ekip kuyruğunda ${summary.data.open} açık kayıt`
      : `Bana atanmış ${summary.data.open} açık kayıt`
    : undefined

  return (
    <>
      <PageHeader title={user?.role === 'TeamLead' ? 'Ekip Kuyruğu' : 'İşlem Kuyruğu'} subtitle={subtitle} />

      <section aria-label="Özet" className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="SLA aşıldı" value={summary.data?.slaBreached} tone="text-critical" />
        <SummaryCard label="SLA yaklaşıyor" value={summary.data?.slaApproaching} tone="text-warning" />
        <SummaryCard label="Yeni" hint="incelenmeyi bekliyor" value={summary.data?.awaitingReview} />
        <SummaryCard label="İncelemede" value={summary.data?.inReview} />
      </section>

      <form onSubmit={applyFilters} key={params.toString()} className="mb-4 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.3fr_1.2fr_1fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="search">Ara</Label>
          <Input id="search" name="search" defaultValue={filters.search} placeholder="Kayıt no, tutar veya açıklama" />
        </div>
        <FilterSelect id="priority" label="Öncelik" value={filters.priority} options={PRIORITIES.map((p) => [p, PRIORITY_LABELS[p]])} />
        <FilterSelect id="errorCode" label="Hata türü" value={filters.errorCode} options={ERROR_CODES.map((c) => [c, c])} />
        <FilterSelect id="transactionType" label="İşlem tipi" value={filters.transactionType} options={TRANSACTION_TYPES.map((t) => [t, TRANSACTION_TYPE_LABELS[t]])} />
        <FilterSelect id="slaState" label="SLA" value={filters.slaState} options={SLA_STATES.map((s) => [s, SLA_STATE_LABELS[s]])} />
        <Button type="submit">Filtrele</Button>
      </form>

      {cases.isError ? (
        <ErrorMessage error={cases.error} onRetry={() => cases.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Kayıt no</th>
                  <th scope="col" className="px-4 py-3 font-medium">İşlem tipi</th>
                  <th scope="col" className="px-4 py-3 font-medium">Hata</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Tutar</th>
                  <th scope="col" className="px-4 py-3 font-medium">Öncelik</th>
                  <th scope="col" className="px-4 py-3 font-medium">Durum</th>
                  <th scope="col" className="px-4 py-3 font-medium">SLA</th>
                  <th scope="col" className="px-4 py-3 font-medium">Oluşturma</th>
                </tr>
              </thead>
              <tbody>
                {cases.isPending && Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={8} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))}
                {cases.data?.items.map((item) => (
                  <tr key={item.id} className={cn('border-b last:border-0', item.sla?.state === 'Breached' && 'bg-critical-bg/50')}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link to={`/cases/${item.id}`} className="font-mono text-primary hover:underline">{item.caseNumber}</Link>
                    </td>
                    <td className="px-4 py-3">{TRANSACTION_TYPE_LABELS[item.transactionType]}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-muted-foreground">{item.errorCode}</p>
                      <p>{item.errorDescription}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{formatMoney(item.amount, item.currency)}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
                    <td className="px-4 py-3"><StatusChip status={item.status} /></td>
                    <td className="px-4 py-3"><SlaIndicator sla={item.sla} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
                {cases.data?.items.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Filtrelere uyan kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {cases.data && cases.data.totalItems > 0 && (
            <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
              <p>
                {cases.data.page * cases.data.pageSize + 1}–{cases.data.page * cases.data.pageSize + cases.data.items.length} / {cases.data.totalItems} kayıt · SLA'ya göre sıralı
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={cases.data.page === 0} onClick={() => goToPage(cases.data.page - 1)}>Önceki</Button>
                <Button variant="outline" size="sm" disabled={cases.data.page + 1 >= cases.data.totalPages} onClick={() => goToPage(cases.data.page + 1)}>Sonraki</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function SummaryCard({ label, value, tone, hint }: { label: string; value?: number; tone?: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className={cn('text-xs font-medium', tone ?? 'text-muted-foreground')}>{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value ?? <Skeleton className="mt-2 h-6 w-10" />}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function FilterSelect({ id, label, value, options }: { id: string; label: string; value?: string; options: string[][] }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} name={id} defaultValue={value ?? ''} className={selectClass}>
        <option value="">Tümü</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  )
}
