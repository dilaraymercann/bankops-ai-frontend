import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { CaseDetail, CaseFilters, CaseListItem, CaseSummary, PageResponse } from './types'

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
