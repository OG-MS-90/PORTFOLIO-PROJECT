// services/dataProviders/regionDetector.js
// Auto-detect region (India/USA) from ticker format
// Validates that all tickers belong to the same region

const YahooFinance = require('yahoo-finance2').default;

// Known patterns for different exchanges
const REGION_PATTERNS = {
  india: {
    suffixes: ['.NS', '.BO'], // NSE and BSE
    prefixes: ['NSE:', 'BSE:'],
    exchanges: ['NSE', 'BSE', 'NSI', 'BOM']
  },
  usa: {
    suffixes: [], // US stocks typically don't have suffixes
    prefixes: ['NASDAQ:', 'NYSE:', 'AMEX:'],
    exchanges: ['NASDAQ', 'NYSE', 'AMEX', 'NYQ', 'NMS', 'PCX', 'ASE']
  }
};

// Known Indian companies by ticker (without suffix)
const KNOWN_INDIAN_TICKERS = new Set([
  'INFY', 'TCS', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'SBIN',
  'BHARTIARTL', 'ITC', 'LT', 'WIPRO', 'AXISBANK', 'KOTAKBANK',
  'HINDUNILVR', 'ASIANPAINT', 'MARUTI', 'TITAN', 'BAJFINANCE',
  'SUNPHARMA', 'NESTLEIND', 'ULTRACEMCO', 'TECHM', 'HCLTECH',
  'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA', 'GRASIM', 'JSWSTEEL',
  'TATASTEEL', 'HINDALCO', 'ADANIPORTS', 'M&M', 'BAJAJFINSV',
  'TATAMOTORS', 'DIVISLAB', 'DRREDDY', 'CIPLA', 'EICHERMOT',
  'BRITANNIA', 'SHREECEM', 'BPCL', 'IOC', 'HEROMOTOCO'
]);

// Known US companies by ticker
const KNOWN_US_TICKERS = new Set([
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'FB',
  'NVDA', 'BRK.B', 'BRK.A', 'V', 'JNJ', 'WMT', 'JPM', 'MA',
  'PG', 'UNH', 'DIS', 'HD', 'BAC', 'XOM', 'ADBE', 'NFLX',
  'CRM', 'CSCO', 'PFE', 'KO', 'ABT', 'TMO', 'COST', 'MRK',
  'AVGO', 'NKE', 'INTC', 'WFC', 'DHR', 'VZ', 'CMCSA', 'TXN',
  'QCOM', 'UPS', 'NEE', 'AMD', 'PM', 'HON', 'ORCL', 'LIN',
  'BMY', 'IBM', 'INTU', 'BA', 'GE', 'SBUX', 'CAT', 'PYPL'
]);

/**
 * Detect region from a single ticker
 * @param {string} ticker - Stock ticker symbol
 * @returns {string} 'india' or 'usa'
 */
function detectRegionFromTicker(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    throw new Error('Invalid ticker: must be a non-empty string');
  }

  const normalized = ticker.trim().toUpperCase();

  // Check Indian patterns
  for (const suffix of REGION_PATTERNS.india.suffixes) {
    if (normalized.endsWith(suffix.toUpperCase())) {
      return 'india';
    }
  }

  for (const prefix of REGION_PATTERNS.india.prefixes) {
    if (normalized.startsWith(prefix.toUpperCase())) {
      return 'india';
    }
  }

  // Check base ticker (without suffix) against known Indian tickers
  const baseTicker = normalized.split('.')[0].split(':')[0];
  if (KNOWN_INDIAN_TICKERS.has(baseTicker)) {
    return 'india';
  }

  // Check US patterns
  for (const suffix of REGION_PATTERNS.usa.suffixes) {
    if (normalized.endsWith(suffix.toUpperCase())) {
      return 'usa';
    }
  }

  for (const prefix of REGION_PATTERNS.usa.prefixes) {
    if (normalized.startsWith(prefix.toUpperCase())) {
      return 'usa';
    }
  }

  // Check known US tickers
  if (KNOWN_US_TICKERS.has(baseTicker)) {
    return 'usa';
  }

  // Default: If no suffix and not in known lists, likely US
  // US stocks typically don't have suffixes
  if (!normalized.includes('.') && !normalized.includes(':')) {
    return 'usa';
  }

  // If we still can't determine, default to USA
  // (Most global tickers without suffixes are US-based)
  return 'usa';
}

/**
 * Detect region from a ticker using Yahoo Finance metadata (fallback)
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<string>} 'india' or 'usa'
 */
