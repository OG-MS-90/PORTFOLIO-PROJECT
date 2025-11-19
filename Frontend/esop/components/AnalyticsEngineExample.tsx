// components/AnalyticsEngineExample.tsx
// Example component demonstrating ESOP Analytics Engine v2.0 integration
// NO HARDCODED VALUES - All data from backend

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { computeAnalyticsFromCsv, computeAnalyticsFromDb, formatCurrency, formatPercentage } from '@/services/analyticsEngine';
import { EsopAnalyticsResponse } from '@/types/analytics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AnalyticsEngineExample() {
  const [analytics, setAnalytics] = useState<EsopAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'db'>('db');

  /**
   * Handle file upload and compute analytics
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await computeAnalyticsFromCsv(file);
      setAnalytics(result);
    } catch (err: any) {
      setError(err.message || 'Failed to compute analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch analytics from database
   */
  const handleFetchFromDb = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await computeAnalyticsFromDb();
      setAnalytics(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ESOP Analytics Engine v2.0</h1>
          <p className="text-muted-foreground">
            Comprehensive ESOP analytics with dynamic tax, inflation, and FX rates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={uploadMode === 'db' ? 'default' : 'outline'}
            onClick={() => setUploadMode('db')}
          >
            From Database
          </Button>
          <Button
            variant={uploadMode === 'file' ? 'default' : 'outline'}
            onClick={() => setUploadMode('file')}
          >
            Upload CSV
          </Button>
        </div>
      </div>

      {/* Upload/Fetch Controls */}
      <Card>
        <CardContent className="pt-6">
          {uploadMode === 'file' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload ESOP CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                CSV must match the schema: ticker, company, grantDate, vestingStartDate, 
                vestingEndDate, quantity, vested, strikePrice, exercisePrice, status, type
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-4">
                  Compute analytics from your stored ESOP data
                </p>
                <Button onClick={handleFetchFromDb} disabled={loading}>
                  {loading ? 'Computing...' : 'Fetch Analytics'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Computing analytics...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Results */}
      {analytics && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold uppercase">
                  {analytics.region}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currency: {analytics.baseCurrency}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.totals.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analytics.totals.totalPnL, analytics.baseCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Realized + Unrealized
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Post-Tax P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.totals.totalPostTaxPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analytics.totals.totalPostTaxPnL, analytics.baseCurrency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tax: {formatCurrency(analytics.totals.totalTax, analytics.baseCurrency)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Portfolio CAGR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(analytics.totals.portfolioCAGR)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inflation: {analytics.meta.inflationRate}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Unrealized P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${analytics.totals.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analytics.totals.totalUnrealizedPnL, analytics.baseCurrency)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  From Vested & Exercised (unsold) holdings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Realized P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${analytics.totals.totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analytics.totals.totalRealizedPnL, analytics.baseCurrency)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  From actual sales only
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inflation-Adjusted P&L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${analytics.totals.inflationAdjustedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(analytics.totals.inflationAdjustedPnL, analytics.baseCurrency)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Real purchasing power after inflation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ESOPs Per Year */}
            <Card>
              <CardHeader>
                <CardTitle>ESOPs Granted Per Year</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.charts.esopsPerYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Realized P&L Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Realized P&L Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.charts.realizedPnLTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="realizedPnL" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Multi-line P&L Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>P&L Comparison: Raw vs Post-Tax vs Inflation-Adjusted</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.charts.unrealizedVsPostTaxVsInflation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rawUnrealizedPnL" stroke="#8884d8" name="Raw Unrealized P&L" />
                    <Line type="monotone" dataKey="postTaxPnL" stroke="#82ca9d" name="Post-Tax P&L" />
                    <Line type="monotone" dataKey="inflationAdjustedPnL" stroke="#ffc658" name="Inflation-Adjusted P&L" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Tax Rates</div>
                  <div className="text-muted-foreground">
                    STCG: {analytics.meta.taxRatesUsed.stcg ? (analytics.meta.taxRatesUsed.stcg * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                  <div className="text-muted-foreground">
                    LTCG: {analytics.meta.taxRatesUsed.ltcg ? (analytics.meta.taxRatesUsed.ltcg * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Inflation Rate</div>
                  <div className="text-muted-foreground">
                    {analytics.meta.inflationRate.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="font-medium">FX Rate</div>
                  <div className="text-muted-foreground">
                    {analytics.region === 'india' ? `₹${analytics.fxRate.toFixed(2)}/USD` : '1.00'}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-muted-foreground">
                    {new Date(analytics.meta.priceFetchTimestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-Row Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ticker</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Current Price</th>
                      <th className="text-right p-2">Unrealized P&L</th>
                      <th className="text-right p-2">Realized P&L</th>
                      <th className="text-right p-2">CAGR</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.perRowCalculations.filter(row => row.isActive).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{row.ticker}</td>
                        <td className="p-2">{row.company}</td>
                        <td className="p-2 text-right">{row.quantity}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(row.currentPrice, analytics.baseCurrency)}
                        </td>
                        <td className={`p-2 text-right ${row.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(row.unrealizedPnL, analytics.baseCurrency)}
                        </td>
                        <td className={`p-2 text-right ${row.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(row.realizedPnL, analytics.baseCurrency)}
                        </td>
                        <td className="p-2 text-right">
                          {row.cagr ? formatPercentage(row.cagr) : 'N/A'}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.status === 'Sold' ? 'bg-gray-200' :
                            row.status === 'Vested' ? 'bg-green-200' :
                            row.status === 'Exercised' ? 'bg-blue-200' :
                            'bg-yellow-200'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

