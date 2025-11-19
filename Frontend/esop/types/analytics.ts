// types/analytics.ts
// TypeScript types for ESOP Analytics Engine v2.0
// NO HARDCODED VALUES - All data dynamically computed

/**
 * Region type - auto-detected from tickers
 */
export type Region = 'india' | 'usa';

/**
 * Currency type
 */
export type Currency = 'INR' | 'USD';

/**
 * ESOP Status
 */
export type EsopStatus = 'Unvested' | 'Vested' | 'Exercised' | 'Sold';

/**
 * ESOP Type
 */
export type EsopType = 'Stock Option' | 'RSU' | 'ESPP' | 'SAR';

/**
 * Per-row calculation result
 */
export interface RowCalculation {
  ticker: string;
  company: string;
  grantDate: string;
  vestingStartDate: string;
  vestingEndDate: string;
  quantity: number;
  vested: number;
  strikePrice: number;
  exercisePrice: number;
  currentPrice: number;
  priceSource: 'live' | 'csv' | 'fallback';
  status: EsopStatus;
  type: EsopType;
  salePrice: number | null;
  saleDate: string | null;
  holdingPeriodDays: number;
  holdingPeriodYears: number;
  costBasis: number;
  currentValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  tax: number;
  postTaxPnL: number;
  inflationAdjustedPnL: number;
  cagr: number;
  isActive: boolean;
  error?: string;
}

/**
 * Portfolio totals
 */
export interface PortfolioTotals {
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  totalPnL: number;
  totalTax: number;
  totalPostTaxPnL: number;
  inflationAdjustedPnL: number;
  portfolioCAGR: number;
}

/**
 * ESOPs per year chart data point
 */
export interface EsopsPerYearData {
  year: number;
  quantity: number;
}

/**
 * Realized P&L timeline data point
 */
export interface RealizedPnLTimelineData {
  month: string; // Format: YYYY-MM
  realizedPnL: number;
}

/**
 * Multi-line P&L chart data point
 */
export interface MultiLinePnLData {
  year: number;
  rawUnrealizedPnL: number;
  postTaxPnL: number;
  inflationAdjustedPnL: number;
}

/**
 * Chart data collection
 */
export interface ChartData {
  esopsPerYear: EsopsPerYearData[];
  realizedPnLTimeline: RealizedPnLTimelineData[];
  unrealizedVsPostTaxVsInflation: MultiLinePnLData[];
}

/**
 * Tax rates metadata
 */
export interface TaxRatesMetadata {
  region: Region;
  stcg?: number;
  ltcg?: number;
  holdingPeriodMonths: number;
}

/**
 * Analytics metadata
 */
export interface AnalyticsMetadata {
  taxRatesUsed: TaxRatesMetadata;
  inflationRate: number;
  priceFetchTimestamp: string;
  fxTimestamp: string;
}

/**
 * Complete analytics response
 */
export interface EsopAnalyticsResponse {
  region: Region;
  baseCurrency: Currency;
  fxRate: number;
  totals: PortfolioTotals;
  perRowCalculations: RowCalculation[];
  charts: ChartData;
  meta: AnalyticsMetadata;
}

/**
 * API response wrapper
 */
export interface AnalyticsApiResponse {
  status: 'success' | 'error';
  data?: EsopAnalyticsResponse;
  message?: string;
  code?: string;
  details?: any;
}

/**
 * Region detection result
 */
export interface RegionDetection {
  ticker: string;
  region: Region;
}

/**
 * Region validation summary
 */
export interface RegionValidationSummary {
  totalTickers: number;
  indiaTickers: number;
  usaTickers: number;
  indiaPercentage: number;
  usaPercentage: number;
}

/**
 * Region validation error
 */
export interface RegionValidationError {
  code: string;
  message: string;
  details: string;
  indiaTickers: string[];
  usaTickers: string[];
}

/**
 * Region validation result
 */
export interface RegionValidationResult {
  region: Region;
  isValid: boolean;
  isMixed: boolean;
  detections: Record<string, Region>;
  summary: RegionValidationSummary;
  errors: RegionValidationError[];
}

/**
 * CSV validation response
 */
export interface CsvValidationResponse {
  status: 'success' | 'error';
  validation?: {
    isValid: boolean;
    rowCount: number;
    schema: {
      headers: string[];
      missingColumns: string[];
      extraColumns?: string[];
    };
    region: RegionValidationResult;
  };
  message?: string;
  code?: string;
}

/**
 * Tax calculation breakdown (India)
 */
export interface IndianTaxBreakdown {
  type: 'STCG' | 'LTCG';
  baseTaxRate: number;
  surchargeRate: number;
  cessRate: number;
  effectiveRate: number;
  totalTax: number;
  breakdown: {
    baseTax: number;
    surcharge: number;
    cess: number;
  };
}

/**
 * Tax calculation breakdown (USA)
 */
export interface USTaxBreakdown {
  type: 'Short-Term Capital Gains' | 'Long-Term Capital Gains';
  federalTaxRate: number;
  niitRate: number;
  stateTaxRate: number;
  effectiveRate: number;
  totalTax: number;
  breakdown: {
    federalTax: number;
    niit: number;
    stateTax: number;
  };
}

/**
 * Tax calculation result (union type)
 */
export type TaxCalculationResult = IndianTaxBreakdown | USTaxBreakdown;

/**
 * Inflation data
 */
export interface InflationData {
  rate: number;
  ratePercentage: number;
  country: string;
  currency: Currency;
  period: string;
  year: string;
  fetchedAt: string;
  source: string;
}

/**
 * FX rate data
 */
export interface FxRateData {
  rate: number;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  pair: string;
  timestamp: string;
  source: string;
}

/**
 * Market quote data
 */
export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  previousClose: number;
  dayLow: number;
  dayHigh: number;
  timestamp: number;
}

/**
 * Chart configuration options
 */
export interface ChartOptions {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  currency?: Currency;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeCharts?: boolean;
  includeMetadata?: boolean;
}

/**
 * Filter options for analytics
 */
export interface AnalyticsFilterOptions {
  ticker?: string;
  company?: string;
  status?: EsopStatus[];
  type?: EsopType[];
  dateRange?: {
    from: string;
    to: string;
  };
  minPnL?: number;
  maxPnL?: number;
}

/**
 * Sort options for analytics
 */
export interface AnalyticsSortOptions {
  field: keyof RowCalculation;
  direction: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Analytics request options
 */
export interface AnalyticsRequestOptions {
  filters?: AnalyticsFilterOptions;
  sort?: AnalyticsSortOptions;
  pagination?: PaginationOptions;
}

/**
 * CSV upload payload
 */
export interface CsvUploadPayload {
  file: File;
  options?: {
    validateOnly?: boolean;
  };
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  status: 'error';
  message: string;
  code: string;
  details?: any;
  missingColumns?: string[];
  errors?: any[];
}

/**
 * Success response from API (generic)
 */
export interface ApiSuccessResponse<T = any> {
  status: 'success';
  data: T;
}

/**
 * Type guard for error response
 */
export function isErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.status === 'error';
}

/**
 * Type guard for success response
 */
export function isSuccessResponse<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.status === 'success';
}

/**
 * Type guard for analytics response
 */
export function isAnalyticsResponse(data: any): data is EsopAnalyticsResponse {
  return data && 
    typeof data.region === 'string' &&
    typeof data.baseCurrency === 'string' &&
    typeof data.fxRate === 'number' &&
    data.totals &&
    Array.isArray(data.perRowCalculations) &&
    data.charts &&
    data.meta;
}

