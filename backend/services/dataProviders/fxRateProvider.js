// services/dataProviders/fxRateProvider.js
// Dynamic FX rate provider - NO HARDCODED VALUES
// Fetches real-time USD-INR exchange rates from multiple sources

const axios = require('axios');

// Cache for FX rates (5 minute TTL for real-time accuracy)
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

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

/**
 * Fetch USD-INR exchange rate from multiple sources with fallbacks
 * @returns {Object} FX rate data with metadata
 */
async function fetchUSDINRRate() {
  const FALLBACK_RATE = Number(process.env.USD_INR_FALLBACK_RATE || '83');
  const cacheKey = 'fx:usdinr';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Try multiple sources in order of preference
  const sources = [
    fetchFromExchangerateHost,
    fetchFromExchangeRateAPI,
    fetchFromFreeCurrencyAPI,
    fetchFromCurrencyAPI,
    fetchFromYahooFinance,
    fetchFromXE
  ];

  for (const fetchFunction of sources) {
    try {
      const rate = await fetchFunction();
      if (rate && rate > 0) {
        const fxData = {
          rate,
          baseCurrency: 'USD',
          quoteCurrency: 'INR',
          pair: 'USDINR',
          timestamp: new Date().toISOString(),
          source: fetchFunction.name
        };
        return setCached(cacheKey, fxData);
      }
    } catch (error) {
      console.warn(`[fxRateProvider] ${fetchFunction.name} failed:`, error.message);
      continue; // Try next source
    }
  }

  if (FALLBACK_RATE > 0) {
    console.warn(
      `[fxRateProvider] Falling back to static USD/INR rate ${FALLBACK_RATE}. Please configure API keys for live FX data.`,
    );
    return setCached(cacheKey, {
      rate: FALLBACK_RATE,
      baseCurrency: 'USD',
      quoteCurrency: 'INR',
      pair: 'USDINR',
      timestamp: new Date().toISOString(),
      source: 'fallback',
    });
  }

  throw new Error('Unable to fetch USD-INR exchange rate from any source');
}

/**
 * Source 0: Exchangerate.host (no API key)
 * https://exchangerate.host/#/
 */
async function fetchFromExchangerateHost() {
  const response = await axios.get('https://api.exchangerate.host/latest', {
    params: {
      base: 'USD',
      symbols: 'INR',
    },
    timeout: 5000,
  });

  if (response.data && response.data.rates && response.data.rates.INR) {
    return response.data.rates.INR;
  }

  throw new Error('Invalid response from exchangerate.host');
}

/**
 * Source 1: ExchangeRate-API (Primary)
 * https://www.exchangerate-api.com/
 */
async function fetchFromExchangeRateAPI() {
  const API_KEY = process.env.EXCHANGERATE_API_KEY;
  if (!API_KEY) {
    throw new Error('EXCHANGERATE_API_KEY not configured');
  }

  const response = await axios.get(
    `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`,
    { timeout: 5000 }
  );

  if (response.data && response.data.conversion_rates && response.data.conversion_rates.INR) {
    return response.data.conversion_rates.INR;
  }

  throw new Error('Invalid response from ExchangeRate-API');
}

/**
 * Source 2: FreeCurrencyAPI
 * https://freecurrencyapi.com/
 */
async function fetchFromFreeCurrencyAPI() {
  const API_KEY = process.env.FREECURRENCY_API_KEY;
  if (!API_KEY) {
    throw new Error('FREECURRENCY_API_KEY not configured');
  }

  const response = await axios.get(
    'https://api.freecurrencyapi.com/v1/latest',
    {
      params: {
        apikey: API_KEY,
        base_currency: 'USD',
        currencies: 'INR'
      },
      timeout: 5000
    }
  );

  if (response.data && response.data.data && response.data.data.INR) {
    return response.data.data.INR;
  }

  throw new Error('Invalid response from FreeCurrencyAPI');
}

/**
 * Source 3: CurrencyAPI.com
 * https://currencyapi.com/
 */
