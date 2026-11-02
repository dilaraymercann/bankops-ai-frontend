import { PageHeader } from '@/components/AppLayout'

/** Henüz geliştirilmemiş ekranlar için yer tutucu (Onay: Faz 3, Bilgi Tabanı: Faz 4, Dashboard: Faz 5). */
export function ComingSoonPage({ title, phase }: { title: string; phase: string }) {
  return (
    <>
      <PageHeader title={title} />
      <p className="rounded-lg border bg-card p-6 text-muted-foreground">Bu ekran {phase}'de eklenecek.</p>
    </>
  )
}
