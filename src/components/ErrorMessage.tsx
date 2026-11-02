import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'

/** Veri yüklenemediğinde gösterilir; yetki ve bulunamadı durumları için ayrı mesaj verir. */
export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const status = error instanceof ApiError ? error.status : 0
  const message =
    status === 403 ? 'Bu içeriği görüntüleme yetkiniz yok.'
    : status === 404 ? 'Kayıt bulunamadı.'
    : error instanceof Error ? error.message
    : 'Beklenmeyen bir hata oluştu.'
  return (
    <div role="alert" className="rounded-lg border bg-critical-bg p-6 text-critical">
      <p>{message}</p>
      {onRetry && status !== 403 && status !== 404 && (
        <Button variant="outline" size="sm" className="mt-3 bg-card text-foreground" onClick={onRetry}>
          Tekrar dene
        </Button>
      )}
    </div>
  )
}
