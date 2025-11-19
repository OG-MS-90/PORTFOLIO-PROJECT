// services/analyticsService.js
// Builds analytics summary for a user's ESOP holdings using live/simulated market data

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

const {
  getRealTimeQuotes,
  calculatePortfolioPerformance,
  getHistoricalSeries,
  computeCAGR,
} = require('./marketDataService');

const REGION_PATTERNS = {
  india: [/\.NS$/i, /\.BO$/i, /^NSE:/i, /^BSE:/i, /-NSE$/i, /-BSE$/i],
};

const KNOWN_INDIAN_TICKERS = new Set([
  'INFY',
  'TCS',
  'HDFCBANK',
  'RELIANCE',
  'SBIN',
  'ICICIBANK',
  'BHARTIARTL',
  'ITC',
  'LT',
  'WIPRO',
]);

function inferRegionFromTicker(ticker = '') {
  const normalized = ticker.trim().toUpperCase();
  if (KNOWN_INDIAN_TICKERS.has(normalized)) {
    return 'india';
  }
  if (REGION_PATTERNS.india.some((regex) => regex.test(normalized))) {
    return 'india';
  }
  return 'us';
}

function calculateRegionExposureFromHoldings(holdings = []) {
  if (!holdings.length) {
    return { india: 0.5, us: 0.5 };
  }
  const totals = { india: 0, us: 0 };
  holdings.forEach((holding) => {
    const region = inferRegionFromTicker(holding.ticker);
    const basis = holding.vested || holding.quantity || 1;
    totals[region] += Math.abs(basis);
  });
  const total = totals.india + totals.us;
  if (!total) {
    return { india: 0.5, us: 0.5 };
  }
  return {
    india: Number((totals.india / total).toFixed(4)),
    us: Number((totals.us / total).toFixed(4)),
  };
}

async function buildSymbolHistoryInsights(tickers = []) {
  const horizons = [1, 3, 5, 10];
  const results = {};
  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const series = await getHistoricalSeries(ticker, {});
        if (!series.length) return;
        const now = Date.now();
        const returns = {};
        horizons.forEach((years) => {
          const cutoff = now - years * 365 * 24 * 60 * 60 * 1000;
          const subset = series.filter((point) => point.time >= cutoff);
          const cagr = computeCAGR(subset, years);
          if (cagr !== null && !Number.isNaN(cagr)) {
            returns[`year${years}`] = Number(cagr.toFixed(2));
          }
        });
        const totalCagr = computeCAGR(series, Math.min(10, horizons[horizons.length - 1]));
        results[ticker] = {
          returns,
          totalCagr,
        };
      } catch (error) {
        console.warn('[analyticsService] Failed to fetch history for', ticker, error.message);
      }
    })
  );
  return results;
}

/**
 * Normalize ESOP mongoose docs into holdings for unified PnL model
 * 
 * Maps ESOP records to holdings structure with:
 * - exercisePrice: cost basis for PnL calculation
 * - salePrice: actual sale price (null if not sold)
 * - status: determines realized vs unrealized
 */
function mapEsopToHoldings(esopDocs = []) {
  return esopDocs
    .map((doc) => {
      const ticker = doc.ticker;
      const vested =
        typeof doc.vested === 'number'
          ? doc.vested
          : (doc.quantity || 0);
      const status = doc.status || 'Vested';
      const strikePrice = doc.strikePrice || doc.exercisePrice || doc.price || 0;
      const exercisePrice = doc.exercisePrice || doc.price || strikePrice || 0;
      
      // Sale price only populated for sold shares
      const salePrice = (status === 'Sold' && doc.salePrice) 
        ? Number(doc.salePrice) 
        : null;

      return { 
        ticker, 
        vested, 
        status, 
        strikePrice,    // kept for backward compatibility
        exercisePrice,  // primary cost basis
        salePrice       // null unless actually sold
      };
    })
    .filter((h) => h.ticker && h.vested > 0);
}

/**
 * Build a high-level analytics summary for ESOP portfolio
 * @param {Object} userGoals - financial goals from the planning form
 * @param {Array} esopDocs - ESOP mongoose docs for the user
 * @returns {Promise<Object|null>} analyticsSummary
 */
async function buildAnalyticsSummary(userGoals, esopDocs) {
  try {
    const holdings = mapEsopToHoldings(esopDocs);
    const uniqueTickers = [...new Set(holdings.map((h) => h.ticker).filter(Boolean))];

    let quotes = {};
    if (uniqueTickers.length > 0) {
      quotes = await getRealTimeQuotes(uniqueTickers);
    }

    const [portfolio, historyInsights] = await Promise.all([
      calculatePortfolioPerformance(holdings, quotes),
      buildSymbolHistoryInsights(uniqueTickers),
    ]);

    const perfEntries = Object.entries(portfolio.symbolPerformance || {});
    perfEntries.sort((a, b) => b[1].value - a[1].value);

    const topPositions = perfEntries.slice(0, 3).map(([ticker, perf]) => ({
      ticker,
      value: perf.value,
      pnlPercentage: perf.pnlPercentage,
      weight: portfolio.totalValue > 0 ? (perf.value / portfolio.totalValue) * 100 : 0,
    }));

    const highConcentration = topPositions.length > 0 && topPositions[0].weight > 40;
    const underDiversified = perfEntries.length <= 2;

    const totalVestedShares = holdings.reduce((sum, h) => sum + (h.vested || 0), 0);
    const totalUnvestedShares = (esopDocs || []).reduce((sum, doc) => sum + (doc.unvested || 0), 0);

    const regionExposure = calculateRegionExposureFromHoldings(holdings);

    const averageCurrentPrice = totalVestedShares > 0
      ? portfolio.totalValue / totalVestedShares
      : null;

    const averageExercisePrice = totalVestedShares > 0
      ? portfolio.totalCost / totalVestedShares
      : null;

    const analyticsSummary = {
      esopOverview: {
        totalValue: portfolio.totalValue,
        totalCost: portfolio.totalCost,
        totalPnL: portfolio.totalPnL,
        // UNIFIED MODEL: Realized from sales, Unrealized from holdings (can be negative)
        totalRealizedPnL: portfolio.totalRealizedPnL,
        totalUnrealizedPnL: portfolio.totalUnrealizedPnL,  // Changed from totalUnrealizedGain
        pnlPercentage: portfolio.pnlPercentage,
        totalPositions: perfEntries.length,
        totalVestedShares,
        totalUnvestedShares,
        averageCurrentPrice,
        averageExercisePrice,
        topPositions,
        lastUpdated: portfolio.lastUpdated,
      },
      symbolPerformance: Object.keys(portfolio.symbolPerformance || {}).reduce((acc, ticker) => {
        acc[ticker] = {
          ...portfolio.symbolPerformance[ticker],
          history: historyInsights[ticker]?.returns || {},
          cagr10Y: historyInsights[ticker]?.totalCagr ?? null,
        };
        return acc;
      }, {}),
      riskFlags: {
        highConcentration,
        topConcentrationTickers: topPositions.map((p) => p.ticker),
        underDiversified,
      },
      regionExposure,
      meta: {
        generatedAt: new Date().toISOString(),
        planningRegion: userGoals.planningRegion || 'india',
      },
    };

    return analyticsSummary;
  } catch (error) {
    console.error('[analyticsService] Failed to build analytics summary:', error);
    return null;
  }
}

module.exports = {
  buildAnalyticsSummary,
};

