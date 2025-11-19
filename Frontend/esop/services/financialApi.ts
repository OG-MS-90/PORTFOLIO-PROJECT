import { FinancialFormData, FinancialPlan, EsopRealtimeAnalyticsResponse } from '@/types/esop'
import { authorizedFetch } from '@/lib/authClient'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function generateFinancialPlan(formData: FinancialFormData): Promise<FinancialPlan> {
  const response = await authorizedFetch(`${API_BASE_URL}/financial/generate-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate financial plan')
  }

  return response.json()
}

export async function getFinancialPreview(data: {
  monthlyIncome: number
  monthlyExpenses: number
  riskTolerance: string
  planningRegion: string
}) {
  const response = await authorizedFetch(`${API_BASE_URL}/financial/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch preview')
  }

  return response.json()
}

export async function getEsopRealtimeAnalytics(region?: 'india' | 'us'): Promise<EsopRealtimeAnalyticsResponse> {
  const params = region ? `?region=${encodeURIComponent(region)}` : ''
  const response = await authorizedFetch(`${API_BASE_URL}/financial/esop-analytics${params}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    return {
      status: 'error',
      message: error.message || 'Failed to load ESOP analytics',
    }
  }

  return response.json()
}
