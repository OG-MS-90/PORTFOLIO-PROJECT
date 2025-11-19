"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LiveFinancialPreview } from '@/components/LiveFinancialPreview'
import { authorizedFetch } from '@/lib/authClient'

export default function FinancialPlanningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    monthlyIncome: 10000,
    monthlyExpenses: 6000,
    savingsGoal: 100000,
    investmentHorizon: 10,
    currentAge: 30,
    retirementAge: 60,
    planningRegion: 'us' as 'us' | 'india',
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
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
      localStorage.setItem('financialFormData', JSON.stringify(formData))
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await authorizedFetch(`${API_BASE_URL}/financial/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Financial Planning</h1>
          <p className="text-muted-foreground">Create a personalized investment strategy based on your goals and risk tolerance</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Your Financial Details</CardTitle>
                <CardDescription>Enter your financial information to generate a personalized plan</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Income ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({...formData, monthlyIncome: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Expenses ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.monthlyExpenses}
                      onChange={(e) => setFormData({...formData, monthlyExpenses: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Savings Goal ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.savingsGoal}
                      onChange={(e) => setFormData({...formData, savingsGoal: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Investment Horizon (years)</label>
                    <input
                      type="number"
                      value={formData.investmentHorizon}
                      onChange={(e) => setFormData({...formData, investmentHorizon: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Age</label>
                    <input
                      type="number"
                      value={formData.currentAge}
                      onChange={(e) => setFormData({...formData, currentAge: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Retirement Age</label>
                    <input
                      type="number"
                      value={formData.retirementAge}
                      onChange={(e) => setFormData({...formData, retirementAge: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Planning Region</label>
                  <select
                    value={formData.planningRegion}
                    onChange={(e) => setFormData({...formData, planningRegion: e.target.value as 'us' | 'india'})}
                    className="w-full p-2 rounded border bg-background"
                  >
                    <option value="us">United States</option>
                    <option value="india">India</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
                  <select
                    value={formData.riskTolerance}
                    onChange={(e) => setFormData({...formData, riskTolerance: e.target.value as 'low' | 'medium' | 'high'})}
                    className="w-full p-2 rounded border bg-background"
                  >
                    <option value="low">Low - Conservative</option>
                    <option value="medium">Medium - Balanced</option>
                    <option value="high">High - Aggressive</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Contribution ({currencyMeta.symbol})</label>
                    <input
                      type="number"
                      value={formData.monthlyContribution}
                      onChange={(e) => setFormData({...formData, monthlyContribution: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Fund (months)</label>
                    <input
                      type="number"
                      value={formData.emergencyFundMonths}
                      onChange={(e) => setFormData({...formData, emergencyFundMonths: Number(e.target.value)})}
                      className="w-full p-2 rounded border bg-background"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Generating Plan...' : 'Generate Financial Plan'}
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>

          <div className="lg:col-span-2">
            <LiveFinancialPreview
              monthlyIncome={formData.monthlyIncome}
              monthlyExpenses={formData.monthlyExpenses}
              riskTolerance={formData.riskTolerance}
              planningRegion={formData.planningRegion}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
