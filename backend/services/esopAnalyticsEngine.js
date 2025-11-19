// services/esopAnalyticsEngine.js
// ESOP Analytics Engine - Complete Implementation
// Following PRD specification - NO HARDCODED VALUES

const { validateRegionConsistency, getCurrencyForRegion } = require('./dataProviders/regionDetector');
const { getTaxRates, calculateEffectiveTaxRate } = require('./dataProviders/taxRateProvider');
const { getInflationRate, adjustForInflation } = require('./dataProviders/inflationProvider');
const { getFXRate } = require('./dataProviders/fxRateProvider');
const { getRealTimeQuotes } = require('./marketDataService');

/**
 * Main Analytics Engine
 * Accepts CSV data and computes complete analytics
 * @param {Array<Object>} csvData - Parsed CSV records
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Complete analytics response
 */
async function computeEsopAnalytics(csvData, options = {}) {
  try {
    console.log('[esopAnalyticsEngine] Starting analytics computation...');
    
    // Step 1: Region Detection & Validation
    const tickers = csvData.map(row => row.ticker).filter(Boolean);
    const regionValidation = await validateRegionConsistency(tickers, false);
    
    if (!regionValidation.isValid) {
      throw regionValidation.errors[0];
    }

    const region = regionValidation.region;
    const baseCurrency = getCurrencyForRegion(region);
    console.log(`[esopAnalyticsEngine] Detected region: ${region}, currency: ${baseCurrency}`);

    // Step 2: Fetch Dynamic Data in Parallel
    const [taxRates, inflationData, fxData, quotes] = await Promise.all([
      getTaxRates(region),
      getInflationRate(region),
      getFXRate('USD', 'INR'),
      getRealTimeQuotes(tickers)
    ]);

    console.log('[esopAnalyticsEngine] Dynamic data fetched successfully');

    // Step 3: Process Each Row
    const perRowCalculations = await Promise.all(
      csvData.map(row => calculateRowMetrics(row, { region, taxRates, inflationData, quotes, fxData }))
    );

    // Step 4: Calculate Portfolio Totals
    const totals = calculatePortfolioTotals(perRowCalculations);

    // Step 5: Generate Chart Data
    const charts = generateChartData(perRowCalculations, csvData);

    // Step 6: Build Response
    const response = {
      region,
      baseCurrency,
      fxRate: fxData.rate,
      totals,
      perRowCalculations,
      charts: {
        esopsPerYear: charts.esopsPerYear,
        realizedPnLTimeline: charts.realizedPnLTimeline,
        unrealizedVsPostTaxVsInflation: charts.multiLinePnL
      },
      meta: {
        taxRatesUsed: {
          region,
          stcg: taxRates.stcg || taxRates.shortTerm?.federal?.upTo182100,
          ltcg: taxRates.ltcg || taxRates.longTerm?.federal?.upTo492300,
          holdingPeriodMonths: taxRates.holdingPeriodMonths
        },
        inflationRate: inflationData.ratePercentage,
        priceFetchTimestamp: new Date().toISOString(),
        fxTimestamp: fxData.timestamp
      }
    };

    console.log('[esopAnalyticsEngine] Analytics computation complete');
    return response;

  } catch (error) {
    console.error('[esopAnalyticsEngine] Error:', error);
    throw error;
  }
}

/**
 * Calculate metrics for a single row
 * @param {Object} row - CSV row data
 * @param {Object} context - Shared context (region, rates, etc.)
 * @returns {Promise<Object>} Row calculations
 */
