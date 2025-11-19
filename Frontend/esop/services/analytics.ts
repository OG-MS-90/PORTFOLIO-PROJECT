import { EsopRecord, AnalyticsData } from '@/types/esop'

/**
 * UNIFIED INVESTMENT-BASED PnL MODEL - Static Analytics
 * PRD Version 1.0 - Approved Model A
 * 
 * Calculates portfolio metrics using:
 * - PnL = (current_price - exercise_price) × quantity
 * - Unrealized PnL can be negative
 * - No intrinsic value calculations
 * - Exercise price is the cost basis
 */
export function calculateEsopAnalytics(data: EsopRecord[]): AnalyticsData {
  // Basic metrics
  const totalGrants = data.reduce((sum, record) => {
    const base =
      (typeof record.totalGrants === 'number' ? record.totalGrants : undefined) ??
      (typeof record.quantity === 'number' ? record.quantity : 0)
    return sum + base
  }, 0)

  const totalVested = data.reduce((sum, record) => {
    const vested = typeof record.vested === 'number' ? record.vested : 0
    return sum + vested
  }, 0)

  const totalUnvested = data.reduce((sum, record) => {
    const grants =
      (typeof record.totalGrants === 'number' ? record.totalGrants : undefined) ??
      (typeof record.quantity === 'number' ? record.quantity : 0)
    const vested = typeof record.vested === 'number' ? record.vested : 0
    const explicitUnvested =
      typeof record.unvested === 'number' ? record.unvested : undefined
    const unvested =
      explicitUnvested !== undefined ? explicitUnvested : Math.max(grants - vested, 0)
    return sum + unvested
  }, 0)

  const totalExercised = data.reduce((sum, record) => {
    if (typeof record.exercised === 'number') {
      return sum + record.exercised
    }
    if (record.status === 'Exercised' || record.status === 'Sold') {
      return sum + record.quantity
    }
    return sum
  }, 0)

  const totalValue = data.reduce((sum, record) => {
    const currentPrice = record.currentPrice || record.fmv || record.strikePrice || record.exercisePrice || 0
    const units =
      (typeof record.totalGrants === 'number' ? record.totalGrants : undefined) ??
      (typeof record.quantity === 'number' ? record.quantity : 0)
    return sum + units * currentPrice
  }, 0)

  const vestingPercentage = totalGrants > 0 ? (totalVested / totalGrants) * 100 : 0

  // Average prices calculation
  let totalStockPrice = 0
  let stockPriceCount = 0
  let totalExercisePrice = 0
  let exercisePriceCount = 0
  let totalStrikePrice = 0
  let strikePriceCount = 0

  data.forEach(record => {
    // Average stock price calculation
    if (record.avgStockPrice || record.currentPrice) {
      totalStockPrice += record.avgStockPrice || record.currentPrice || 0;
      stockPriceCount++;
    }

    // Average exercise price calculation (only for exercised options)
    if ((record.status === 'Exercised' || record.status === 'Sold') && record.exercisePrice) {
      totalExercisePrice += record.exercisePrice * record.quantity;
      exercisePriceCount += record.quantity;
    }

    // Average strike price calculation
    if (record.strikePrice) {
      totalStrikePrice += record.strikePrice * record.quantity;
      strikePriceCount += record.quantity;
    }
  })

  const avgStockPrice = stockPriceCount > 0 ? totalStockPrice / stockPriceCount : 0;
  const avgExercisePrice = exercisePriceCount > 0 ? totalExercisePrice / exercisePriceCount : 0;
  const avgStrikePrice = strikePriceCount > 0 ? totalStrikePrice / strikePriceCount : 0;

  // UNIFIED MODEL: Calculate unrealized PnL for vested unexercised options
  // PnL = (current_price - exercise_price) × quantity — CAN BE NEGATIVE
  let potentialGain = 0;  // Renamed for compatibility, but now = unrealized PnL
  data.forEach(record => {
    if (record.status === 'Vested') {
      const currentPrice = record.currentPrice || record.fmv || 0;
      const exercisePrice = record.exercisePrice || record.strikePrice || 0;
      const vestedShares = typeof record.vested === 'number' ? record.vested : record.quantity;

      // Allow negative PnL (underwater options)
      const unrealizedPnL = (currentPrice - exercisePrice) * vestedShares;
      potentialGain += unrealizedPnL;
    }
  });

  // Exercise cost: cost basis for vested unexercised options
  const exerciseCost = data.reduce((sum, record) => {
    if (record.status === 'Vested') {
      const exercisePrice = record.exercisePrice || record.strikePrice || 0;
      const vestedShares = typeof record.vested === 'number' ? record.vested : record.quantity;
      return sum + exercisePrice * vestedShares;
    }
    return sum;
  }, 0);

  // Group by company and type
  const byCompany = data.reduce((acc, record) => {
    acc[record.company] = (acc[record.company] || 0) + record.quantity
    return acc
  }, {} as Record<string, number>)

  const byType = data.reduce((acc, record) => {
    const type = record.grantType || record.type || 'Unknown'
    acc[type] = (acc[type] || 0) + record.quantity
    return acc
  }, {} as Record<string, number>)
  
  // Group by grant year
  const byYear = data.reduce((acc, record) => {
    if (!record.grantDate) return acc;
    
    const year = new Date(record.grantDate).getFullYear().toString();
    if (!isNaN(parseInt(year))) {
      acc[year] = (acc[year] || 0) + record.quantity;
    }
    return acc;
  }, {} as Record<string, number>)

  return {
    totalGrants,
    totalVested,
    totalUnvested,
    totalExercised,
    totalValue,
    vestingPercentage,
    avgStockPrice,
    avgExercisePrice,
    avgStrikePrice,
    potentialGain,
    exerciseCost,
    byCompany,
    byType,
    byYear
  }
}
