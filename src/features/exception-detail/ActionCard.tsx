import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { z } from 'zod'
import { useAddNote, useAssign, useProposeResolution, useSpecialists, useTransition } from '@/api/cases'
import type { CaseDetail, CaseStatus } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { STATUS_LABELS } from '@/lib/labels'

// Hangi durumların seçilebileceğini backend söyler (detail.allowedTransitions); arayüz kural uydurmaz.
// Gerekçe zorunluluğu yalnızca erken geri bildirim içindir, asıl kontrol backend'dedir.
const REASON_REQUIRED: string[] = ['Rejected', 'Escalated']
const PROPOSE = 'SolutionProposed'

const selectClass = 'h-9 w-full rounded-md border border-input bg-card px-2 text-sm'

const statusSchema = z
  .object({
    toStatus: z.string().min(1, 'Bir durum seçin'),
    text: z.string().max(2000, 'En fazla 2000 karakter'),
  })
  .superRefine((value, ctx) => {
    if (value.toStatus === PROPOSE && !value.text.trim()) {
      ctx.addIssue({ code: 'custom', path: ['text'], message: 'Çözüm açıklaması gerekli' })
    }
    if (REASON_REQUIRED.includes(value.toStatus) && !value.text.trim()) {
      ctx.addIssue({ code: 'custom', path: ['text'], message: 'Bu durum için gerekçe zorunlu' })
    }
  })
type StatusForm = z.infer<typeof statusSchema>

const noteSchema = z.object({ text: z.string().trim().min(1, 'Not boş olamaz').max(2000, 'En fazla 2000 karakter') })
type NoteForm = z.infer<typeof noteSchema>

const assignSchema = z.object({ userId: z.string().min(1, 'Bir uzman seçin') })
type AssignForm = z.infer<typeof assignSchema>

function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p role="alert" className="rounded-md bg-critical-bg px-3 py-2 text-sm text-critical">
      {error instanceof Error ? error.message : 'İşlem tamamlanamadı.'}
    </p>
  )
}

/** Kayıt üzerindeki işlemler (CLAUDE.md §12.2): durum/çözüm, not ve (takım lideri için) atama. */
export function ActionCard({ detail }: { detail: CaseDetail }) {
  const { user } = useAuth()
  const isOpen = detail.status !== 'Closed' && detail.status !== 'Rejected'
  if (!isOpen) return null

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">Aksiyon</h2>
      <div className="space-y-6">
        {detail.status === 'SolutionProposed' && user?.role === 'TeamLead' && (
          <p className="text-sm">
            Bu kayıt çözüm onayı bekliyor.{' '}
            <Link to={`/approvals?case=${detail.id}`} className="text-primary hover:underline">Onay ekranında incele →</Link>
          </p>
        )}
        {(detail.allowedTransitions.length > 0 || detail.canProposeResolution) && <StatusForm detail={detail} />}
        <NoteForm caseId={detail.id} />
        {detail.canAssign && <AssignForm detail={detail} />}
      </div>
    </section>
  )
}

function StatusForm({ detail }: { detail: CaseDetail }) {
  const transition = useTransition()
  const propose = useProposeResolution()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<StatusForm>({ resolver: zodResolver(statusSchema), defaultValues: { toStatus: '', text: '' } })

  const selected = useWatch({ control, name: 'toStatus' })
  const options: CaseStatus[] = detail.canProposeResolution ? [...detail.allowedTransitions, PROPOSE] : detail.allowedTransitions
  const proposing = selected === PROPOSE
  const mutation = proposing ? propose : transition

  function onSubmit(values: StatusForm) {
    const done = { onSuccess: () => reset() }
    if (values.toStatus === PROPOSE) {
      propose.mutate({ caseId: detail.id, body: { text: values.text.trim() } }, done)
    } else {
      transition.mutate(
        { caseId: detail.id, body: { toStatus: values.toStatus as CaseStatus, reason: values.text.trim() || undefined } },
        done,
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="toStatus">Yeni durum</Label>
        <select id="toStatus" className={`${selectClass} max-w-sm`} {...register('toStatus')}>
          <option value="">Seçin…</option>
          {options.map((status) => (
            <option key={status} value={status}>{STATUS_LABELS[status]}</option>
          ))}
        </select>
        {errors.toStatus && <p className="text-sm text-critical">{errors.toStatus.message}</p>}
      </div>

      {selected && (
        <div className="space-y-1.5">
          <Label htmlFor="text">
            {proposing ? 'Çözüm açıklaması' : REASON_REQUIRED.includes(selected) ? 'Gerekçe (zorunlu)' : 'Gerekçe (isteğe bağlı)'}
          </Label>
          <Textarea id="text" rows={4} aria-invalid={!!errors.text} {...register('text')} />
          {errors.text && <p className="text-sm text-critical">{errors.text.message}</p>}
        </div>
      )}

      <ErrorText error={mutation.error} />
      <Button type="submit" disabled={!selected || mutation.isPending}>
        {mutation.isPending ? 'Kaydediliyor…' : proposing ? 'Onaya Gönder' : 'Durumu Güncelle'}
      </Button>
      {detail.canProposeResolution && (
        <p className="text-xs text-muted-foreground">
          Dört göz prensibi: Bu kaydı siz kapatamazsınız, çözüm takım liderinin onayına gider.
        </p>
      )}
    </form>
  )
}

function NoteForm({ caseId }: { caseId: number }) {
  const addNote = useAddNote()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteForm>({ resolver: zodResolver(noteSchema), defaultValues: { text: '' } })

  return (
    <form
      onSubmit={handleSubmit((values) => addNote.mutate({ caseId, body: { text: values.text } }, { onSuccess: () => reset() }))}
      noValidate
      className="space-y-3 border-t pt-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="note">Not</Label>
        <Textarea id="note" rows={2} aria-invalid={!!errors.text} {...register('text')} />
        {errors.text && <p className="text-sm text-critical">{errors.text.message}</p>}
      </div>
      <ErrorText error={addNote.error} />
      <Button type="submit" variant="outline" disabled={addNote.isPending}>
        {addNote.isPending ? 'Ekleniyor…' : 'Not Ekle'}
      </Button>
    </form>
  )
}

function AssignForm({ detail }: { detail: CaseDetail }) {
  const specialists = useSpecialists(true)
  const assign = useAssign()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignForm>({ resolver: zodResolver(assignSchema), defaultValues: { userId: '' } })

  return (
    <form
      onSubmit={handleSubmit((values) =>
        assign.mutate({ caseId: detail.id, body: { userId: Number(values.userId) } }, { onSuccess: () => reset() }),
      )}
      noValidate
      className="space-y-3 border-t pt-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="userId">{detail.assignedTo ? 'Yeniden ata' : 'Uzmana ata'}</Label>
        <select id="userId" className={`${selectClass} max-w-sm`} {...register('userId')}>
          <option value="">Uzman seçin…</option>
          {specialists.data?.map((specialist) => (
            <option key={specialist.id} value={specialist.id}>{specialist.fullName}</option>
          ))}
        </select>
        {errors.userId && <p className="text-sm text-critical">{errors.userId.message}</p>}
      </div>
      <ErrorText error={assign.error} />
      <Button type="submit" variant="outline" disabled={assign.isPending}>
        {assign.isPending ? 'Atanıyor…' : 'Ata'}
      </Button>
    </form>
  )
}
