// services/marketDataService.js
// Unified market data utilities powered by Financial Modeling Prep (FMP) with Yahoo Finance fallbacks.

const axios = require('axios');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

const fmp = axios.create({
  baseURL: FMP_BASE_URL,
  timeout: 8000,
});

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

const MARKET_PERFORMER_SYMBOLS = {
  us: {
    equities: ['AAPL', 'MSFT', 'NVDA', 'META', 'VTI'],
    bonds: ['IEF', 'TLT', 'BND', 'LQD'],
    etfs: ['QQQ', 'XLK', 'XLV', 'SMH'],
    commodities: ['GC=F', 'SI=F', 'CL=F', 'NG=F'],
    tradingAlgos: ['TQQQ', 'UPRO', 'QLD'],
  },
  india: {
    equities: ['RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS', 'TCS.NS', 'LT.NS'],
    bonds: ['GILT5Y.NS', 'JUNIORBEES.NS', 'LIQUIDBEES.NS'],
    etfs: ['NIFTYBEES.NS', 'BANKBEES.NS', 'MIDCAPETF.NS'],
    commodities: ['GOLD.NS', 'SILVER.NS', 'COPPER.NS'],
    tradingAlgos: ['MON100.NS', 'MOMENTUM.NS', 'ALPHA50.NS'],
  },
};

const SYMBOL_LABELS = {
  'GC=F': 'Gold Futures',
  'SI=F': 'Silver Futures',
  'CL=F': 'Crude Oil Futures',
  'NG=F': 'Natural Gas Futures',
  'GILT5Y.NS': 'India 5Y Gilt ETF',
  'JUNIORBEES.NS': 'Nippon India Junior BeES',
  'LIQUIDBEES.NS': 'Liquid BeES',
  'NIFTYBEES.NS': 'Nippon India Nifty BeES',
  'BANKBEES.NS': 'Nippon India Bank BeES',
  'MIDCAPETF.NS': 'Motilal Oswal Midcap ETF',
  'GOLD.NS': 'Gold ETF (India)',
  'SILVER.NS': 'Silver ETF (India)',
  'COPPER.NS': 'Copper ETF (India)',
  'MON100.NS': 'Motilal Nasdaq 100 ETF',
  'MOMENTUM.NS': 'ICICI Momentum ETF',
  'ALPHA50.NS': 'Nippon Alpha 50 ETF',
};

const CATEGORY_LABELS = {
  equities: 'Equities',
  bonds: 'Bonds & Debt',
  etfs: 'ETF Momentum',
  commodities: 'Commodities',
  tradingAlgos: 'High-Beta / Algo Plays',
};

