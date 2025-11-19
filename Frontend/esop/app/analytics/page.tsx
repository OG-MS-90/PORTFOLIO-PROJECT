'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/contexts/UserContext'
import { computeAnalyticsFromDb } from '@/services/analyticsEngine'
import type { Currency, EsopAnalyticsResponse, RowCalculation } from '@/types/analytics'
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ComposedChart as RechartsComposedChart,
} from 'recharts'
import { BarChart3, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'

const STATUS_FILTERS: Array<{
  id: 'all' | 'vested' | 'unvested' | 'exercised' | 'sold' | 'expired'
  label: string
}> = [
  { id: 'all', label: 'All' },
  { id: 'vested', label: 'Vested' },
  { id: 'unvested', label: 'Unvested' },
  { id: 'exercised', label: 'Exercised' },
  { id: 'sold', label: 'Sold' },
  { id: 'expired', label: 'Expired' },
]

const CURRENCY_OPTIONS: Array<{ currency: Currency; label: string }> = [
  { currency: 'INR', label: 'India (INR)' },
  { currency: 'USD', label: 'US (USD)' },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  const [analytics, setAnalytics] = useState<EsopAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'vested' | 'unvested' | 'exercised' | 'sold' | 'expired'
  >('all')

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  useEffect(() => {
    if (!user) return

    const loadAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await computeAnalyticsFromDb()
        setAnalytics(result)
        setDisplayCurrency(result.baseCurrency)
      } catch (err) {
        console.error('[analytics/page] Failed to load analytics', err)
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load analytics. Please upload your ESOP data and try again.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [user])

  const baseRows: RowCalculation[] = useMemo(
    () => analytics?.perRowCalculations ?? [],
    [analytics]
  )

  const rowsForView = useMemo(() => {
    if (statusFilter === 'all') {
      return baseRows
    }

    return baseRows.filter((row) => {
      const status = (row.status ?? '').toLowerCase()
      switch (statusFilter) {
        case 'vested':
          return status === 'vested'
        case 'unvested':
          return status === 'unvested'
        case 'exercised':
          return status === 'exercised'
        case 'sold':
          return status === 'sold'
        case 'expired':
          return status === 'expired' || status === 'lapsed'
        default:
          return true
      }
    })
  }, [baseRows, statusFilter])

  const convertValue = useCallback(
    (value: number | null | undefined, overrideCurrency?: Currency) => {
      if (!analytics) return 0

      const amount = Number(value ?? 0)
      if (!Number.isFinite(amount)) return 0

      const baseCurrency = analytics.baseCurrency
      const fxRate = analytics.fxRate && analytics.fxRate > 0 ? analytics.fxRate : 1
      const targetCurrency = overrideCurrency ?? displayCurrency

      if (baseCurrency === targetCurrency) {
        return amount
      }

      if (baseCurrency === 'INR' && targetCurrency === 'USD') {
        return amount / fxRate
      }

      if (baseCurrency === 'USD' && targetCurrency === 'INR') {
        return amount * fxRate
      }

      return amount
    },
    [analytics, displayCurrency]
  )

  const formatMoney = useCallback(
    (value: number | null | undefined, showDecimals = true) =>
      formatCurrency(convertValue(value), displayCurrency, showDecimals),
    [convertValue, displayCurrency]
  )

  const totals = analytics?.totals
  const totalPnL = totals?.totalPnL ?? 0
  const totalRealizedPnL = totals?.totalRealizedPnL ?? 0
  const totalUnrealizedPnL = totals?.totalUnrealizedPnL ?? 0
  const totalTax = totals?.totalTax ?? 0
  const postTaxPnL = totals?.totalPostTaxPnL ?? 0
  const inflationAdjustedPnL = totals?.inflationAdjustedPnL ?? 0
  const portfolioCAGR = totals?.portfolioCAGR ?? 0

  const summaryMetrics = useMemo(() => {
    const summary = {
      totalGrants: 0,
      totalVested: 0,
      totalUnvested: 0,
      totalValue: 0,
      exerciseCost: 0,
      unrealizedPnL: 0,
    }

    rowsForView.forEach((row) => {
      const quantity = Number(row.quantity ?? 0)
      const vested = Number(row.vested ?? 0)
      summary.totalGrants += quantity
      summary.totalVested += vested
      summary.totalUnvested += Math.max(quantity - vested, 0)
      summary.totalValue += row.currentValue ?? 0
      summary.exerciseCost += row.costBasis ?? 0
      summary.unrealizedPnL += row.unrealizedPnL ?? 0
    })

    return {
      ...summary,
      vestingPercentage:
        summary.totalGrants > 0 ? (summary.totalVested / summary.totalGrants) * 100 : 0,
    }
  }, [rowsForView])

  const totalCostBasis = useMemo(
    () => rowsForView.reduce((sum, row) => sum + (row.costBasis ?? 0), 0),
    [rowsForView]
  )

  const totalCurrentValue = useMemo(
    () => rowsForView.reduce((sum, row) => sum + (row.currentValue ?? 0), 0),
    [rowsForView]
  )

  const pnlPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0

  const earliestGrantTime = useMemo(() => {
    let earliest: number | null = null
    rowsForView.forEach((row) => {
      if (!row.grantDate) return
      const timestamp = new Date(row.grantDate).getTime()
      if (!Number.isFinite(timestamp)) return
      if (earliest === null || timestamp < earliest) {
        earliest = timestamp
      }
    })
    return earliest
  }, [rowsForView])

  const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000
  const growthYears =
    earliestGrantTime !== null ? (Date.now() - earliestGrantTime) / MS_PER_YEAR : 0

  const yearlyAggregates = useMemo(() => {
    const map = new Map<
      number,
      {
        year: number
        cost: number
        value: number
        realizedPnL: number
        unrealizedPnL: number
        adjustedPnL: number
      }
    >()

    rowsForView.forEach((row) => {
      if (!row.grantDate) return
      const year = new Date(row.grantDate).getFullYear()
      if (Number.isNaN(year)) return

      const entry =
        map.get(year) ??
        {
          year,
          cost: 0,
          value: 0,
          realizedPnL: 0,
          unrealizedPnL: 0,
          adjustedPnL: 0,
        }

      entry.cost += row.costBasis ?? 0
      entry.value += row.currentValue ?? 0
      entry.realizedPnL += row.realizedPnL ?? 0
      entry.unrealizedPnL += row.unrealizedPnL ?? 0
      entry.adjustedPnL += row.inflationAdjustedPnL ?? 0

      map.set(year, entry)
    })

    return Array.from(map.values()).sort((a, b) => a.year - b.year)
  }, [rowsForView])

  const valueChartData = useMemo(
    () =>
      yearlyAggregates.map((entry) => ({
        year: entry.year,
        value: entry.value,
      })),
    [yearlyAggregates]
  )

  const pnlChartData = useMemo(
    () =>
      yearlyAggregates.map((entry) => ({
        year: entry.year,
        cost: entry.cost,
        totalPnL: entry.realizedPnL + entry.unrealizedPnL,
        realizedPnL: entry.realizedPnL,
        unrealizedPnL: entry.unrealizedPnL,
        adjustedPnL: entry.adjustedPnL,
      })),
    [yearlyAggregates]
  )

  const effectiveTaxRate =
    totalRealizedPnL > 0
      ? totalTax / totalRealizedPnL
      : analytics?.meta.taxRatesUsed.stcg ??
        analytics?.meta.taxRatesUsed.ltcg ??
        0

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0e]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e]">
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-amber-500" />
              ESOP Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Deep dive into your ESOP portfolio value, pricing, and distribution
            </p>
          </div>

          {error && (
            <Card className="border border-red-500/40 bg-red-500/10">
              <CardContent className="py-4">
                <p className="text-sm text-red-200">{error}</p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-700 border-t-yellow-400 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="bg-[#0f0f17] rounded-xl border border-[#252532]/40 p-10 text-center shadow-xl">
              <p className="text-lg text-gray-300 mb-2">No ESOP data available</p>
              <p className="text-sm text-gray-500">
                Upload your ESOP CSV data to unlock detailed analytics on your grants.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-gray-500">Display</span>
                  <div className="inline-flex rounded-full bg-[#111118] p-1 border border-[#252532]/60">
                    {CURRENCY_OPTIONS.map(({ currency, label }) => (
                      <button
                        key={currency}
                        type="button"
                        onClick={() => setDisplayCurrency(currency)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          displayCurrency === currency
                            ? 'bg-amber-500 text-black'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="text-xs text-gray-500">
                    Live PnL in{' '}
                    <span className="font-semibold text-gray-200">{displayCurrency}</span>
                  </span>
                  <span className="text-xs uppercase tracking-wider text-gray-500">Filter</span>
                  {STATUS_FILTERS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStatusFilter(option.id)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        statusFilter === option.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-[#252532]/60 text-gray-400 hover:text-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-[#0f0f17] to-[#1a1a2e] border border-[#252532]/50 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Gain/Loss
                    </CardTitle>
                    <BarChart3
                      className={`h-4 w-4 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-3xl font-bold tracking-tight ${
                        totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {formatMoney(totalPnL, true)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Realized (Sold):{' '}
                      <span
                        className={
                          totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }
                      >
                        {formatMoney(totalRealizedPnL, true)}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Unrealized (Holdings):{' '}
                      <span
                        className={
                          totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }
                      >
                        {formatMoney(totalUnrealizedPnL, true)}
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#0f0f17] to-[#2e1a1a] border border-amber-500/30 shadow-2xl hover:shadow-amber-500/10 transition-all duration-300">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Estimated Tax
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-400 tracking-tight">
                      {formatMoney(Math.max(totalTax, 0), true)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Region:{' '}
                      <span className="font-semibold text-amber-400 uppercase">
                        {analytics.region}
                      </span>{' '}
                      · Rate: {formatPercent(effectiveTaxRate * 100, 1)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Net after tax:{' '}
                      <span className={postTaxPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatMoney(postTaxPnL, true)}
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#0f0f17] to-[#1a2e1a] border border-emerald-500/30 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Avg Growth Rate
                    </CardTitle>
                    <TrendingUp
                      className={`h-4 w-4 ${portfolioCAGR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-3xl font-bold tracking-tight ${
                        portfolioCAGR >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {portfolioCAGR >= 0 ? '+' : ''}
                      {formatPercent(portfolioCAGR, 2)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Portfolio CAGR: exercise cost → current value
                    </p>
                    {growthYears > 0 && (
                      <p className="text-[10px] text-gray-600 mt-1">
                        {growthYears.toFixed(1)}y · Cost:{' '}
                        {formatCurrency(totalCostBasis, analytics.baseCurrency, false)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-[#0f0f17] border border-[#252532]/40 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Post-Tax PnL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white tracking-tight">
                      {formatMoney(postTaxPnL, true)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Gains retained after applying dynamic regional taxation
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f0f17] border border-[#252532]/40 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Inflation Adjusted PnL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white tracking-tight">
                      {formatMoney(inflationAdjustedPnL, true)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Real purchasing power after CPI adjustment ({analytics.meta.inflationRate.toFixed(2)}%)
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-br from-[#0f0f17] to-[#16162e] rounded-2xl border border-[#252532]/40 overflow-hidden shadow-2xl hover:shadow-amber-500/5 transition-all duration-300">
                <div className="p-6 border-b border-[#252532]/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Portfolio Value
                    </div>
                    <div className="mt-1 text-xl font-semibold text-white">
                      {formatMoney(totalCurrentValue, true)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatPercent(pnlPercentage, 1)} total return based on live market prices
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end text-[11px] text-gray-500">
                    <span>
                      View:{' '}
                      <span className="font-semibold text-gray-200 capitalize">
                        {statusFilter}
                      </span>
                    </span>
                    <span>Bars show yearly value of filtered grants.</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="h-[260px] w-full">
                    {valueChartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        Not enough grant data to show a yearly chart.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={valueChartData}
                          margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="esopValueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                              <stop offset="100%" stopColor="#f97316" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272f" strokeOpacity={0.25} vertical={false} />
                          <XAxis
                            dataKey="year"
                            stroke="#6b7280"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af' }}
                          />
                          <YAxis
                            stroke="#6b7280"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => {
                              const displayValue = convertValue(value)
                              return displayValue >= 1_000_000
                                ? `${(displayValue / 1_000_000).toFixed(1)}M`
                                : displayValue.toLocaleString()
                            }}
                            tick={{ fill: '#9ca3af' }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#111827',
                              border: 'none',
                              borderRadius: 8,
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
                            }}
                            labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
                            formatter={(value: number) => [
                              formatMoney(value, true),
                              'Yearly value',
                            ]}
                          />
                          <Bar
                            dataKey="value"
                            name="Yearly value"
                            fill="url(#esopValueGradient)"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={50}
                            animationDuration={1200}
                            animationEasing="ease-in-out"
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-[#0f0f17] border border-[#252532]/40 shadow-xl">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Grants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white tracking-tight">
                      {summaryMetrics.totalGrants.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f0f17] border border-[#252532]/40 shadow-xl">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Vested
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                      {summaryMetrics.totalVested.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercent(summaryMetrics.vestingPercentage, 1)} vested
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f0f17] border border-[#252532]/40 shadow-xl">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Unvested
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-400 tracking-tight">
                      {summaryMetrics.totalUnvested.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0f0f17] border border-[#252532]/40 shadow-xl">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white tracking-tight">
                      {formatMoney(summaryMetrics.totalValue, true)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`bg-gradient-to-br border shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 ${
                    summaryMetrics.unrealizedPnL >= 0
                      ? 'from-[#07110b] to-[#0a1a0a] border-emerald-500/30'
                      : 'from-[#110707] to-[#1a0a0a] border-red-500/30'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle
                      className={`text-xs font-medium uppercase tracking-wider ${
                        summaryMetrics.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      Unrealized PnL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-3xl font-bold tracking-tight ${
                        summaryMetrics.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {formatMoney(summaryMetrics.unrealizedPnL, true)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {summaryMetrics.unrealizedPnL >= 0
                        ? 'Profit on vested unexercised options'
                        : 'Loss on vested unexercised options (underwater)'}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      = (current price - exercise price) × vested shares
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#110b07] to-[#1a1207] border border-amber-500/30 shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Exercise Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-400 tracking-tight">
                      {formatMoney(summaryMetrics.exerciseCost, true)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Cost basis for vested options
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      = exercise price × vested shares
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-br from-[#0f0f17] to-[#16162e] rounded-2xl border border-[#252532]/40 overflow-hidden shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="p-6 border-b border-[#252532]/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Profit & Cost Over Time
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <div>Yearly breakdown of ESOP performance by grant year</div>
                      <div className="text-[10px]">
                        • <span className="text-gray-400">Exercise Cost</span>: Exercise price × shares
                      </div>
                      <div className="text-[10px]">
                        • <span className="text-emerald-400">Total PnL</span>: Realized + Unrealized gains/losses
                      </div>
                      <div className="text-[10px]">
                        • <span className="text-blue-400">Realized PnL</span>: Sold shares (sale vs exercise price)
                      </div>
                      <div className="text-[10px]">
                        • <span className="text-amber-400">Unrealized PnL</span>: Mark-to-market gains/losses
                      </div>
                      <div className="text-[10px]">
                        • <span className="text-purple-400">Adjusted</span>: Post-tax & inflation-adjusted
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="h-[300px] w-full">
                    {pnlChartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">
                        Not enough grant data to show profit & loss trends.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsComposedChart
                          data={pnlChartData}
                          margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="pnlCostGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                              <stop offset="100%" stopColor="#fb923c" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272f" strokeOpacity={0.25} vertical={false} />
                          <XAxis
                            dataKey="year"
                            stroke="#6b7280"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af' }}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="#6b7280"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => {
                              const displayValue = convertValue(value)
                              return displayValue >= 1_000_000
                                ? `${(displayValue / 1_000_000).toFixed(1)}M`
                                : displayValue.toLocaleString()
                            }}
                            tick={{ fill: '#9ca3af' }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#6b7280"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => {
                              const displayValue = convertValue(value)
                              return displayValue >= 1_000_000
                                ? `${(displayValue / 1_000_000).toFixed(1)}M`
                                : displayValue.toLocaleString()
                            }}
                            tick={{ fill: '#9ca3af' }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#111827',
                              border: 'none',
                              borderRadius: 8,
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
                            }}
                            labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
                            formatter={(value: number, name: string) => [
                              formatMoney(value, true),
                              name === 'cost'
                                ? 'Exercise Cost'
                                : name === 'totalPnL'
                                ? 'Total PnL'
                                : name === 'realizedPnL'
                                ? 'Realized PnL'
                                : name === 'unrealizedPnL'
                                ? 'Unrealized PnL'
                                : 'Adjusted PnL',
                            ]}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="cost"
                            name="Exercise Cost"
                            fill="url(#pnlCostGradient)"
                            maxBarSize={40}
                            radius={[6, 6, 0, 0]}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="totalPnL"
                            name="Total PnL"
                            stroke={totalPnL >= 0 ? '#10b981' : '#ef4444'}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, stroke: '#1f2937', fill: totalPnL >= 0 ? '#10b981' : '#ef4444' }}
                            activeDot={{ r: 6, fill: totalPnL >= 0 ? '#34d399' : '#f87171' }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="realizedPnL"
                            name="Realized PnL"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3, strokeWidth: 2, stroke: '#1f2937', fill: '#3b82f6' }}
                            activeDot={{ r: 5, fill: '#60a5fa' }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="unrealizedPnL"
                            name="Unrealized PnL"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3, strokeWidth: 2, stroke: '#1f2937', fill: '#f59e0b' }}
                            activeDot={{ r: 5, fill: '#fbbf24' }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="adjustedPnL"
                            name="Adjusted PnL"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="2 3"
                            dot={{ r: 3, strokeWidth: 1, stroke: '#1f2937', fill: '#8b5cf6' }}
                            activeDot={{ r: 5, fill: '#a78bfa' }}
                          />
                        </RechartsComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#0f0f17] border border-[#252532]/40 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-[#252532]/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Detailed Holdings
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      FX reference: 1 USD ≈ {(analytics.fxRate || 1).toFixed(2)} INR
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#252532]/60 text-sm">
                    <thead className="bg-[#0c0c13] text-gray-400 uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Ticker</th>
                        <th className="px-4 py-3 text-left">Company</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Vested</th>
                        <th className="px-4 py-3 text-right">Current Price</th>
                        <th className="px-4 py-3 text-right">Cost Basis</th>
                        <th className="px-4 py-3 text-right">Current Value</th>
                        <th className="px-4 py-3 text-right">Unrealized PnL</th>
                        <th className="px-4 py-3 text-right">Realized PnL</th>
                        <th className="px-4 py-3 text-right">Tax</th>
                        <th className="px-4 py-3 text-right">Post-Tax</th>
                        <th className="px-4 py-3 text-right">Inflation Adj.</th>
                        <th className="px-4 py-3 text-right">CAGR</th>
                        <th className="px-4 py-3 text-left">Sale Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252532]/40 text-gray-300">
                      {rowsForView.map((row, idx) => (
                        <tr key={`${row.ticker}-${idx}`} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 font-semibold text-white">{row.ticker}</td>
                          <td className="px-4 py-3">{row.company}</td>
                          <td className="px-4 py-3 capitalize text-gray-400">{row.status}</td>
                          <td className="px-4 py-3 text-right">{row.quantity?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{row.vested?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(row.currentPrice, true)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(row.costBasis, true)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(row.currentValue, true)}</td>
                          <td
                            className={`px-4 py-3 text-right ${
                              (row.unrealizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {formatMoney(row.unrealizedPnL, true)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right ${
                              (row.realizedPnL ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {formatMoney(row.realizedPnL, true)}
                          </td>
                          <td className="px-4 py-3 text-right">{formatMoney(row.tax, true)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(row.postTaxPnL, true)}</td>
                          <td className="px-4 py-3 text-right">
                            {formatMoney(row.inflationAdjustedPnL, true)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatPercent(row.cagr ?? 0, 2)}
                          </td>
                          <td className="px-4 py-3 text-left text-gray-400">
                            {row.saleDate ? formatDate(row.saleDate) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rowsForView.length === 0 && (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No holdings match the selected filter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

