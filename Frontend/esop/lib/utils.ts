import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'USD', showDecimal: boolean = false): string {
  const value = Number(amount)

  if (!Number.isFinite(value)) {
    return '-'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: showDecimal ? 2 : 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  }).format(value)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(value)
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
