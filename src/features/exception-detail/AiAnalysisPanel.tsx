import type { ReactNode } from 'react'
import { useAiAnalysis, useAiFeedback, useAnalyze } from '@/api/ai'
import type { AiAnalysis, AiFeedback } from '@/api/types'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * AI Analizi paneli (CLAUDE.md §12.2). AI yalnızca öneri sunar, karar vermez; panel bunu başlıkta söyler.
 * Analiz kullanıcı isteyince üretilir (ücretli/kotalı dış servis), hazır bir analiz varsa sayfa açılışında gösterilir.
 */
export function AiAnalysisPanel({ caseId }: { caseId: number }) {
  const existing = useAiAnalysis(caseId)
  const analyze = useAnalyze(caseId)

  const analysis = analyze.data ?? existing.data ?? null
  const loading = existing.isPending || analyze.isPending

  return (
    <section className="rounded-lg border bg-card p-6" aria-label="AI analizi" aria-busy={loading}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">AI Analizi</h2>
          <span className="mt-1 inline-block rounded-full bg-info-bg px-2.5 py-0.5 text-xs font-medium text-primary">Öneri · Karar vermez</span>
        </div>
        {analysis && !analyze.isPending && (
          <Button type="button" variant="outline" size="sm" onClick={() => analyze.mutate(true)}>
            Yeniden Analiz Et
          </Button>
        )}
      </div>

      {analyze.isPending ? (
        <AnalysisSkeleton text="Geçmiş doğrulanmış kayıtlar taranıyor ve analiz hazırlanıyor…" />
      ) : existing.isPending ? (
        <AnalysisSkeleton />
      ) : analyze.isError ? (
        <ErrorMessage error={analyze.error} onRetry={() => analyze.mutate(false)} />
      ) : analysis ? (
        analysis.available ? <AnalysisResult caseId={caseId} analysis={analysis} /> : <NoEvidence message={analysis.message} />
      ) : (
        <EmptyState onStart={() => analyze.mutate(false)} />
      )}
    </section>
  )
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Bu kayıt için geçmişte onaylanmış benzer çözümler taranır ve bunlara dayanan bir öneri hazırlanır.
        Kişisel veriler (IBAN, ad, TCKN, telefon) dış servise gönderilmeden önce maskelenir.
      </p>
      <Button type="button" className="mt-4" onClick={onStart}>AI ile Analiz Et</Button>
    </div>
  )
}

/** Güvenilir geçmiş kayıt yoksa model çağrılmaz; bu bir hata değil, bilinçli tasarım kararıdır. */
function NoEvidence({ message }: { message: string | null }) {
  return (
    <p role="status" className="rounded-md bg-neutral-bg p-4 text-sm">
      {message ?? 'Güvenilir geçmiş kayıt bulunamadı. Bu kayıt için AI önerisi üretilmedi.'}
    </p>
  )
}

function AnalysisSkeleton({ text }: { text?: string }) {
  return (
    <div className="space-y-3" aria-label="Yükleniyor">
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function AnalysisResult({ caseId, analysis }: { caseId: number; analysis: AiAnalysis }) {
  const result = analysis.result!
  return (
    <div className="space-y-5">
      <ul className="flex flex-wrap gap-2 text-xs">
        <Chip>{analysis.similarRecordCount} benzer kayıt kullanıldı</Chip>
        <Chip>{analysis.maskedFieldCount} alan maskelendi</Chip>
        <Chip>{formatDateTime(analysis.createdAt)}{analysis.cached ? ' · hazır analiz' : ''}</Chip>
      </ul>

      <Section title="Problemin açıklaması">
        <p>{result.summary}</p>
      </Section>

      {result.possibleCauses.length > 0 && (
        <Section title="Olası nedenler">
          <ul className="space-y-2">
            {result.possibleCauses.map((item, index) => (
              <li key={index}>
                {item.cause}
                {item.supportingCaseIds.length > 0 && (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">({item.supportingCaseIds.join(', ')})</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.recommendedSteps.length > 0 && (
        <Section title="Önerilen inceleme adımları">
          <ol className="list-decimal space-y-1 pl-5">
            {result.recommendedSteps.map((step, index) => <li key={index}>{step}</li>)}
          </ol>
        </Section>
      )}

      {result.warnings.length > 0 && (
        <div role="note" className="rounded-md bg-warning-bg p-4 text-sm text-warning">
          <p className="mb-1 font-medium">Dikkat edilmesi gerekenler</p>
          <ul className="list-disc space-y-1 pl-5">
            {result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
          </ul>
        </div>
      )}

      {analysis.references.length > 0 && (
        <Section title="Dayandığı geçmiş kayıtlar">
          <ul className="space-y-3">
            {analysis.references.map((reference) => (
              <li key={reference.caseNumber} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-medium">{reference.caseNumber}</span>
                  {reference.similarity !== null && (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
                      Benzerlik %{Math.round(reference.similarity * 100)}
                    </span>
                  )}
                  {reference.matchReason && <span className="text-xs text-muted-foreground">{reference.matchReason}</span>}
                </div>
                <p className="mt-1.5 text-muted-foreground">{reference.resolutionText}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Feedback caseId={caseId} analysis={analysis} />
    </div>
  )
}

function Feedback({ caseId, analysis }: { caseId: number; analysis: AiAnalysis }) {
  const feedback = useAiFeedback(caseId)
  const options: { value: AiFeedback; label: string }[] = [
    { value: 'Useful', label: 'Faydalı' },
    { value: 'NotUseful', label: 'Faydalı değil' },
  ]
  return (
    <div className="border-t pt-4">
      <p className="mb-2 text-sm font-medium">Bu öneri işinize yaradı mı?</p>
      <div className="flex gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={analysis.feedback === option.value ? 'default' : 'outline'}
            aria-pressed={analysis.feedback === option.value}
            disabled={feedback.isPending || analysis.id === null}
            onClick={() => feedback.mutate({ analysisId: analysis.id!, feedback: option.value })}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {feedback.isError && <p role="alert" className="mt-2 text-sm text-critical">{feedback.error.message}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
      <div className={cn('text-sm')}>{children}</div>
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <li className="rounded-full bg-neutral-bg px-2.5 py-1 text-muted-foreground">{children}</li>
}
