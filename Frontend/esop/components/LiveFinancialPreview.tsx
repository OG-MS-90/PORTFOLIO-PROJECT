"use client"

import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { TrendingUp, PieChart, Target, Info, Sparkles } from 'lucide-react'
import { getFinancialPreview } from '@/services/financialApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PreviewProps {
  monthlyIncome: number
  monthlyExpenses: number
  riskTolerance: string
  planningRegion: string
}

interface PreviewData {
  allocation: {
    equity: number
    bonds: number
    alternatives: number
  }
  aiSummary: string
  expectedCagr: number
  benchmarks: {
    primary: string
    secondary: string
    primaryCagr: number
    secondaryCagr: number
  }
  riskProfile: string
  savingsRate: string
}

export function LiveFinancialPreview({ 
  monthlyIncome, 
  monthlyExpenses, 
  riskTolerance, 
  planningRegion 
}: PreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const debouncedRisk = useDebounce(riskTolerance, 300)
  const debouncedRegion = useDebounce(planningRegion, 300)
  const debouncedIncome = useDebounce(monthlyIncome, 500)
  const debouncedExpenses = useDebounce(monthlyExpenses, 500)
  
  // Detect when inputs change to show "updating" state
  useEffect(() => {
    if (preview) {
      setIsUpdating(true)
      const timer = setTimeout(() => setIsUpdating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [riskTolerance, planningRegion])
  
  useEffect(() => {
    if (!debouncedRisk || !debouncedRegion) return
    
    const fetchPreview = async () => {
      console.log(`🔄 Fetching preview for: ${debouncedRisk} risk, ${debouncedRegion} region`)
      setLoading(true)
      setError(null)
      
      try {
        const data = await getFinancialPreview({
          monthlyIncome: debouncedIncome,
          monthlyExpenses: debouncedExpenses,
          riskTolerance: debouncedRisk,
          planningRegion: debouncedRegion
        })
        
        if (data.status === 'success') {
          console.log(`✅ Preview updated - Allocation: ${data.allocation.equity}% equity, ${data.allocation.bonds}% bonds`)
          setPreview(data)
        } else {
          throw new Error(data.message || 'Preview generation failed')
        }
      } catch (err) {
        console.error('Preview error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preview')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPreview()
  }, [debouncedRisk, debouncedRegion, debouncedIncome, debouncedExpenses])
  
  if (loading && !preview) {
    return (
      <Card className="h-full shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Live Investment Preview
          </CardTitle>
          <CardDescription>Analyzing your profile based on market data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className="h-full shadow-xl border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Info className="h-5 w-5" />
            Preview Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }
  
  if (!preview) return null
  
  const currencySymbol = planningRegion === 'india' ? '₹' : '$'
  const regionName = planningRegion === 'india' ? 'India' : 'United States'
  
  return (
    <Card className="h-full shadow-xl transition-all duration-500">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Live Investment Preview
          </CardTitle>
          <CardDescription>Real-time analysis of your financial profile</CardDescription>
        </div>
        {isUpdating && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Updating</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className={`space-y-6 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* Allocation & Returns Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Allocation */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border">
             <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <PieChart className="h-4 w-4" />
                Allocation
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                   <span className="text-xs font-medium text-slate-500">Equity</span>
                   <span className="text-lg font-bold text-blue-500">{preview.allocation.equity}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full rounded-full" style={{ width: `${preview.allocation.equity}%` }} />
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                   <span className="text-xs font-medium text-slate-500">Bonds</span>
                   <span className="text-lg font-bold text-green-500">{preview.allocation.bonds}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-green-500 h-full rounded-full" style={{ width: `${preview.allocation.bonds}%` }} />
                </div>
             </div>
          </div>

          {/* Returns */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border">
             <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                Projected Return
             </div>
             <div className="flex flex-col items-center justify-center py-2">
                <span className="text-4xl font-bold text-green-500 tracking-tight">{preview.expectedCagr}%</span>
                <span className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Annual CAGR</span>
             </div>
             <div className="pt-3 border-t border-dashed">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Benchmark</span>
                  <span className="font-medium">{preview.benchmarks.primary}</span>
                </div>
             </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md mt-0.5">
              <Target className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400">AI Strategy Recommendation</h4>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/70 leading-relaxed">
                {preview.aiSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Savings & Risk */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-center px-4">
            <div className="text-xs text-muted-foreground mb-1">Savings Rate</div>
            <div className="text-xl font-bold text-foreground">{preview.savingsRate}%</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center px-4">
            <div className="text-xs text-muted-foreground mb-1">Risk Profile</div>
            <div className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium capitalize">
              {preview.riskProfile}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center px-4">
            <div className="text-xs text-muted-foreground mb-1">Region</div>
            <div className="flex items-center gap-1.5">
               <span className="text-sm">{planningRegion === 'india' ? '🇮🇳' : '🇺🇸'}</span>
               <span className="text-sm font-medium">{planningRegion === 'india' ? 'India' : 'USA'}</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
