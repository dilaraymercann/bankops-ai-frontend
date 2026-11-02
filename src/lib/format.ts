const TIME_ZONE = 'Europe/Istanbul'

const dateTimeFormat = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "01.11.2026 14:32" — sunucu UTC gönderir, İstanbul saatiyle gösterilir. */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** "01.11.2026" (saat dilimine göre tarih; valör tarihi gibi saatsiz tarihler de kabul edilir). */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

/** "14:32" */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

/**
 * "48750.00" -> "48.750,00 TL". Tutar string olarak taşındığı için kayan nokta kullanılmaz,
 * binlik ayraçlar metin üzerinden eklenir.
 */
export function formatMoney(amount: string, currency = 'TRY'): string {
  const [integer, decimals = ''] = amount.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${grouped},${decimals.padEnd(2, '0').slice(0, 2)} ${currency === 'TRY' ? 'TL' : currency}`
}

/** 95 -> "1 sa 35 dk", 600 -> "10 sa", 18 -> "18 dk", 8089 -> "5 gün 14 sa". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.abs(Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours === 0 ? `${days} gün` : `${days} gün ${remainingHours} sa`
  }
  if (hours === 0) return `${rest} dk`
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`
}
