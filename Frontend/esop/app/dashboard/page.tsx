"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { useEsopData } from '@/contexts/EsopDataContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import { TrendingUp, Upload, BarChart3, RefreshCw, DollarSign, Activity, Calendar, PieChart, Search, CheckCircle2, Clock, XCircle, Circle } from 'lucide-react'
import Link from 'next/link'
import { SidebarNav } from '@/components/ui/sidebar-nav'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { data, isLoading, error, refetch } = useEsopData()

  // Calculate metrics - MUST be before any conditional returns
  const totalValue = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data.reduce((sum, record) => {
      const price = record.currentPrice || record.fmv || record.strikePrice
      return sum + (record.quantity * price)
    }, 0)
  }, [data])

  const totalVested = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data.filter(r => r.status === 'Vested' || r.status === 'Exercised')
      .reduce((sum, r) => sum + r.quantity, 0)
  }, [data])

  const totalUnvested = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data.reduce((sum, r) => sum + r.quantity, 0) - totalVested
  }, [data, totalVested])

  const vestedValue = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data.filter(r => r.status === 'Vested' || r.status === 'Exercised')
      .reduce((sum, r) => {
        const price = r.currentPrice || r.fmv || r.strikePrice
        return sum + (r.quantity * price)
      }, 0)
  }, [data])

  // Chart data
  const statusChartData = useMemo(() => [
    { name: 'Vested', value: totalVested, color: '#10b981' },
    { name: 'Unvested', value: totalUnvested, color: '#f59e0b' },
  ], [totalVested, totalUnvested])
  
  // Shares allotted over years data
  const sharesAllottedOverTimeData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group shares by grant year
    const yearlyShares: Record<number, number> = {}

    data.forEach(record => {
      if (!record.grantDate) return
      const year = new Date(record.grantDate).getFullYear()
      if (isNaN(year)) return

      if (!yearlyShares[year]) {
        yearlyShares[year] = 0
      }

      yearlyShares[year] += record.quantity || 0
    })

    // Convert to array format for the chart
    return Object.entries(yearlyShares)
      .map(([year, quantity]) => ({
        year: parseInt(year),
        quantity
      }))
      .sort((a, b) => a.year - b.year)
  }, [data])
  
  // Distribution data for vested vs unvested
  const shareDistributionData = useMemo(() => {
    const total = totalVested + totalUnvested
    if (total === 0) {
      return [
        { name: 'Vested', value: 0, color: '#10b981' },
        { name: 'Unvested', value: 0, color: '#f59e0b' },
      ]
    }
    return [
      { name: 'Vested', value: totalVested, color: '#10b981' },
      { name: 'Unvested', value: totalUnvested, color: '#f59e0b' },
    ]
  }, [totalVested, totalUnvested])

  const valueChartData = useMemo(() => [
    { name: 'Vested Value', value: vestedValue },
    { name: 'Unvested Value', value: totalValue - vestedValue },
  ], [vestedValue, totalValue])

  const totalExercised = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data
      .filter((r) => r.status === 'Exercised' || r.status === 'Sold')
      .reduce((sum, r) => sum + r.quantity, 0)
  }, [data])

  const totalShares = totalVested + totalUnvested
  const vestedPercent = totalShares > 0 ? (totalVested / totalShares) * 100 : 0
  const unvestedPercent = totalShares > 0 ? (totalUnvested / totalShares) * 100 : 0

  // Year-wise ESOP exposure (total quantity granted per year)
  const exposureData = useMemo(() => {
    if (!data || data.length === 0) return []

    const yearly: Record<number, number> = {}

    data.forEach((record) => {
      if (!record.grantDate) return

      const date = new Date(record.grantDate)
      const year = date.getFullYear()
      if (Number.isNaN(year)) return

      yearly[year] = (yearly[year] || 0) + (record.quantity || 0)
    })

    return Object.entries(yearly)
      .map(([year, quantity]) => ({
        year,
        quantity,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year))
  }, [data])

  const [searchQuery, setSearchQuery] = useState('')
  const filteredData = useMemo(() => {
    const source = data || []
    if (!searchQuery) return source

    const q = searchQuery.toLowerCase()
    return source.filter((record) => {
      const company = record.company?.toLowerCase() ?? ''
      const ticker = record.ticker?.toLowerCase() ?? ''
      const status = record.status?.toLowerCase() ?? ''

      return (
        company.includes(q) ||
        ticker.includes(q) ||
        status.includes(q)
      )
    })
  }, [data, searchQuery])

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0e]">
      <SidebarNav />
      <div className="flex-1 pl-16 lg:pl-64 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">ESOP Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">View and manage your equity grants</p>
          </div>

        {/* Metrics Section - Modern Cards (driven by real data) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Grants */}
          <div className="bg-[#0f1015] rounded-xl border border-[#252532]/30 p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total grants</h3>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalShares.toLocaleString()}
            </div>
          </div>
          
          {/* Total Vested */}
          <div className="bg-[#0f1015] rounded-xl border border-[#252532]/30 p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total vested</h3>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalVested.toLocaleString()}
            </div>
          </div>
          
          {/* Total Exercised */}
          <div className="bg-[#0f1015] rounded-xl border border-[#252532]/30 p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total exercised</h3>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalExercised.toLocaleString()}
            </div>
          </div>
          
          {/* Total Unvested */}
          <div className="bg-[#0f1015] rounded-xl border border-[#252532]/30 p-4 relative overflow-hidden shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total unvested</h3>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalUnvested.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Charts Section - Modern Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shares Allotted Over Years - Line Chart */}
          <div className="bg-[#0f1015] rounded-xl border border-[#252532]/30 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#252532]/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Shares Allotted Over Years
                </h2>
              </div>
            </div>
            <div className="p-5">
              <div className="h-[220px] w-full">
                {sharesAllottedOverTimeData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No grant date data found in uploaded ESOPs.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sharesAllottedOverTimeData} margin={{ top: 15, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272f" strokeOpacity={0.2} vertical={false} />
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
                        // Scale directly to the data range so small grant sizes are visible
                        domain={[0, 'dataMax']}
                        tickFormatter={(value) => value.toLocaleString()}
                        tick={{ fill: '#9ca3af' }}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '0.5rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                        }}
                        itemStyle={{ color: '#f59e0b' }}
                        labelStyle={{ color: '#d1d5db' }}
                        formatter={(value: number) => [`${value.toLocaleString()}`, 'Shares']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quantity" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          
          {/* Share Distribution - Donut Chart */}
          <div className="bg-[#0f1015] rounded-xl border border-[#252532]/30 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#252532]/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-amber-500" />
                  Share Distribution
                </h2>
              </div>
            </div>
            <div className="p-5">
              <div className="h-[220px] w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={shareDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {shareDistributionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#f59e0b"
                          opacity={index === 0 ? 1 : 0.7}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                
                <div className="flex items-center justify-center gap-8 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                    <span className="text-sm text-gray-300">
                      Vested: {formatPercent(vestedPercent)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b] opacity-70"></div>
                    <span className="text-sm text-gray-300">
                      Unvested: {formatPercent(unvestedPercent)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vested Shares Overview - Modern Card */}
        <div className="bg-[#070709] rounded-xl border border-[#252532]/30 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-[#252532]/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
                Shares Overview
              </h2>
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by company, ticker or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#16161e] border border-[#252532] rounded-md text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/70 transition-all duration-200"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-[#070709]">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-700 border-t-yellow-400 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading ESOP data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">Error: {error}</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-[#1a1a24] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-yellow-400/60" />
                </div>
                <p className="text-lg font-medium mb-2 text-gray-300">No ESOP data found</p>
                <p className="text-gray-500 mb-6">Upload your ESOP data to get started</p>
                <Link href="/esop-upload">
                  <Button className="bg-yellow-400 text-black hover:bg-yellow-500 py-2.5 px-5">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase">Grant Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase">Quantity</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-amber-500 uppercase">Strike Price</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-amber-500 uppercase">Exercise Price</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-amber-500 uppercase">Avg Stock Price</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase">Exercise Date</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase">Vested</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase">Unvested</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {/* Add sample data if no data is available */}
                    {(filteredData.length === 0 ? [
                      {
                        _id: 'sample1',
                        grantDate: '2022-02-01',
                        type: 'ISO',
                        quantity: 100,
                        currentPrice: 10,
                        strikePrice: 0,
                        avgStockPrice: 15,
                        status: 'Pending',
                        notes: 'First grant allocation'
                      },
                      {
                        _id: 'sample2',
                        grantDate: '2022-02-01',
                        type: 'ISO',
                        quantity: 200,
                        currentPrice: 15,
                        strikePrice: 0,
                        exercisePrice: 5,
                        avgStockPrice: 25,
                        status: 'Exercised',
                        exerciseDate: '2023-02-01',
                        notes: 'Performance bonus shares'
                      }
                    ] : filteredData).map((record) => {
                      const vestedQty = ['Vested', 'Exercised', 'Sold'].includes(record.status) ? record.quantity : Math.floor(record.quantity * 0.5) // Assume 50% vested by default
                      const unvestedQty = record.quantity - vestedQty
                      
                      return (
                        <tr 
                          key={record._id}
                          className="hover:bg-neutral-800/20 transition-colors"
                        >
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-gray-300 text-sm">{formatDate(record.grantDate)}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs text-gray-400 uppercase">{record.type || 'ISO'}</span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap text-gray-300 text-sm">
                            {record.quantity.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap font-medium">
                            <span className="text-amber-500 font-medium">{formatCurrency(record.strikePrice || 0, 'USD', true)}</span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap font-medium">
                            <span className="text-amber-500 font-medium">
                              {record.status === 'Exercised' || record.status === 'Sold' 
                                ? formatCurrency(record.exercisePrice || record.strikePrice || 0, 'USD', true)
                                : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap text-gray-300 text-sm">
                            {formatCurrency(record.avgStockPrice || record.currentPrice || 0, 'USD', true)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-300 text-sm">
                            {record.exerciseDate ? formatDate(record.exerciseDate) : '-'}
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap text-sm">
                            <span className="text-emerald-400">{vestedQty.toLocaleString()}</span>
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap text-sm">
                            <span className="text-amber-400">{unvestedQty.toLocaleString()}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {['Exercised'].includes(record.status) ? (
                              <span className="inline-flex items-center rounded-md text-xs font-medium bg-[#064e3b] text-emerald-400 py-1 px-2.5">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Exercised
                              </span>
                            ) : ['Pending', 'Active'].includes(record.status) ? (
                              <span className="inline-flex items-center rounded-md text-xs font-medium bg-[#451a03] text-amber-400 py-1 px-2.5">
                                <Circle className="mr-1 h-3 w-3" />
                                {record.status === 'Active' ? 'Active' : 'Pending'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md text-xs font-medium bg-[#451a03] text-amber-400 py-1 px-2.5">
                                <Circle className="mr-1 h-3 w-3" />
                                Not exercised
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-400">
                            {record.notes || (record.status === 'Exercised' ? 'Performance bonus shares' : 'First grant allocation')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}
