// routes/csvRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { parseAndSaveEsopCSV } = require("../services/csvService");
const Esop = require('../models/Esop');
const { AuthenticationError, ValidationError } = require('../utils/errors');
const { uploadLimiter } = require('../middleware/security');
const { requireAuth } = require('../middleware/auth');
const { transformEsopData } = require('../middleware/dataTransformer');
const { validateCSV } = require('../middleware/csvValidator');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    console.log('====== CSV UPLOAD REQUEST ======');
    console.log('Upload request received');
    console.log('User authenticated:', !!req.user);
    console.log('File received:', !!req.file);

    if (!req.user) {
      console.log('ERROR: Authentication required');
      return res.status(401).json({ 
        status: 'error',
        message: "Authentication required" 
      });
    }

    if (!req.file) {
      console.log('ERROR: No file uploaded');
      return res.status(400).json({ 
        status: 'error',
        message: "No file uploaded" 
      });
    }

    // Allow CSV, XLS, and XLSX files
    const allowedTypes = ['.csv', '.xls', '.xlsx'];
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      console.log(`ERROR: Invalid file extension ${fileExtension}`);
      return res.status(400).json({ 
        status: 'error',
        message: "Only CSV, XLS, and XLSX files are allowed" 
      });
    }

    const userId = req.user._id;
    const filePath = req.file.path;

    console.log('Processing file:', req.file.originalname);
    console.log('File path:', filePath);
    console.log('User ID:', userId);
    
    // Before deletion, log the existing records count
    const existingCount = await Esop.countDocuments({ userId });
    console.log(`Found ${existingCount} existing records for deletion`);

    const result = await parseAndSaveEsopCSV(filePath, userId);
    
    // Confirm deletion and replacement worked by counting records again
    const finalCount = await Esop.countDocuments({ userId });
    console.log(`After upload completion, user has ${finalCount} records in database`);
    console.log(`Upload complete. Saved ${result.data.length} new records`);
    
    if (result.data.length > 0) {
      console.log('First record sample:', JSON.stringify(result.data[0]).substring(0, 300) + '...');
    }
    
    // Clean up uploaded file
    try {
      require('fs').unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }
    
    res.json({ 
      status: 'success',
      message: "CSV processed successfully", 
      data: result.data,
      recordsProcessed: result.data.length
    });
    console.log('====== CSV UPLOAD COMPLETE ======');
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process CSV file'
    });
  }
});

router.get('/data', requireAuth, transformEsopData, async (req, res, next) => {
  try {
    console.log('====== CSV DATA RETRIEVAL REQUEST ======');
    console.log("Data request received at: ", new Date().toISOString());
    console.log("User authenticated:", !!req.user);
    console.log("Session ID:", req.session?.id || 'No session ID');
    
    if (!req.user) {
      console.log("Unauthorized data request");
      return res.status(401).json({ 
        status: 'error', 
        message: 'Authentication required'
      });
    }

    const userId = req.user._id;
    console.log(`Fetching data for user: ${userId}`);
    
    // Sort by most recent first to ensure we're seeing new data
    const esopData = await Esop.find({ userId }).sort({ _id: -1 });
    console.log(`Found ${esopData.length} records`);
    
    if (esopData.length > 0) {
      console.log('First record sample:', JSON.stringify(esopData[0]).substring(0, 300) + '...');
      
      // Verify numeric fields
      const sampleRecord = esopData[0];
      console.log('Sample numeric fields:',
        `totalGrants=${typeof sampleRecord.totalGrants}(${sampleRecord.totalGrants}),`,
        `vested=${typeof sampleRecord.vested}(${sampleRecord.vested}),`,
        `unvested=${typeof sampleRecord.unvested}(${sampleRecord.unvested})`);
    } else {
      console.log('No records found');
    }
    
    // The transformEsopData middleware will convert numeric fields
    const responseData = {
      status: 'success',
      data: esopData,
      count: esopData.length,
      timestamp: new Date().toISOString() // Add timestamp to help debug caching issues
    };
    
    console.log('Sending response with data count:', esopData.length);
    console.log('====== CSV DATA RETRIEVAL COMPLETE ======');
    
    // Send response - the transformEsopData middleware will handle any necessary conversions
    res.json(responseData);
  } catch (error) {
    console.error("Error retrieving ESOP data:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve ESOP data'
    });
  }
});

module.exports = router;