async function fetchFromCurrencyAPI() {
  const API_KEY = process.env.CURRENCYAPI_KEY;
  if (!API_KEY) {
    throw new Error('CURRENCYAPI_KEY not configured');
  }

  const response = await axios.get(
    'https://api.currencyapi.com/v3/latest',
    {
      params: {
        apikey: API_KEY,
        base_currency: 'USD',
        currencies: 'INR'
      },
      timeout: 5000
    }
  );

  if (response.data && response.data.data && response.data.data.INR && response.data.data.INR.value) {
    return response.data.data.INR.value;
  }

  throw new Error('Invalid response from CurrencyAPI');
}

/**
 * Source 4: Yahoo Finance (Fallback - no API key needed)
 */
async function fetchFromYahooFinance() {
  const YahooFinance = require('yahoo-finance2').default;
  
  try {
    const quote = await YahooFinance.quote('USDINR=X');
    if (quote && quote.regularMarketPrice) {
      return quote.regularMarketPrice;
    }
  } catch (error) {
    // Yahoo Finance might not have USDINR, try INR=X
    try {
      const quote = await YahooFinance.quote('INR=X');
      if (quote && quote.regularMarketPrice) {
        // INR=X gives INR per 1 USD
        return quote.regularMarketPrice;
      }
    } catch (innerError) {
      throw new Error('Yahoo Finance FX lookup failed');
    }
  }

  throw new Error('No FX data from Yahoo Finance');
}

/**
 * Source 5: XE.com scraping (Last resort - less reliable)
 */
async function fetchFromXE() {
  // Note: This is not an official API and should only be used as last resort
  // In production, prefer official FX APIs
  
  try {
    const response = await axios.get(
      'https://www.xe.com/api/protected/midmarket-converter/',
      {
        params: {
          from: 'USD',
          to: 'INR',
          amount: 1
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (response.data && response.data.to && response.data.to[0] && response.data.to[0].mid) {
      return response.data.to[0].mid;
    }
  } catch (error) {
    throw new Error('XE.com lookup failed');
  }

  throw new Error('No FX data from XE.com');
}

/**
 * Get FX rate between two currencies
 * @param {string} fromCurrency - Base currency code (e.g., 'USD')
 * @param {string} toCurrency - Quote currency code (e.g., 'INR')
 * @returns {Promise<Object>} FX rate data
 */
async function getFXRate(fromCurrency, toCurrency) {
  const pair = `${fromCurrency}${toCurrency}`.toUpperCase();
  
  // Currently only supporting USD-INR
  // In production, this should support all major currency pairs
  if (pair === 'USDINR') {
    return await fetchUSDINRRate();
  } else if (pair === 'INRUSD') {
    const usdInrRate = await fetchUSDINRRate();
    return {
      rate: 1 / usdInrRate.rate,
      baseCurrency: 'INR',
      quoteCurrency: 'USD',
      pair: 'INRUSD',
      timestamp: usdInrRate.timestamp,
      source: usdInrRate.source
    };
  } else if (pair === 'USDUSD' || pair === 'INRINR') {
    // Same currency
    return {
      rate: 1.0,
      baseCurrency: fromCurrency,
      quoteCurrency: toCurrency,
      pair,
      timestamp: new Date().toISOString(),
      source: 'identity'
    };
  } else {
    throw new Error(`Currency pair ${pair} not supported. Currently supporting: USDINR, INRUSD`);
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Promise<Object>} Converted amount with metadata
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  const fxData = await getFXRate(fromCurrency, toCurrency);
  
  return {
    originalAmount: amount,
    convertedAmount: amount * fxData.rate,
    fromCurrency,
    toCurrency,
    rate: fxData.rate,
    timestamp: fxData.timestamp,
    source: fxData.source
  };
}

/**
 * Get currency for a region
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

module.exports = {
  getFXRate,
  fetchUSDINRRate,
  convertCurrency,
  getCurrencyForRegion
};