function buildCacheKey(type, payload) {
  return `${type}:${JSON.stringify(payload)}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { value, timestamp: Date.now() });
  return value;
}

async function fmpRequest(endpoint, params = {}) {
  if (!FMP_API_KEY) {
    throw new Error('FINANCIAL_MODELING_PREP_API_KEY is not configured');
  }
  try {
    const response = await fmp.get(endpoint, {
      params: { ...params, apikey: FMP_API_KEY },
    });
    
    // FMP returns specific error formats we should check
    if (response.data && response.data.Error) {
      throw new Error(`FMP API error: ${response.data.Error}`);
    }
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error('[marketDataService] FMP API key invalid or expired. Check your FINANCIAL_MODELING_PREP_API_KEY in .env');
    }
    throw error;
  }
}

async function fetchFmpHistory(symbol, { from, to }) {
  const fromDate = new Date(from).toISOString().split('T')[0];
  const toDate = new Date(to).toISOString().split('T')[0];
  const data = await fmpRequest(`/historical-price-full/${symbol}`, { from: fromDate, to: toDate });
  if (!data || !Array.isArray(data.historical)) {
    throw new Error(`FMP history fetch failed for ${symbol}`);
  }
  return data.historical.map(item => ({
    time: new Date(item.date).getTime(),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
  }));
}

async function fetchYahooHistory(symbol, { from, to }) {
  try {
    const queryOptions = {
      period1: new Date(from),
      period2: new Date(to),
      interval: '1d',
    };
    const result = await yahooFinance.chart(symbol, queryOptions);
    if (!result.quotes || !result.quotes.length) {
      throw new Error(`No quotes returned for ${symbol}`);
    }
    return result.quotes.map(quote => ({
      time: new Date(quote.timestamp * 1000).getTime(),
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      volume: quote.volume,
    }));
  } catch (error) {
    console.error(`[marketDataService] Yahoo chart fetch failed for ${symbol}:`, error.message);
    throw error;
  }
}

async function getHistoricalSeries(symbol, { from, to }) {
  const range = {
    from: from || new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
    to: to || new Date(),
  };
  const key = buildCacheKey('history', { symbol, from: range.from.toISOString(), to: range.to.toISOString() });
  const cached = getCached(key);
  if (cached) return cached;

  // Use Yahoo Finance directly
  console.log(`[marketDataService] Fetching historical data for ${symbol} using Yahoo Finance`);
  try {
    const series = await fetchYahooHistory(symbol, range);
    return setCached(key, series);
  } catch (error) {
    console.error(`[marketDataService] Yahoo history fetch failed for ${symbol}:`, error.message);
    // Return empty series if both APIs fail
    return [];
  }
}

async function fetchFmpQuote(symbols) {
  const symbolString = symbols.join(',');
  const data = await fmpRequest(`/quote/${symbolString}`);
  if (!Array.isArray(data)) {
    throw new Error('Invalid FMP quote response');
  }
  const quotes = {};
  data.forEach(q => {
    quotes[q.symbol] = {
      symbol: q.symbol,
      price: q.price,
      change: q.change,
      changesPercentage: q.changesPercentage,
      previousClose: q.previousClose,
      dayLow: q.dayLow,
      dayHigh: q.dayHigh,
      timestamp: q.timestamp * 1000,
    };
  });
  return quotes;
}

async function getRealTimeQuotes(symbols = []) {
  const uniqueSymbols = [...new Set(symbols.filter(Boolean))];
  if (!uniqueSymbols.length) return {};

  // Use Yahoo Finance directly instead of trying FMP first
  console.log(`[marketDataService] Fetching quotes for ${uniqueSymbols.length} symbols using Yahoo Finance`);
  const quotes = {};
  await Promise.all(uniqueSymbols.map(async symbol => {
    try {
      const quote = await yahooFinance.quote(symbol);
      quotes[symbol] = {
        symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changesPercentage: quote.regularMarketChangePercent,
        previousClose: quote.regularMarketPreviousClose,
        dayLow: quote.regularMarketDayLow,
        dayHigh: quote.regularMarketDayHigh,
        timestamp: quote.regularMarketTime * 1000,
      };
      // Cache the quote
      setCached(buildCacheKey('quote', symbol), quotes[symbol]);
    } catch (yahooErr) {
      console.error(`[marketDataService] Yahoo quote failed for ${symbol}:`, yahooErr.message);
    }
  }));
  return quotes;
}

async function getInflationRate(region) {
  // FMP does not have a direct CPI endpoint like Finnhub. Using a fallback.
  return region === 'india' ? 6.0 : 3.5;
}

/**
 * UNIFIED INVESTMENT-BASED PnL MODEL
 * PRD Version 1.0 - Approved Model A
 * 
 * Core Principles:
 * 1. PnL = (current_price OR sale_price - exercise_price) × quantity
 * 2. Unrealized PnL CAN be negative (allows downside)
 * 3. Realized PnL ONLY from actual sales (not mark-to-market on exercised)
 * 4. Cost basis = exercise_price × quantity
 * 5. No intrinsic value calculations
 * 
 * Status Handling:
 * - Vested/Unvested: unrealized PnL (current - exercise) × vested_qty
 * - Exercised (not sold): unrealized PnL (current - exercise) × qty
 * - Sold: realized PnL (sale_price - exercise) × qty
 */
function calculatePortfolioPerformance(holdings, quotes) {
  let totalValue = 0;
  let totalCost = 0;
  let totalUnrealizedPnL = 0;  // Can be positive OR negative
  let totalRealizedPnL = 0;    // Only from actual sales
  const symbolPerformance = {};

  (holdings || []).forEach((holding) => {
    const ticker = holding.ticker;
    const shares = holding.vested || 0;
    const status = holding.status || 'Vested';
    const exercisePrice = holding.exercisePrice || holding.strikePrice || 0;
    const salePrice = holding.salePrice || null;  // Only set if actually sold

    if (ticker && quotes[ticker] && shares > 0) {
      const quote = quotes[ticker];
      const currentPrice = Number(quote.price || 0);
      const previousClose = Number(quote.previousClose || currentPrice);

      const value = currentPrice * shares;
      const dayChange = (currentPrice - previousClose) * shares;
      const dayChangePercentage = previousClose > 0 
        ? ((currentPrice - previousClose) / previousClose) * 100 
        : 0;

      let cost = exercisePrice * shares;  // Always track cost basis
      let realizedPnL = 0;
      let unrealizedPnL = 0;
      let pnl = 0;
      let pnlPercentage = 0;

      // UNIFIED MODEL: Determine PnL based on status
      if (status === 'Sold' && salePrice !== null && salePrice > 0) {
        // REALIZED: Actual sale happened
        realizedPnL = (salePrice - exercisePrice) * shares;
        pnl = realizedPnL;
        pnlPercentage = cost > 0 ? (realizedPnL / cost) * 100 : 0;
        totalCost += cost;
        totalRealizedPnL += realizedPnL;
      } else if (status === 'Sold' && (!salePrice || salePrice === 0)) {
        // FALLBACK: Sold but no sale price - use current as estimate
        realizedPnL = (currentPrice - exercisePrice) * shares;
        pnl = realizedPnL;
        pnlPercentage = cost > 0 ? (realizedPnL / cost) * 100 : 0;
        totalCost += cost;
        totalRealizedPnL += realizedPnL;
      } else {
        // UNREALIZED: Vested/Unvested/Exercised but not sold yet
        // PnL = (current - exercise) × shares — CAN BE NEGATIVE
        unrealizedPnL = (currentPrice - exercisePrice) * shares;
        pnl = unrealizedPnL;
        pnlPercentage = cost > 0 ? (unrealizedPnL / cost) * 100 : 0;
        totalCost += cost;
        totalUnrealizedPnL += unrealizedPnL;
      }

      totalValue += value;

      symbolPerformance[ticker] = {
        price: currentPrice,
        previousClose,
        shares,
        value,
        cost,
        pnl,
        pnlPercentage,
        realizedPnL,
        unrealizedPnL,
        dayChange,
        dayChangePercentage,
        status,
      };
    }
  });

  // UNIFIED TOTALS
  const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
  const pnlPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,              // exercise_price × all shares
    totalPnL,               // realized + unrealized
    totalRealizedPnL,       // only from sales
    totalUnrealizedPnL,     // can be negative
    pnlPercentage,          // total return %
    symbolPerformance,
    lastUpdated: new Date(),
  };
}

function computeCAGR(series, years) {
  if (!series.length || years <= 0) return null;
  const first = series[0].close;
  const last = series[series.length - 1].close;
  if (!first || first <= 0 || !last) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function computeAnnualizedVolatility(series) {
  if (series.length < 2) return null;
  const logReturns = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].close;
    const curr = series[i].close;
    if (!prev || !curr) continue;
    logReturns.push(Math.log(curr / prev));
  }
  if (!logReturns.length) return null;
  const mean = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length;
  const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / logReturns.length;
  const dailyVol = Math.sqrt(variance);
  return dailyVol * Math.sqrt(252) * 100;
}

function computeSharpeRatio(cagr, volatility, riskFreeRate = 0) {
  if (volatility === null || volatility === 0 || cagr === null) return null;
  const excess = cagr - riskFreeRate;
  return excess / volatility;
}

async function buildBenchmarkStats(symbol, { years = 10, riskFreeRate = 0 }) {
  const series = await getHistoricalSeries(symbol, {});
  if (!series.length) {
    return null;
  }

  const now = Date.now();
  const summary = {};
  const horizons = [1, 3, 5, 10];
  horizons.forEach((yr) => {
    const cutoff = now - yr * 365 * 24 * 60 * 60 * 1000;
    const subset = series.filter((row) => row.time >= cutoff);
    if (subset.length > 1) {
      summary[`year${yr}`] = computeCAGR(subset, yr);
    }
  });

  const volatility = computeAnnualizedVolatility(series);
  const cagr = computeCAGR(series, years);
  const sharpe = computeSharpeRatio(cagr, volatility, riskFreeRate);

  return {
    symbol,
    cagr,
    volatility,
    sharpe,
    returns: summary,
  };
}

async function calculateBenchmarkStats(region = 'us') {
  // Define benchmark symbols based on region
  const benchmarkSymbols = {
    'us': ['^GSPC', '^IXIC'], // S&P 500, NASDAQ
    'india': ['^BSESN', '^NSEI']  // BSE SENSEX, NIFTY 50
  };

  const primarySymbol = benchmarkSymbols[region][0];
  const secondarySymbol = benchmarkSymbols[region][1];

  try {
    // Fetch 10 years of data for benchmarks
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 10);
    
    const primaryData = await getHistoricalSeries(primarySymbol, {
      from: fromDate,
      to: new Date()
    }).catch(() => null);

    const secondaryData = await getHistoricalSeries(secondarySymbol, {
      from: fromDate,
      to: new Date()
    }).catch(() => null);

    // Calculate metrics for primary benchmark
    let primaryMetrics = calculateMarketMetrics(primaryData);
    let secondaryMetrics = calculateMarketMetrics(secondaryData);

    return {
      benchmarks: {
        primary: {
          symbol: primarySymbol,
          name: primarySymbol === '^GSPC' ? 'S&P 500' : 
                primarySymbol === '^BSESN' ? 'BSE SENSEX' : primarySymbol,
          cagr: primaryMetrics.cagr,
          volatility: primaryMetrics.volatility,
          data: primaryData ? primaryData.slice(-252) : [], // Last year of daily data
          returns: {
            '1y': primaryMetrics.returns['1y'],
            '3y': primaryMetrics.returns['3y'],
            '5y': primaryMetrics.returns['5y'],
            '10y': primaryMetrics.returns['10y']
          }
        },
        secondary: {
          symbol: secondarySymbol,
          name: secondarySymbol === '^IXIC' ? 'NASDAQ' : 
                secondarySymbol === '^NSEI' ? 'NIFTY 50' : secondarySymbol,
          cagr: secondaryMetrics.cagr,
          volatility: secondaryMetrics.volatility,
          data: secondaryData ? secondaryData.slice(-252) : [], // Last year of daily data
          returns: {
            '1y': secondaryMetrics.returns['1y'],
            '3y': secondaryMetrics.returns['3y'],
            '5y': secondaryMetrics.returns['5y'],
            '10y': secondaryMetrics.returns['10y']
          }
        }
      },
      primaryAvailable: !!primaryData,
      secondaryAvailable: !!secondaryData,
      expectedCAGR: primaryMetrics.cagr // Use CAGR as expected return
    };
  } catch (error) {
    console.error('[marketDataService] Error calculating benchmark stats:', error);
    return {
      primaryAvailable: false,
      secondaryAvailable: false,
      expectedCAGR: 10, // Default expected CAGR
      benchmarks: {
        primary: { symbol: primarySymbol, cagr: 10, volatility: 15, returns: { '1y': 10, '3y': 30, '5y': 50, '10y': 100 } },
        secondary: { symbol: secondarySymbol, cagr: 12, volatility: 18, returns: { '1y': 12, '3y': 36, '5y': 60, '10y': 120 } }
      }
    };
  }
}

// Helper function to calculate market metrics from historical data
function calculateMarketMetrics(data) {
  // Default values if data is missing
  if (!data || data.length < 252) { // At least 1 year of data
    return {
      cagr: 10,
      volatility: 15,
      returns: { '1y': 10, '3y': 30, '5y': 50, '10y': 100 }
    };
  }

  // Calculate daily returns
  const dailyReturns = [];
  for (let i = 1; i < data.length; i++) {
    dailyReturns.push((data[i].close / data[i-1].close) - 1);
  }

  // Calculate annualized volatility
  const stdDev = Math.sqrt(
    dailyReturns.reduce((sum, val) => sum + Math.pow(val - (dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length), 2), 0) 
    / dailyReturns.length
  );
  const annualizedVolatility = stdDev * Math.sqrt(252) * 100; // Convert to percentage

  // Calculate CAGR
  const firstPrice = data[0].close;
  const lastPrice = data[data.length - 1].close;
  const years = data.length / 252; // Approximate trading days per year
  const cagr = (Math.pow(lastPrice / firstPrice, 1 / years) - 1) * 100; // Convert to percentage

  // Calculate period returns
  const returns = {};
  returns['1y'] = data.length >= 252 ? ((data[data.length - 1].close / data[data.length - 252].close) - 1) * 100 : cagr;
  returns['3y'] = data.length >= 756 ? ((data[data.length - 1].close / data[data.length - 756].close) - 1) * 100 : returns['1y'] * 3;
  returns['5y'] = data.length >= 1260 ? ((data[data.length - 1].close / data[data.length - 1260].close) - 1) * 100 : returns['1y'] * 5;
  returns['10y'] = data.length >= 2520 ? ((data[data.length - 1].close / data[data.length - 2520].close) - 1) * 100 : returns['1y'] * 10;

  return {
    cagr,
    volatility: annualizedVolatility,
    returns
  };
}

async function calculateSymbolPerformance(symbol, quotes = {}) {
  const now = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const history = await getHistoricalSeries(symbol, { from, to: now });
  if (!history || !history.length) {
    return null;
  }

  const first = history[0]?.close;
  const last = history[history.length - 1]?.close;
  if (!first || !last || first <= 0) {
    return null;
  }

  const returnPct = ((last - first) / first) * 100;
  const volatility = computeAnnualizedVolatility(history);
  const quote = quotes[symbol];
  const inferredCurrency = /\.NS$|\.BO$/i.test(symbol) ? 'INR' : 'USD';

  return {
    symbol,
    name: SYMBOL_LABELS[symbol] || symbol,
    price: quote?.price ?? last ?? null,
    changePercent: quote?.changesPercentage ?? null,
    return1y: Number(returnPct.toFixed(2)),
    volatility: volatility ? Number(volatility.toFixed(2)) : null,
    currency: inferredCurrency,
  };
}

async function getMarketOutperformers(region = 'us') {
  const config = MARKET_PERFORMER_SYMBOLS[region] || MARKET_PERFORMER_SYMBOLS.us;
  const allSymbols = [...new Set(Object.values(config).flat())];
  const quotes = await getRealTimeQuotes(allSymbols);

  const categories = {};

  for (const [category, symbols] of Object.entries(config)) {
    const items = [];
    for (const symbol of symbols) {
      try {
        const perf = await calculateSymbolPerformance(symbol, quotes);
        if (perf) {
          items.push(perf);
        }
      } catch (error) {
        console.error(`[marketDataService] Unable to compute performance for ${symbol}:`, error.message);
      }
    }

    categories[category] = {
      label: CATEGORY_LABELS[category] || category,
      items: items
        .sort((a, b) => (b.return1y ?? -Infinity) - (a.return1y ?? -Infinity))
        .slice(0, 3),
    };
  }

  return {
    region,
    currency: region === 'india' ? 'INR' : 'USD',
    categories,
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = {
  getRealTimeQuotes,
  getHistoricalSeries,
  buildBenchmarkStats,
  calculateBenchmarkStats,
  computeCAGR,
  computeAnnualizedVolatility,
  computeSharpeRatio,
  calculatePortfolioPerformance,
  getInflationRate,
  getMarketOutperformers,
};

