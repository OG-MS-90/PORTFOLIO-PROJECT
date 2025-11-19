'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface StoredPlan {
  status?: string
  wealthManagerId?: string
  dataAsOf?: string
  data?: Record<string, any>
}

export default function FinancialPlanningResultsPage() {
  const [plan, setPlan] = useState<StoredPlan | null>(null)
  const [formData, setFormData] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('financialPlan')
      const savedForm = localStorage.getItem('financialFormData')

      if (!savedPlan) {
        setError('No financial plan found. Please generate a plan first.')
      } else {
        setPlan(JSON.parse(savedPlan))
      }

      if (savedForm) {
        setFormData(JSON.parse(savedForm))
      }
    } catch (err) {
      console.error('Failed to load plan from storage:', err)
      setError('Unable to load saved financial plan. Please regenerate your plan.')
    } finally {
      setLoading(false)
    }
  }, [])

  const planData = plan?.data ?? {}

  const currency = planData.marketContext?.currency || 'USD'

  const formatCurrency = useMemo(() => {
    return (value: number | null | undefined) => {
      const numericValue = Number(value ?? 0)
      if (!Number.isFinite(numericValue)) return '-'
      return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(numericValue)
    }
  }, [currency])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading your financial plan…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Financial Plan Unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button asChild>
                <Link href="/financial-planning">Return to Financial Planning</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{plan?.dataAsOf ? `Plan generated on ${plan.dataAsOf}` : null}</p>
            <h1 className="text-3xl font-bold">Financial Plan Results</h1>
            <p className="text-muted-foreground mt-2">
              {planData.summary ||
                'This is the personalized strategy generated from your latest submission and market data.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/financial-planning">Edit Inputs</Link>
            </Button>
            <Button asChild>
              <Link href="/financial-planning">Generate New Plan</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Wealth Manager ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{plan?.wealthManagerId || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Reference for follow-up sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Success Probability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {planData.successProbability
                  ? `${(planData.successProbability * 100).toFixed(1)}%`
                  : 'Awaiting calculation'}
              </p>
              <p className="text-sm text-muted-foreground">Probability of reaching your long-term goal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Region & Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold capitalize">
                {planData.marketContext?.region || formData?.planningRegion || '—'}
              </p>
              <p className="text-sm text-muted-foreground">{currency}</p>
            </CardContent>
          </Card>
        </div>

        {planData.allocation && Array.isArray(planData.allocation) && (
          <Card>
            <CardHeader>
              <CardTitle>Recommended Allocation</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {planData.allocation.map((bucket: any) => (
                <div key={bucket.name} className="rounded-lg border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground uppercase">{bucket.name}</p>
                  <p className="text-2xl font-semibold">{bucket.value}%</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {planData.strategies && Array.isArray(planData.strategies) && (
          <Card>
            <CardHeader>
              <CardTitle>Strategic Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {planData.strategies.map((strategy: any, idx: number) => (
                <div key={`${strategy.title}-${idx}`} className="rounded-lg border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">Strategy {idx + 1}</p>
                  <h3 className="text-lg font-semibold">{strategy.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{strategy.description}</p>
                  {strategy.examples && Array.isArray(strategy.examples) && (
                    <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                      {strategy.examples.map((example: string) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {planData.implementationSteps && Array.isArray(planData.implementationSteps) && (
          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planData.implementationSteps.map((step: any) => (
                <div key={step.step} className="rounded-md border border-border/50 p-3 flex items-start gap-3">
                  <span className="text-sm font-semibold text-muted-foreground">Step {step.step}</span>
                  <p className="text-sm">{step.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {planData.esopStrategy && (
          <Card>
            <CardHeader>
              <CardTitle>ESOP Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">Overview:</span> {planData.esopStrategy.overview}</p>
              <p><span className="font-semibold text-foreground">Risk Assessment:</span> {planData.esopStrategy.riskAssessment}</p>
              <p><span className="font-semibold text-foreground">Liquidation Plan:</span> {planData.esopStrategy.liquidationPlan}</p>
              <p><span className="font-semibold text-foreground">Tax Planning:</span> {planData.esopStrategy.taxPlanning}</p>
            </CardContent>
          </Card>
        )}

        {planData.analyticsSummary?.esopOverview && (
          <Card>
            <CardHeader>
              <CardTitle>ESOP Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Total ESOP Value</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(planData.analyticsSummary.esopOverview.totalValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total ESOP PnL</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(planData.analyticsSummary.esopOverview.totalPnL)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

