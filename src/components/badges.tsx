import type { CaseStatus, Priority, SlaView } from '@/api/types'
import { formatDuration } from '@/lib/format'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

// Renk tek başına anlam taşımaz: her rozetin yanında metin etiketi vardır (CLAUDE.md §12).

const PRIORITY_STYLES: Record<Priority, string> = {
  Critical: 'bg-critical-bg text-critical',
  High: 'bg-warning-bg text-warning',
  Medium: 'bg-info-bg text-info',
  Low: 'bg-neutral-bg text-neutral',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium', PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

const STATUS_STYLES: Partial<Record<CaseStatus, string>> = {
  SolutionProposed: 'bg-success-bg text-success',
  Escalated: 'bg-critical-bg text-critical',
}

export function StatusChip({ status }: { status: CaseStatus }) {
  return (
    <span className={cn('inline-block rounded-full bg-neutral-bg px-2.5 py-0.5 text-xs text-neutral', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

const SLA_TEXT: Record<SlaView['state'], string> = {
  Breached: 'text-critical font-medium',
  Approaching: 'text-warning font-medium',
  Normal: 'text-neutral',
}

const SLA_BAR: Record<SlaView['state'], string> = {
  Breached: 'bg-critical',
  Approaching: 'bg-amber-500',
  Normal: 'bg-neutral/50',
}

/** Kalan süre metni + ilerleme çubuğu. Kapalı kayıtlarda (sla = null) çizgi gösterilir. */
export function SlaIndicator({ sla }: { sla: SlaView | null }) {
  if (!sla) return <span className="text-muted-foreground">—</span>
  const label =
    sla.state === 'Breached' ? `Aşıldı · ${formatDuration(sla.remainingMinutes)}` : `${formatDuration(sla.remainingMinutes)} kaldı`
  return (
    <div className="min-w-28">
      <p className={cn('text-xs', SLA_TEXT[sla.state])}>{label}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-bg" role="presentation">
        <div className={cn('h-full rounded-full', SLA_BAR[sla.state])} style={{ width: `${Math.round(sla.progress * 100)}%` }} />
      </div>
    </div>
  )
}
