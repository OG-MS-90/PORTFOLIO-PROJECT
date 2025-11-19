// routes/analyticsRoutes.js
// Analytics API Routes - ESOP Analytics Engine v2.0
// NO HARDCODED VALUES - All data fetched dynamically

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Papa = require('papaparse');
const fs = require('fs');
const { computeEsopAnalytics } = require('../services/esopAnalyticsEngine');
const { requireAuth } = require('../middleware/auth');
const Esop = require('../models/Esop');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `analytics-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

/**
 * POST /api/analytics/compute
 * Compute analytics from uploaded CSV
 * Accepts multipart/form-data with 'file' field
 */
router.post('/compute', upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    console.log('[analyticsRoutes] POST /analytics/compute - Starting');

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No CSV file uploaded',
        code: 'MISSING_FILE'
      });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (fileExtension !== '.csv') {
      return res.status(400).json({
        status: 'error',
        message: 'Only CSV files are accepted for analytics',
        code: 'INVALID_FILE_TYPE'
      });
    }

    console.log('[analyticsRoutes] Parsing CSV file:', req.file.originalname);

    // Parse CSV
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('[analyticsRoutes] CSV parsing errors:', parseResult.errors);
      return res.status(400).json({
        status: 'error',
        message: 'CSV parsing failed',
        code: 'CSV_PARSE_ERROR',
        errors: parseResult.errors
      });
    }

    const csvData = parseResult.data;

    if (!csvData || csvData.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'CSV file is empty',
        code: 'EMPTY_CSV'
      });
    }

    console.log(`[analyticsRoutes] Parsed ${csvData.length} rows from CSV`);

    // Validate CSV schema
    const requiredColumns = [
      'ticker', 'company', 'grantDate', 'vestingStartDate', 'vestingEndDate',
      'quantity', 'vested', 'strikePrice', 'exercisePrice', 'status', 'type'
    ];

    const headers = Object.keys(csvData[0]);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'CSV missing required columns',
        code: 'INVALID_SCHEMA',
        missingColumns
      });
    }

    // Compute analytics
    console.log('[analyticsRoutes] Computing analytics...');
    const analyticsResult = await computeEsopAnalytics(csvData);

    console.log('[analyticsRoutes] Analytics computation successful');
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('[analyticsRoutes] Failed to cleanup file:', cleanupError.message);
    }

    res.json({
      status: 'success',
      data: analyticsResult
    });

  } catch (error) {
    console.error('[analyticsRoutes] Error:', error);

    // Clean up file on error
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn('[analyticsRoutes] Failed to cleanup file on error');
      }
    }

    // Handle specific error types
    if (error.name === 'MarketMixingError') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        code: 'MIXED_REGIONS',
        details: error.detectionResult
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Analytics computation failed',
      code: 'ANALYTICS_ERROR'
    });
  }
});

/**
 * GET /api/analytics/from-db
 * Compute analytics from user's stored ESOP data
 * Requires authentication
 */
router.get('/from-db', requireAuth, async (req, res) => {
  try {
    console.log('[analyticsRoutes] GET /analytics/from-db - Starting');

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userId = req.user._id;
    console.log(`[analyticsRoutes] Fetching ESOP data for user: ${userId}`);

    // Fetch user's ESOP data from database
    const esopDocs = await Esop.find({ userId });

    if (!esopDocs || esopDocs.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No ESOP data found for user',
        code: 'NO_DATA'
      });
    }

    console.log(`[analyticsRoutes] Found ${esopDocs.length} ESOP records`);

    // Transform MongoDB docs to CSV-like format
    const csvData = esopDocs.map(doc => ({
      ticker: doc.ticker,
      company: doc.company,
      grantDate: doc.grantDate,
      vestingStartDate: doc.vestingStartDate,
      vestingEndDate: doc.vestingEndDate,
      quantity: doc.quantity || doc.totalGrants,
      vested: doc.vested,
      strikePrice: doc.strikePrice,
      exercisePrice: doc.exercisePrice || doc.strikePrice,
      currentPrice: doc.currentPrice || doc.fmv,
      status: doc.status,
      type: doc.type || doc.grantType,
      salePrice: doc.salePrice,
      saleDate: doc.soldDate || doc.exercisedDate,
      notes: doc.notes
    }));

    // Compute analytics
    console.log('[analyticsRoutes] Computing analytics from DB data...');
    const analyticsResult = await computeEsopAnalytics(csvData);

    console.log('[analyticsRoutes] Analytics computation successful');

    res.json({
      status: 'success',
      data: analyticsResult
    });

  } catch (error) {
    console.error('[analyticsRoutes] Error:', error);

    // Handle specific error types
    if (error.name === 'MarketMixingError') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        code: 'MIXED_REGIONS',
        details: error.detectionResult
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Analytics computation failed',
      code: 'ANALYTICS_ERROR'
    });
  }
});

/**
 * POST /api/analytics/validate-csv
 * Validate CSV schema and detect region without computing analytics
 */
router.post('/validate-csv', upload.single('file'), async (req, res) => {
  let filePath = null;

  try {
    console.log('[analyticsRoutes] POST /analytics/validate-csv - Starting');

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No CSV file uploaded',
        code: 'MISSING_FILE'
      });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (fileExtension !== '.csv') {
      return res.status(400).json({
        status: 'error',
        message: 'Only CSV files are accepted',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Parse CSV
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'CSV parsing failed',
        code: 'CSV_PARSE_ERROR',
        errors: parseResult.errors
      });
    }

    const csvData = parseResult.data;

    if (!csvData || csvData.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'CSV file is empty',
        code: 'EMPTY_CSV'
      });
    }

    // Validate schema
    const requiredColumns = [
      'ticker', 'company', 'grantDate', 'vestingStartDate', 'vestingEndDate',
      'quantity', 'vested', 'strikePrice', 'exercisePrice', 'status', 'type'
    ];

    const headers = Object.keys(csvData[0]);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    const extraColumns = headers.filter(col => !requiredColumns.includes(col) && col !== 'currentPrice' && col !== 'salePrice' && col !== 'saleDate' && col !== 'notes');

    // Detect region
    const { validateRegionConsistency } = require('../services/dataProviders/regionDetector');
    const tickers = csvData.map(row => row.ticker).filter(Boolean);
    const regionValidation = await validateRegionConsistency(tickers, false);

    // Clean up file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('[analyticsRoutes] Failed to cleanup file:', cleanupError.message);
    }

    res.json({
      status: 'success',
      validation: {
        isValid: missingColumns.length === 0 && regionValidation.isValid,
        rowCount: csvData.length,
        schema: {
          headers,
          missingColumns,
          extraColumns: extraColumns.length > 0 ? extraColumns : undefined
        },
        region: regionValidation
      }
    });

  } catch (error) {
    console.error('[analyticsRoutes] Validation error:', error);

    // Clean up file on error
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn('[analyticsRoutes] Failed to cleanup file on error');
      }
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'CSV validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
});

module.exports = router;

