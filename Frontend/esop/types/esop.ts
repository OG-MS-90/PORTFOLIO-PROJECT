export interface EsopRecord {
  _id: string
  userId: string
  ticker: string
  company: string
  grantDate: string
  vestingStartDate: string
  vestingEndDate: string
  quantity: number
  totalGrants?: number
  vested?: number
  unvested?: number
  exercised?: number
  strikePrice: number
  status: string
  type?: string
  grantType?: string
  soldDate?: string | null
  exercisedDate?: string | null
  exerciseDate?: string | null
  exercisePrice?: number
  salePrice?: number | null        // Actual sale price (unified model)
  avgStockPrice?: number
  fmv?: number
  currentPrice?: number
  notes?: string
}

export interface StockData {
  ticker: string
  currentPrice: number
  change: number
  changePercent: number
  lastUpdated: string
}

export interface FinancialFormData {
  monthlyIncome: number
  monthlyExpenses: number
  savingsGoal: number
  investmentHorizon: number
  currentAge: number
  retirementAge: number
  planningRegion: 'india' | 'us'
  riskTolerance: 'low' | 'medium' | 'high'
  monthlyContribution: number
  emergencyFundMonths: number
  reinvestDividends?: boolean
}

export interface FinancialPlan {
  allocation: {
    equity: number
    bonds: number
    alternatives: number
  }
  projections: {
    years: number[]
    conservative: number[]
    moderate: number[]
    aggressive: number[]
  }
  esopStrategy: {
    recommendation: string
    exerciseTiming: string
    fundingStrategy: {
      estimatedCost: number
      monthlySavingsTarget: number
      annualSellPercentage: number
      taxRate: number
      fundingSources: string[]
    }
  }
  successProbability: number
  marketContext: {
    primaryBenchmark: string
    secondaryBenchmark: string
    inflationRate: number
  }
}

export interface AnalyticsData {
  totalGrants: number
  totalVested: number
  totalUnvested: number
  totalExercised: number
  totalValue: number
  vestingPercentage: number
  avgStockPrice: number
  avgExercisePrice: number
  avgStrikePrice: number
  potentialGain: number
  exerciseCost: number
  byCompany: Record<string, number>
  byType: Record<string, number>
  byYear: Record<string, number>
}

/**
 * UNIFIED INVESTMENT-BASED PnL MODEL
 * 
 * All PnL calculations use:
 * PnL = (current_price OR sale_price - exercise_price) × quantity
 * 
 * - totalRealizedPnL: from actual sales only
 * - totalUnrealizedPnL: from holdings (can be negative)
 * - totalPnL: realized + unrealized
 */
export interface EsopOverviewAnalytics {
  totalValue: number
  totalCost: number
  totalPnL: number
  pnlPercentage: number
  // UNIFIED MODEL: Realized from sales, Unrealized from holdings
  totalRealizedPnL?: number        // Only from actual sales
  totalUnrealizedPnL?: number      // Can be positive OR negative
  totalPositions: number
  totalVestedShares: number
  totalUnvestedShares: number
  topPositions: {
    ticker: string
    value: number
    pnlPercentage: number
    weight: number
  }[]
  lastUpdated: string
}

export interface SymbolPerformanceEntry {
  price: number
  previousClose: number
  shares: number
  value: number
  cost: number
  pnl: number
  pnlPercentage: number
  // UNIFIED MODEL: Split PnL by realization status
  realizedPnL?: number          // Only from sales
  unrealizedPnL?: number        // From holdings (can be negative)
  dayChange: number
  dayChangePercentage: number
  history: Record<string, number>
  cagr10Y: number | null
}

export interface EsopRealtimeAnalyticsSummary {
  esopOverview: EsopOverviewAnalytics
  symbolPerformance: Record<string, SymbolPerformanceEntry>
  riskFlags: {
    highConcentration: boolean
    topConcentrationTickers: string[]
    underDiversified: boolean
  }
  regionExposure: {
    india: number
    us: number
  }
  meta: {
    generatedAt: string
    planningRegion: 'india' | 'us'
  }
}

export interface EsopRealtimeAnalyticsResponse {
  status: 'success' | 'error'
  planningRegion?: 'india' | 'us'
  currency?: string
  analyticsSummary?: EsopRealtimeAnalyticsSummary | null
  message?: string
}
