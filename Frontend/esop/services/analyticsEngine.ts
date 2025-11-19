// services/analyticsEngine.ts
// Frontend service for ESOP Analytics Engine v2.0 API
// NO HARDCODED VALUES - All data fetched from backend

import {
  EsopAnalyticsResponse,
  AnalyticsApiResponse,
  CsvValidationResponse,
  CsvUploadPayload,
  ApiErrorResponse,
  isSuccessResponse,
  isErrorResponse,
  isAnalyticsResponse
} from '@/types/analytics';
import { authorizedFetch } from '@/lib/authClient';

// API base URL - falls back to local backend on port 4000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Compute analytics from uploaded CSV file
 * @param file - CSV file to analyze
 * @returns Analytics results or error
 */
export async function computeAnalyticsFromCsv(file: File): Promise<EsopAnalyticsResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await authorizedFetch(`${API_BASE_URL}/analytics/compute`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Analytics computation failed');
    }

    if (isErrorResponse(data)) {
      throw new Error(data.message);
    }

    if (!isSuccessResponse(data) || !data.data) {
      throw new Error('Invalid response format from analytics API');
    }

    if (!isAnalyticsResponse(data.data)) {
      throw new Error('Invalid analytics data structure');
    }

    return data.data;
  } catch (error) {
    console.error('[analyticsEngine] Error computing analytics from CSV:', error);
    throw error;
  }
}

/**
 * Compute analytics from user's stored ESOP data
 * Requires authentication
 * @returns Analytics results or error
 */
export async function computeAnalyticsFromDb(): Promise<EsopAnalyticsResponse> {
  try {
    const response = await authorizedFetch(`${API_BASE_URL}/analytics/from-db`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      if (response.status === 404) {
        throw new Error('No ESOP data found. Please upload your ESOP data first.');
      }
      throw new Error(data.message || 'Analytics computation failed');
    }

    if (isErrorResponse(data)) {
      throw new Error(data.message);
    }

    if (!isSuccessResponse(data) || !data.data) {
      throw new Error('Invalid response format from analytics API');
    }

    if (!isAnalyticsResponse(data.data)) {
      throw new Error('Invalid analytics data structure');
    }

    return data.data;
  } catch (error) {
    console.error('[analyticsEngine] Error computing analytics from DB:', error);
    throw error;
  }
}

/**
 * Validate CSV file without computing full analytics
 * @param file - CSV file to validate
 * @returns Validation result
 */
export async function validateCsv(file: File): Promise<CsvValidationResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await authorizedFetch(`${API_BASE_URL}/analytics/validate-csv`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'CSV validation failed');
    }

    return data;
  } catch (error) {
    console.error('[analyticsEngine] Error validating CSV:', error);
    throw error;
  }
}

/**
 * Format currency value based on region
 * @param value - Numeric value
 * @param currency - Currency code
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: 'INR' | 'USD',
  options?: Intl.NumberFormatOptions
): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

/**
 * Format percentage value
 * @param value - Numeric value (as decimal, e.g., 0.15 for 15%)
 * @param options - Intl.NumberFormat options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value / 100);
}

/**
 * Format number with locale-specific formatting
 * @param value - Numeric value
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

/**
 * Calculate summary statistics from row calculations
 * @param rows - Array of row calculations
 * @returns Summary statistics
 */
export function calculateSummaryStats(rows: any[]) {
  const activeRows = rows.filter(row => row.isActive);
  
  return {
    totalRows: rows.length,
    activeRows: activeRows.length,
    inactiveRows: rows.length - activeRows.length,
    uniqueTickers: new Set(rows.map(r => r.ticker)).size,
    uniqueCompanies: new Set(rows.map(r => r.company)).size,
    statusBreakdown: rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    typeBreakdown: rows.reduce((acc, row) => {
      acc[row.type] = (acc[row.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
}

/**
 * Export analytics data to CSV
 * @param data - Analytics response data
 * @returns CSV string
 */
export function exportToCSV(data: EsopAnalyticsResponse): string {
  const headers = [
    'Ticker', 'Company', 'Grant Date', 'Vesting Start', 'Vesting End',
    'Quantity', 'Vested', 'Strike Price', 'Exercise Price', 'Current Price',
    'Status', 'Type', 'Sale Price', 'Sale Date',
    'Holding Period (Days)', 'Holding Period (Years)',
    'Cost Basis', 'Current Value',
    'Unrealized P&L', 'Realized P&L', 'Tax', 'Post-Tax P&L',
    'Inflation-Adjusted P&L', 'CAGR (%)'
  ];

  const rows = data.perRowCalculations.map(row => [
    row.ticker,
    row.company,
    row.grantDate,
    row.vestingStartDate,
    row.vestingEndDate,
    row.quantity,
    row.vested,
    row.strikePrice,
    row.exercisePrice,
    row.currentPrice,
    row.status,
    row.type,
    row.salePrice || '',
    row.saleDate || '',
    row.holdingPeriodDays,
    row.holdingPeriodYears,
    row.costBasis,
    row.currentValue,
    row.unrealizedPnL,
    row.realizedPnL,
    row.tax,
    row.postTaxPnL,
    row.inflationAdjustedPnL,
    row.cagr
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Download analytics data as CSV file
 * @param data - Analytics response data
 * @param filename - Optional filename
 */
export function downloadAsCSV(data: EsopAnalyticsResponse, filename?: string): void {
  const csvContent = exportToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `esop-analytics-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export analytics data to JSON
 * @param data - Analytics response data
 * @returns JSON string
 */
export function exportToJSON(data: EsopAnalyticsResponse): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download analytics data as JSON file
 * @param data - Analytics response data
 * @param filename - Optional filename
 */
export function downloadAsJSON(data: EsopAnalyticsResponse, filename?: string): void {
  const jsonContent = exportToJSON(data);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `esop-analytics-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Filter row calculations based on criteria
 * @param rows - Array of row calculations
 * @param filters - Filter criteria
 * @returns Filtered rows
 */
export function filterRows(rows: any[], filters: any): any[] {
  return rows.filter(row => {
    if (filters.ticker && row.ticker !== filters.ticker) return false;
    if (filters.company && row.company !== filters.company) return false;
    if (filters.status && Array.isArray(filters.status) && !filters.status.includes(row.status)) return false;
    if (filters.type && Array.isArray(filters.type) && !filters.type.includes(row.type)) return false;
    if (filters.minPnL !== undefined && row.unrealizedPnL + row.realizedPnL < filters.minPnL) return false;
    if (filters.maxPnL !== undefined && row.unrealizedPnL + row.realizedPnL > filters.maxPnL) return false;
    
    if (filters.dateRange) {
      const grantDate = new Date(row.grantDate);
      if (filters.dateRange.from && grantDate < new Date(filters.dateRange.from)) return false;
      if (filters.dateRange.to && grantDate > new Date(filters.dateRange.to)) return false;
    }
    
    return true;
  });
}

/**
 * Sort row calculations
 * @param rows - Array of row calculations
 * @param field - Field to sort by
 * @param direction - Sort direction
 * @returns Sorted rows
 */
export function sortRows(rows: any[], field: string, direction: 'asc' | 'desc'): any[] {
  return [...rows].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal < bVal ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
}

export default {
  computeAnalyticsFromCsv,
  computeAnalyticsFromDb,
  validateCsv,
  formatCurrency,
  formatPercentage,
  formatNumber,
  calculateSummaryStats,
  exportToCSV,
  downloadAsCSV,
  exportToJSON,
  downloadAsJSON,
  filterRows,
  sortRows
};