async function calculateRowMetrics(row, context) {
  const { region, taxRates, inflationData, quotes, fxData } = context;

  // Parse row data
  const ticker = row.ticker;
  const company = row.company;
  const grantDate = new Date(row.grantDate);
  const vestingStartDate = new Date(row.vestingStartDate);
  const vestingEndDate = new Date(row.vestingEndDate);
  const quantity = parseFloat(row.quantity) || 0;
  const vested = parseFloat(row.vested) || 0;
  const strikePrice = parseFloat(row.strikePrice) || 0;
  const exercisePrice = parseFloat(row.exercisePrice) || strikePrice;
  const currentPriceCSV = parseFloat(row.currentPrice) || 0;
  const status = row.status || 'Unvested';
  const type = row.type || 'Stock Option';
  const salePrice = parseFloat(row.salePrice) || null;
  const saleDate = row.saleDate ? new Date(row.saleDate) : null;

  // Fetch live price
  let livePrice = currentPriceCSV;
  let priceSource = 'csv';
  
  if (quotes[ticker]) {
    livePrice = quotes[ticker].price;
    priceSource = 'live';
  }

  // If no price available, mark as inactive
  if (!livePrice || livePrice <= 0) {
    return {
      ticker,
      company,
      status,
      error: 'No price data available',
      isActive: false
    };
  }

  const today = new Date();

  // Calculate holding period
  const holdingPeriodDays = Math.floor((today - grantDate) / (1000 * 60 * 60 * 24));
  const holdingPeriodYears = holdingPeriodDays / 365;

  // Initialize P&L variables
  let unrealizedPnL = 0;
  let realizedPnL = 0;
  let costBasis = 0;
  let currentValue = 0;
  let tax = 0;
  let postTaxPnL = 0;
  let inflationAdjustedPnL = 0;
  let cagr = 0;

  // CALCULATION BASED ON STATUS
  if (status === 'Sold') {
    // ====== REALIZED P&L ======
    const actualSalePrice = salePrice || livePrice;
    realizedPnL = (actualSalePrice - exercisePrice) * quantity;
    costBasis = exercisePrice * quantity;
    currentValue = actualSalePrice * quantity;

    // Tax calculation
    const taxCalc = calculateEffectiveTaxRate({
      region,
      holdingPeriodDays,
      gain: realizedPnL,
      totalIncome: 0 // Could be passed from user profile
    });
    tax = taxCalc.totalTax;
    postTaxPnL = realizedPnL - tax;

    // Inflation adjustment
    inflationAdjustedPnL = adjustForInflation(
      postTaxPnL,
      inflationData.rate,
      holdingPeriodYears
    );

    // CAGR not calculated for sold (as per spec)
    cagr = 0;

  } else if (status === 'Vested' || status === 'Exercised') {
    // ====== UNREALIZED P&L ======
    const vestedShares = vested || quantity;
    costBasis = exercisePrice * vestedShares;
    currentValue = livePrice * vestedShares;
    unrealizedPnL = currentValue - costBasis;

    // Tax calculation on unrealized gain
    const taxCalc = calculateEffectiveTaxRate({
      region,
      holdingPeriodDays,
      gain: unrealizedPnL,
      totalIncome: 0
    });
    tax = taxCalc.totalTax;
    postTaxPnL = unrealizedPnL - tax;

    // Inflation adjustment
    inflationAdjustedPnL = adjustForInflation(
      postTaxPnL,
      inflationData.rate,
      holdingPeriodYears
    );

    // CAGR calculation
    const yearsHeld = (today - vestingStartDate) / (1000 * 60 * 60 * 24 * 365);
    if (exercisePrice > 0 && yearsHeld > 0) {
      cagr = (Math.pow(livePrice / exercisePrice, 1 / yearsHeld) - 1) * 100;
    } else {
      cagr = 0;
    }

  } else if (status === 'Unvested') {
    // No P&L calculations for unvested
    cagr = 0;
  }

  return {
    ticker,
    company,
    grantDate: grantDate.toISOString(),
    vestingStartDate: vestingStartDate.toISOString(),
    vestingEndDate: vestingEndDate.toISOString(),
    quantity,
    vested,
    strikePrice,
    exercisePrice,
    currentPrice: livePrice,
    priceSource,
    status,
    type,
    salePrice,
    saleDate: saleDate ? saleDate.toISOString() : null,
    holdingPeriodDays,
    holdingPeriodYears: Math.round(holdingPeriodYears * 100) / 100,
    costBasis,
    currentValue,
    unrealizedPnL,
    realizedPnL,
    tax,
    postTaxPnL,
    inflationAdjustedPnL,
    cagr,
    isActive: true
  };
}

/**
 * Calculate portfolio-level totals
 * @param {Array<Object>} rows - Calculated row metrics
 * @returns {Object} Portfolio totals
 */