async function detectRegionFromMetadata(ticker) {
  try {
    const quote = await YahooFinance.quote(ticker);
    
    if (quote && quote.exchange) {
      const exchange = quote.exchange.toUpperCase();
      
      // Check if exchange matches Indian exchanges
      if (REGION_PATTERNS.india.exchanges.some(ex => exchange.includes(ex))) {
        return 'india';
      }
      
      // Check if exchange matches US exchanges
      if (REGION_PATTERNS.usa.exchanges.some(ex => exchange.includes(ex))) {
        return 'usa';
      }
    }

    // Check currency as additional indicator
    if (quote && quote.currency) {
      const currency = quote.currency.toUpperCase();
      if (currency === 'INR') return 'india';
      if (currency === 'USD') return 'usa';
    }

    // Fallback to pattern-based detection
    return detectRegionFromTicker(ticker);
  } catch (error) {
    console.warn(`[regionDetector] Metadata lookup failed for ${ticker}, using pattern detection`);
    return detectRegionFromTicker(ticker);
  }
}

/**
 * Detect region from an array of tickers and validate consistency
 * @param {Array<string>} tickers - Array of ticker symbols
 * @param {boolean} useMetadata - Whether to use metadata lookup (slower but more accurate)
 * @returns {Promise<Object>} Detection result with region and validation status
 */
async function detectAndValidateRegion(tickers, useMetadata = false) {
  if (!Array.isArray(tickers) || tickers.length === 0) {
    throw new Error('Tickers array must be non-empty');
  }

  const detections = {};
  const regionCounts = { india: 0, usa: 0 };

  // Detect region for each ticker
  for (const ticker of tickers) {
    let region;
    
    if (useMetadata) {
      region = await detectRegionFromMetadata(ticker);
    } else {
      region = detectRegionFromTicker(ticker);
    }

    detections[ticker] = region;
    regionCounts[region]++;
  }

  // Determine dominant region
  const totalTickers = tickers.length;
  const indiaPercentage = (regionCounts.india / totalTickers) * 100;
  const usaPercentage = (regionCounts.usa / totalTickers) * 100;

  // Check for mixed regions
  const isMixed = regionCounts.india > 0 && regionCounts.usa > 0;
  const dominantRegion = regionCounts.india > regionCounts.usa ? 'india' : 'usa';

  // Validation result
  const result = {
    region: dominantRegion,
    isValid: !isMixed,
    isMixed,
    detections,
    summary: {
      totalTickers,
      indiaTickers: regionCounts.india,
      usaTickers: regionCounts.usa,
      indiaPercentage: Math.round(indiaPercentage),
      usaPercentage: Math.round(usaPercentage)
    },
    errors: []
  };

  // Generate error messages for mixed regions
  if (isMixed) {
    result.errors.push({
      code: 'MIXED_REGIONS',
      message: 'CSV contains tickers from multiple regions (India and USA)',
      details: `Found ${regionCounts.india} Indian tickers and ${regionCounts.usa} US tickers. All tickers in a CSV must be from the same region.`,
      indiaTickers: Object.keys(detections).filter(t => detections[t] === 'india'),
      usaTickers: Object.keys(detections).filter(t => detections[t] === 'usa')
    });
  }

  return result;
}

/**
 * Get currency for detected region
 * @param {string} region - 'india' or 'usa'
 * @returns {string} Currency code
 */
function getCurrencyForRegion(region) {
  const currencyMap = {
    'india': 'INR',
    'usa': 'USD',
    'us': 'USD'
  };
  return currencyMap[region.toLowerCase()] || 'USD';
}

/**
 * Get exchange name for region
 * @param {string} region - 'india' or 'usa'
 * @returns {string} Primary exchange name
 */
function getPrimaryExchangeForRegion(region) {
  const exchangeMap = {
    'india': 'NSE/BSE',
    'usa': 'NASDAQ/NYSE',
    'us': 'NASDAQ/NYSE'
  };
  return exchangeMap[region.toLowerCase()] || 'NASDAQ/NYSE';
}

/**
 * Custom error for mixed region detection
 */
class MarketMixingError extends Error {
  constructor(message, detectionResult) {
    super(message);
    this.name = 'MarketMixingError';
    this.code = 'MIXED_REGIONS';
    this.detectionResult = detectionResult;
  }
}

/**
 * Validate region consistency and throw error if mixed
 * @param {Array<string>} tickers - Array of ticker symbols
 * @param {boolean} useMetadata - Whether to use metadata lookup
 * @throws {MarketMixingError} If tickers are from mixed regions
 * @returns {Promise<Object>} Validated detection result
 */
async function validateRegionConsistency(tickers, useMetadata = false) {
  const result = await detectAndValidateRegion(tickers, useMetadata);

  if (!result.isValid) {
    const error = result.errors[0];
    throw new MarketMixingError(
      `${error.message}: ${error.details}`,
      result
    );
  }

  return result;
}

module.exports = {
  detectRegionFromTicker,
  detectRegionFromMetadata,
  detectAndValidateRegion,
  validateRegionConsistency,
  getCurrencyForRegion,
  getPrimaryExchangeForRegion,
  MarketMixingError
};

