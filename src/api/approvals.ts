import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { ApprovalItem, ApprovalReview, CaseDetail } from './types'

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals', 'list'],
    queryFn: () => apiFetch<ApprovalItem[]>('/api/approvals'),
  })
}

export function useApprovalReview(caseId: number | undefined) {
  return useQuery({
    queryKey: ['approvals', 'review', caseId],
    queryFn: () => apiFetch<ApprovalReview>(`/api/approvals/${caseId}`),
    enabled: caseId !== undefined,
  })
}

function useApprovalAction<TBody>(action: 'approve' | 'request-revision') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, body }: { caseId: number; body: TBody }) =>
      apiFetch<CaseDetail>(`/api/approvals/${caseId}/${action}`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      // Onay listesi, kuyruk ve özet kartları değişti
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
      void queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

export const useApprove = () => useApprovalAction<{ includeInKnowledgeBase: boolean; note?: string }>('approve')
export const useRequestRevision = () => useApprovalAction<{ note: string }>('request-revision')
