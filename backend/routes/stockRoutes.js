const express = require('express');
const router = express.Router();
const { getStockPrice, getHistoricalPrices } = require('../services/stockService');

// Get historical stock prices - this must come first to avoid being captured by /:ticker route
router.get('/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { from, to } = req.query;
  
  // Default dates if not provided
  const fromDate = from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year ago
  const toDate = to || new Date().toISOString().split('T')[0]; // Today
  
  try {
    const historicalData = await getHistoricalPrices(symbol, fromDate, toDate);
    if (historicalData && historicalData.length) {
      res.json({
        symbol,
        historical: historicalData
      });
    } else {
      res.status(404).json({ message: 'Historical data not found' });
    }
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    res.status(500).json({ message: 'Failed to fetch historical data', error: error.message });
  }
});

// Get current stock price - this must come after more specific routes
router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  
  try {
    const price = await getStockPrice(ticker);
    if (price !== null) {
      res.json({ ticker, price });
    } else {
      res.status(404).json({ message: 'Stock price not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stock price', error: error.message });
  }
});

module.exports = router;
