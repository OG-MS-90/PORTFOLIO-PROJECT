const axios = require('axios');
require('dotenv').config();
const { getHistoricalSeries } = require('./marketDataService');

// Remove AlphaVantage and use our marketDataService instead
async function getStockPrice(ticker) {
  try {
    // Use marketDataService which handles fallbacks internally
    const quotes = await require('./marketDataService').getRealTimeQuotes([ticker]);
    if (quotes && quotes[ticker] && quotes[ticker].price) {
      return parseFloat(quotes[ticker].price);
    }
    
    // If no price, try a more basic approach
    const history = await getHistoricalSeries(ticker, {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
      to: new Date()
    });
    
    if (history && history.length > 0) {
      return parseFloat(history[history.length - 1].close);
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch stock price for ${ticker}:`, error);
    return null;
  }
}

// Get historical price data for a symbol
async function getHistoricalPrices(symbol, from, to) {
  try {
    console.log(`[stockService] Fetching historical prices for ${symbol} from ${from} to ${to}`);
    
    // Ensure we have valid dates
    let fromDate, toDate;
    try {
      // Handle cases where from might be invalid
      fromDate = from ? new Date(from) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      // Check if fromDate is valid
      if (isNaN(fromDate.getTime())) {
        fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
      
      // Handle cases where to might be invalid
      toDate = to ? new Date(to) : new Date();
      // Check if toDate is valid
      if (isNaN(toDate.getTime())) {
        toDate = new Date();
      }
    } catch (dateError) {
      console.error(`[stockService] Date parsing error:`, dateError);
      fromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      toDate = new Date();
    }
    
    console.log(`[stockService] Using date range: ${fromDate.toISOString()} - ${toDate.toISOString()}`);
    
    // Use marketDataService which already has caching and fallback
    const history = await getHistoricalSeries(symbol, { from: fromDate, to: toDate });
    
    // Convert to format expected by frontend
    const formattedHistory = history.map(item => {
      // Handle potential missing or NaN values
      return {
        date: new Date(item.time).toISOString().split('T')[0],
        open: isNaN(item.open) ? 0 : Number(item.open),
        high: isNaN(item.high) ? 0 : Number(item.high),
        low: isNaN(item.low) ? 0 : Number(item.low),
        close: isNaN(item.close) ? 0 : Number(item.close),
        volume: isNaN(item.volume) ? 0 : Number(item.volume)
      };
    });
    
    return formattedHistory;
  } catch (error) {
    console.error(`[stockService] Historical data fetch failed for ${symbol}:`, error);
    throw error;
  }
}

module.exports = { getStockPrice, getHistoricalPrices };
