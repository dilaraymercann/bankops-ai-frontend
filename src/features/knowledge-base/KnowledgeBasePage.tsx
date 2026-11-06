import { type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useKnowledgeBase } from '@/api/ai'
import { ERROR_CODES, type ErrorCode } from '@/api/types'
import { PageHeader } from '@/components/AppLayout'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { TRANSACTION_TYPE_LABELS } from '@/lib/labels'

const PAGE_SIZE = 10
const selectClass = 'h-9 w-full rounded-md border border-input bg-card px-2 text-sm'

/** Bilgi Tabanı (CLAUDE.md §12.4): takım lideri tarafından onaylanmış, AI'ın kaynak olarak kullandığı çözümler. */
export function KnowledgeBasePage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? undefined
  const errorCode = (params.get('errorCode') as ErrorCode | null) ?? undefined
  const page = Number(params.get('page') ?? 0)
  const { data, isPending, isError, error, refetch } = useKnowledgeBase({ search, errorCode, page, pageSize: PAGE_SIZE })

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of ['search', 'errorCode']) {
      const value = String(form.get(key) ?? '').trim()
      if (value) next.set(key, value)
    }
    setParams(next)
  }

  function goToPage(target: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(target))
    setParams(next)
  }

  return (
    <>
      <PageHeader
        title="Bilgi Tabanı"
        subtitle={data ? `${data.totalItems} doğrulanmış çözüm` : undefined}
      />

      <form onSubmit={applyFilters} key={params.toString()} className="mb-4 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="search">Ara</Label>
          <Input id="search" name="search" defaultValue={search} placeholder="Çözüm metni veya kayıt no" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="errorCode">Hata türü</Label>
          <select id="errorCode" name="errorCode" defaultValue={errorCode ?? ''} className={selectClass}>
            <option value="">Tümü</option>
            {ERROR_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </div>
        <Button type="submit">Filtrele</Button>
      </form>

      {isError ? (
        <ErrorMessage error={error} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-3">
          {isPending && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          {data?.items.map((item) => (
            <article key={item.caseId} className="rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-mono font-medium text-primary">{item.caseNumber}</span>
                <span className="font-mono text-xs text-muted-foreground">{item.errorCode}</span>
                <span className="text-muted-foreground">{TRANSACTION_TYPE_LABELS[item.transactionType]}</span>
                <span className="ml-auto rounded-full bg-neutral-bg px-2.5 py-0.5 text-xs text-muted-foreground">
                  AI referansı: {item.aiReferenceCount} kez
                </span>
              </div>
              <p className="mt-2">{item.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Öneren: {item.proposedByName} · Onaylayan: {item.approvedByName} · {formatDateTime(item.approvedAt)}
              </p>
            </article>
          ))}
          {data?.items.length === 0 && (
            <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Filtrelere uyan çözüm bulunamadı.</p>
          )}
          {data && data.totalItems > 0 && (
            <div className="flex items-center justify-between gap-3 pt-1 text-sm text-muted-foreground">
              <p>{data.page * data.pageSize + 1}–{data.page * data.pageSize + data.items.length} / {data.totalItems} çözüm</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={data.page === 0} onClick={() => goToPage(data.page - 1)}>Önceki</Button>
                <Button variant="outline" size="sm" disabled={data.page + 1 >= data.totalPages} onClick={() => goToPage(data.page + 1)}>Sonraki</Button>
              </div>
            </div>
          )}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Yalnızca takım lideri tarafından onaylanıp bilgi tabanına eklenen çözümler burada listelenir ve AI analizinde kaynak olarak kullanılır.
        {' '}<Link to="/queue" className="text-primary hover:underline">İşlem kuyruğuna dön</Link>
      </p>
    </>
  )
}
