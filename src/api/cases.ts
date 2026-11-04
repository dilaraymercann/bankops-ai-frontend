import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { CaseDetail, CaseFilters, CaseListItem, CaseStatus, CaseSummary, PageResponse, UserSummary } from './types'

function toQuery(filters: CaseFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.errorCode) params.set('errorCode', filters.errorCode)
  if (filters.transactionType) params.set('transactionType', filters.transactionType)
  if (filters.slaState) params.set('slaState', filters.slaState)
  params.set('page', String(filters.page ?? 0))
  params.set('pageSize', String(filters.pageSize ?? 10))
  return params.toString()
}

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: () => apiFetch<PageResponse<CaseListItem>>(`/api/cases?${toQuery(filters)}`),
    // Sayfa değişirken eski liste görünür kalır, tablo titremez
    placeholderData: keepPreviousData,
  })
}

export function useCaseSummary() {
  return useQuery({
    queryKey: ['cases', 'summary'],
    queryFn: () => apiFetch<CaseSummary>('/api/cases/summary'),
  })
}

export function useCase(id: string | undefined) {
  return useQuery({
    queryKey: ['cases', 'detail', id],
    queryFn: () => apiFetch<CaseDetail>(`/api/cases/${id}`),
    enabled: !!id,
  })
}

/**
 * Kayıt üzerinde yazma işlemi yapar. Backend güncel kayıt detayını döner; önbellekteki detay hemen güncellenir,
 * liste, özet ve onay listesi yeniden çekilir.
 */
function useCaseAction<TBody>(action: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, body }: { caseId: number; body: TBody }) =>
      apiFetch<CaseDetail>(`/api/cases/${caseId}/${action}`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (detail) => {
      queryClient.setQueryData(['cases', 'detail', String(detail.id)], detail)
      void queryClient.invalidateQueries({ queryKey: ['cases'] })
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

export const useAddNote = () => useCaseAction<{ text: string }>('notes')
export const useTransition = () => useCaseAction<{ toStatus: CaseStatus; reason?: string }>('transitions')
export const useProposeResolution = () => useCaseAction<{ text: string }>('resolution')
export const useAssign = () => useCaseAction<{ userId: number }>('assign')

/** Atama listesi: yalnızca atama yetkisi olan kullanıcı için çekilir. */
export function useSpecialists(enabled: boolean) {
  return useQuery({
    queryKey: ['users', 'Specialist'],
    queryFn: () => apiFetch<UserSummary[]>('/api/users?role=Specialist'),
    enabled,
  })
}
