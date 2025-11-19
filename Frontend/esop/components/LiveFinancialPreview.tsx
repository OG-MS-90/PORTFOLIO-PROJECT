"use client"

import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { TrendingUp, PieChart, Target } from 'lucide-react'
import { getFinancialPreview } from '@/services/financialApi'

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
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Live Investment Preview
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-card rounded-lg border animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Live Investment Preview
          </h3>
        </div>
        <div className="p-6 bg-destructive/10 rounded-lg border border-destructive/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-1">Preview unavailable</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">The preview will load once you submit the form.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!preview) return null
  
  const currencySymbol = planningRegion === 'india' ? '₹' : '$'
  const regionName = planningRegion === 'india' ? 'India' : 'United States'
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Live Investment Preview
        </h3>
        {isUpdating && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-primary">
              Updating...
            </span>
          </div>
        )}
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ${isUpdating ? 'opacity-60 scale-[0.99]' : 'opacity-100 scale-100'}`}>
        {/* Allocation Card */}
        <div className="group relative p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent rounded-xl border border-blue-500/20 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <PieChart className="h-4 w-4 text-blue-400" />
                </div>
                <h4 className="font-semibold text-sm">Proposed Allocation</h4>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Equities:</span>
                <span className="text-3xl font-bold text-blue-400">{preview.allocation.equity}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bonds:</span>
                <span className="text-xl font-semibold text-green-400">{preview.allocation.bonds}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Alternatives:</span>
                <span className="text-lg font-medium text-amber-400">{preview.allocation.alternatives}%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risk Profile:</span>
                <span className="px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 font-medium capitalize text-xs">
                  {preview.riskProfile}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Summary Card */}
        <div className="group relative p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/20 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Target className="h-4 w-4 text-amber-400" />
                </div>
                <h4 className="font-semibold text-sm">AI Recommendation</h4>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 min-h-[80px]">
              {preview.aiSummary}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Savings Rate:</span>
                <span className="text-2xl font-bold text-amber-400">{preview.savingsRate}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">For {regionName} investor</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Benchmarks Card */}
        <div className="group relative p-6 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent rounded-xl border border-green-500/20 hover:border-green-400/40 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <h4 className="font-semibold text-sm">Expected Returns</h4>
              </div>
            </div>
            <div className="text-center mb-4 py-2">
              <div className="text-5xl font-bold text-green-400 mb-1">
                {preview.expectedCagr.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Annual CAGR</div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-card/50 rounded-lg border border-green-500/10">
                <div className="text-xs text-muted-foreground mb-1">Primary benchmark</div>
                <div className="font-semibold text-foreground">{preview.benchmarks.primary}</div>
                {typeof preview.benchmarks.primaryCagr === 'number' && (
                  <div className="text-xs text-green-400 mt-1">
                    {preview.benchmarks.primaryCagr.toFixed(1)}% 10Y CAGR
                  </div>
                )}
              </div>
              <div className="p-3 bg-card/50 rounded-lg border border-green-500/10">
                <div className="text-xs text-muted-foreground mb-1">Secondary benchmark</div>
                <div className="font-semibold text-foreground">{preview.benchmarks.secondary}</div>
                {typeof preview.benchmarks.secondaryCagr === 'number' && (
                  <div className="text-xs text-green-400 mt-1">
                    {preview.benchmarks.secondaryCagr.toFixed(1)}% 10Y CAGR
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Banner */}
      <div className="p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20 flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
          <div className="text-xl">💡</div>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground mb-1.5">This is a live preview</p>
          <p className="text-muted-foreground leading-relaxed">
            Benchmarks and expected returns are based on long-term index behaviour for <span className="font-medium text-primary">{regionName}</span>.
            Submit the full form to generate the complete wealth plan with ESOP integration and
            downside analysis.
          </p>
        </div>
      </div>
    </div>
  )
}
