"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LiveFinancialPreview } from '@/components/LiveFinancialPreview'
import { authorizedFetch } from '@/lib/authClient'

type FinancialFormState = {
  monthlyIncome: number | ''
  monthlyExpenses: number | ''
  savingsGoal: number | ''
  investmentHorizon: number | ''
  currentAge: number | ''
  retirementAge: number | ''
  planningRegion: 'us' | 'india'
  riskTolerance: 'low' | 'medium' | 'high'
  monthlyContribution: number | ''
  emergencyFundMonths: number | ''
}

export default function FinancialPlanningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FinancialFormState>({
    monthlyIncome: 10000,
    monthlyExpenses: 6000,
    savingsGoal: 100000,
    investmentHorizon: 10,
    currentAge: 30,
    retirementAge: 60,
    planningRegion: 'us',
    riskTolerance: 'medium',
    monthlyContribution: 1000,
    emergencyFundMonths: 6,
  })

  const currencyMeta = useMemo(() => {
    return formData.planningRegion === 'india'
      ? { symbol: '₹', code: 'INR', locale: 'en-IN' }
      : { symbol: '$', code: 'USD', locale: 'en-US' }
  }, [formData.planningRegion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        monthlyIncome: Number(formData.monthlyIncome || 0),
        monthlyExpenses: Number(formData.monthlyExpenses || 0),
        savingsGoal: Number(formData.savingsGoal || 0),
        investmentHorizon: Number(formData.investmentHorizon || 0),
        currentAge: Number(formData.currentAge || 0),
        retirementAge: Number(formData.retirementAge || 0),
        monthlyContribution: Number(formData.monthlyContribution || 0),
        emergencyFundMonths: Number(formData.emergencyFundMonths || 0),
      }

      localStorage.setItem('financialFormData', JSON.stringify(payload))
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await authorizedFetch(`${API_BASE_URL}/financial/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Plan generation failed')

      const plan = await response.json()
      localStorage.setItem('financialPlan', JSON.stringify(plan))
      
      router.push(`/financial-planning/results?risk=${formData.riskTolerance}&region=${formData.planningRegion}`)
    } catch (error) {
      console.error('Error generating plan:', error)
      alert('Failed to generate financial plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-slate-50 dark:to-slate-950 flex items-center justify-center">
        <div className="container mx-auto px-4 flex flex-col items-center text-center gap-8 max-w-2xl">
          {/* Modern spinner with glow effect */}
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-amber-500/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          
          {/* Text content */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm font-medium text-primary">Generating Plan</p>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Preparing your financial roadmap
            </h1>
            
            <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
              We&apos;re analyzing your ESOP positions, pulling live market benchmarks, and creating 
              a personalized strategy. This usually takes 10-15 seconds.
            </p>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/30 animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e]">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 sm:space-y-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">Financial Planning</h1>
          <p className="text-muted-foreground text-base">Create a personalized investment strategy based on your goals and risk tolerance</p>
        </div>

        <div className="grid gap-8 lg:gap-10 lg:grid-cols-2 items-start max-w-6xl mx-auto">
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Your Financial Details</CardTitle>
                <CardDescription>Enter your financial information to generate a personalized plan</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Monthly Income ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            monthlyIncome: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          monthlyIncome: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Monthly Expenses ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.monthlyExpenses}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            monthlyExpenses: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          monthlyExpenses: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Savings Goal ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.savingsGoal}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            savingsGoal: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          savingsGoal: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Investment Horizon (years)</label>
                    <input
                      type="number"
                      value={formData.investmentHorizon}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            investmentHorizon: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          investmentHorizon: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Current Age</label>
                    <input
                      type="number"
                      value={formData.currentAge}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            currentAge: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          currentAge: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Retirement Age</label>
                    <input
                      type="number"
                      value={formData.retirementAge}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            retirementAge: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          retirementAge: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2.5">Planning Region</label>
                  <select
                    value={formData.planningRegion}
                    onChange={(e) => setFormData({...formData, planningRegion: e.target.value as 'us' | 'india'})}
                    className="w-full p-3 rounded-lg border bg-background text-base"
                  >
                    <option value="us">United States</option>
                    <option value="india">India</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2.5">Risk Tolerance</label>
                  <select
                    value={formData.riskTolerance}
                    onChange={(e) => setFormData({...formData, riskTolerance: e.target.value as 'low' | 'medium' | 'high'})}
                    className="w-full p-3 rounded-lg border bg-background text-base"
                  >
                    <option value="low">Low - Conservative</option>
                    <option value="medium">Medium - Balanced</option>
                    <option value="high">High - Aggressive</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Monthly Contribution ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.monthlyContribution}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            monthlyContribution: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          monthlyContribution: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2.5">Emergency Fund (months)</label>
                    <input
                      type="number"
                      value={formData.emergencyFundMonths}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setFormData({
                            ...formData,
                            emergencyFundMonths: '',
                          })
                          return
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '')
                        setFormData({
                          ...formData,
                          emergencyFundMonths: Number(cleaned),
                        })
                      }}
                      className="w-full p-3 rounded-lg border bg-background text-base"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2 py-6 text-base font-semibold" disabled={loading}>
                  {loading ? 'Generating Plan...' : 'Generate Financial Plan'}
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>

          <div>
            <LiveFinancialPreview
              monthlyIncome={Number(formData.monthlyIncome || 0)}
              monthlyExpenses={Number(formData.monthlyExpenses || 0)}
              riskTolerance={formData.riskTolerance}
              planningRegion={formData.planningRegion}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
