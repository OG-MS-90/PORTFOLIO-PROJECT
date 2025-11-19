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
  
  if (loading) {
    return (
      <div className="mt-6 p-6 bg-card rounded-lg border">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Updating preview...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="mt-6 p-6 bg-destructive/20 rounded-lg border border-destructive/50">
        <p className="text-destructive">⚠️ {error}</p>
      </div>
    )
  }
  
  if (!preview) return null
  
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          📊 Live Investment Preview
        </h3>
        {isUpdating && (
          <span className="text-xs text-primary animate-pulse">
            Updating for {riskTolerance} risk / {planningRegion.toUpperCase()}...
          </span>
        )}
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
        {/* Allocation Card */}
        <div className="p-6 bg-blue-500/10 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all">
          <div className="flex items-center mb-4">
            <PieChart className="h-6 w-6 text-blue-400 mr-2" />
            <h4 className="font-semibold">Proposed Allocation</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Equities:</span>
              <span className="text-2xl font-bold text-blue-400">{preview.allocation.equity}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bonds:</span>
              <span className="text-lg font-semibold text-green-400">{preview.allocation.bonds}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Alternatives:</span>
              <span className="text-sm text-muted-foreground">{preview.allocation.alternatives}%</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-500/30">
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground">Risk Profile:</span>
              <span className="ml-2 px-2 py-1 bg-blue-500/20 rounded text-blue-300 font-medium capitalize">
                {preview.riskProfile}
              </span>
            </div>
          </div>
        </div>
        
        {/* AI Summary Card */}
        <div className="p-6 bg-orange-500/10 rounded-lg border border-orange-500/30 hover:border-orange-400/50 transition-all">
          <div className="flex items-center mb-4">
            <Target className="h-6 w-6 text-orange-400 mr-2" />
            <h4 className="font-semibold">AI Recommendation</h4>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {preview.aiSummary}
          </p>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>Savings Rate:</span>
            <span className="ml-2 text-orange-400 font-semibold">{preview.savingsRate}%</span>
          </div>
        </div>
        
        {/* Benchmarks Card */}
        <div className="p-6 bg-green-500/10 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-all">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-green-400 mr-2" />
            <h4 className="font-semibold">Expected Returns</h4>
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-green-400">
              {preview.expectedCagr.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Annual CAGR</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Primary benchmark</span>
              <span className="font-medium">{preview.benchmarks.primary}</span>
              {typeof preview.benchmarks.primaryCagr === 'number' && (
                <span className="text-xs text-muted-foreground">
                  {preview.benchmarks.primaryCagr.toFixed(1)}% 10Y CAGR
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Secondary benchmark</span>
              <span className="font-medium">{preview.benchmarks.secondary}</span>
              {typeof preview.benchmarks.secondaryCagr === 'number' && (
                <span className="text-xs text-muted-foreground">
                  {preview.benchmarks.secondaryCagr.toFixed(1)}% 10Y CAGR
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Banner */}
      <div className="p-4 bg-card rounded-lg border flex items-start">
        <div className="flex-shrink-0 text-2xl mr-3">💡</div>
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">This is a live preview</p>
          <p>
            Benchmarks and expected returns are based on long-term index behaviour for your selected region.
            Submit the full form to generate the complete wealth plan with ESOP integration and
            downside analysis.
          </p>
        </div>
      </div>
    </div>
  )
}
