import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { AiAnalysis, AiFeedback, KnowledgeBaseFilters, KnowledgeBaseItem, PageResponse } from './types'

const aiKey = (caseId: number) => ['ai', 'analysis', caseId]

/** Kayıt için hâlâ geçerli (24 saatten yeni) bir analiz varsa getirir; yoksa null (backend 204 döner). */
export function useAiAnalysis(caseId: number) {
  return useQuery({
    queryKey: aiKey(caseId),
    queryFn: () => apiFetch<AiAnalysis | null>(`/api/cases/${caseId}/ai-analysis`),
  })
}

/** "AI ile Analiz Et" / "Yeniden Analiz Et" (refresh = önbelleği atla). */
export function useAnalyze(caseId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (refresh: boolean) =>
      apiFetch<AiAnalysis>(`/api/cases/${caseId}/ai-analysis?refresh=${refresh}`, { method: 'POST' }),
    onSuccess: (analysis) => queryClient.setQueryData(aiKey(caseId), analysis),
  })
}

/** "Faydalı / Faydalı değil"; dönen güncel analiz önbelleğe yazılır. */
export function useAiFeedback(caseId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ analysisId, feedback }: { analysisId: number; feedback: AiFeedback }) =>
      apiFetch<AiAnalysis>(`/api/ai-analyses/${analysisId}/feedback`, { method: 'POST', body: JSON.stringify({ feedback }) }),
    onSuccess: (analysis) => {
      queryClient.setQueryData(aiKey(caseId), analysis)
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

export function useKnowledgeBase(filters: KnowledgeBaseFilters) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.errorCode) params.set('errorCode', filters.errorCode)
  params.set('page', String(filters.page ?? 0))
  params.set('pageSize', String(filters.pageSize ?? 10))
  return useQuery({
    queryKey: ['knowledge-base', filters],
    queryFn: () => apiFetch<PageResponse<KnowledgeBaseItem>>(`/api/knowledge-base?${params}`),
  })
}