function calculatePortfolioTotals(rows) {
  let totalUnrealizedPnL = 0;
  let totalRealizedPnL = 0;
  let totalTax = 0;
  let totalPostTaxPnL = 0;
  let totalInflationAdjustedPnL = 0;
  let totalInvested = 0;
  let weightedCAGR = 0;

  rows.forEach(row => {
    if (!row.isActive) return;

    totalUnrealizedPnL += row.unrealizedPnL || 0;
    totalRealizedPnL += row.realizedPnL || 0;
    totalTax += row.tax || 0;
    totalPostTaxPnL += row.postTaxPnL || 0;
    totalInflationAdjustedPnL += row.inflationAdjustedPnL || 0;

    // CAGR weighting (only for vested/exercised, not sold)
    if (row.status !== 'Sold' && row.status !== 'Unvested' && row.cagr) {
      const invested = row.exercisePrice * (row.vested || row.quantity);
      totalInvested += invested;
      weightedCAGR += row.cagr * invested;
    }
  });

  const portfolioCAGR = totalInvested > 0 ? weightedCAGR / totalInvested : 0;

  return {
    totalUnrealizedPnL: Math.round(totalUnrealizedPnL * 100) / 100,
    totalRealizedPnL: Math.round(totalRealizedPnL * 100) / 100,
    totalPnL: Math.round((totalUnrealizedPnL + totalRealizedPnL) * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalPostTaxPnL: Math.round(totalPostTaxPnL * 100) / 100,
    inflationAdjustedPnL: Math.round(totalInflationAdjustedPnL * 100) / 100,
    portfolioCAGR: Math.round(portfolioCAGR * 100) / 100
  };
}

/**
 * Generate chart data
 * @param {Array<Object>} rows - Calculated row metrics
 * @param {Array<Object>} csvData - Original CSV data
 * @returns {Object} Chart datasets
 */
function generateChartData(rows, csvData) {
  // 1. ESOPs per Year
  const esopsPerYear = {};
  csvData.forEach(row => {
    if (row.grantDate) {
      const year = new Date(row.grantDate).getFullYear();
      esopsPerYear[year] = (esopsPerYear[year] || 0) + (parseFloat(row.quantity) || 0);
    }
  });

  const esopsPerYearArray = Object.keys(esopsPerYear)
    .sort()
    .map(year => ({
      year: parseInt(year),
      quantity: esopsPerYear[year]
    }));

  // 2. Realized P&L Timeline (by sale date)
  const realizedPnLTimeline = {};
  rows.forEach(row => {
    if (row.status === 'Sold') {
      const saleDateSource = row.saleDate || row.grantDate || row.vestingEndDate || null;
      if (!saleDateSource) {
        return;
      }
      const date = new Date(saleDateSource);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      realizedPnLTimeline[monthKey] = (realizedPnLTimeline[monthKey] || 0) + (row.realizedPnL || 0);
    }
  });

  const realizedPnLTimelineArray = Object.keys(realizedPnLTimeline)
    .sort()
    .map(month => ({
      month,
      realizedPnL: Math.round(realizedPnLTimeline[month] * 100) / 100
    }));

  // 3. Multi-line P&L Chart (by grant year)
  const multiLinePnL = {};
  rows.forEach(row => {
    if (row.grantDate && row.isActive) {
      const year = new Date(row.grantDate).getFullYear();
      if (!multiLinePnL[year]) {
        multiLinePnL[year] = {
          year,
          rawUnrealizedPnL: 0,
          postTaxPnL: 0,
          inflationAdjustedPnL: 0
        };
      }
      multiLinePnL[year].rawUnrealizedPnL += row.unrealizedPnL || 0;
      multiLinePnL[year].postTaxPnL += row.postTaxPnL || 0;
      multiLinePnL[year].inflationAdjustedPnL += row.inflationAdjustedPnL || 0;
    }
  });

  const multiLinePnLArray = Object.values(multiLinePnL)
    .sort((a, b) => a.year - b.year)
    .map(item => ({
      year: item.year,
      rawUnrealizedPnL: Math.round(item.rawUnrealizedPnL * 100) / 100,
      postTaxPnL: Math.round(item.postTaxPnL * 100) / 100,
      inflationAdjustedPnL: Math.round(item.inflationAdjustedPnL * 100) / 100
    }));

  return {
    esopsPerYear: esopsPerYearArray,
    realizedPnLTimeline: realizedPnLTimelineArray,
    multiLinePnL: multiLinePnLArray
  };
}

module.exports = {
  computeEsopAnalytics
};

