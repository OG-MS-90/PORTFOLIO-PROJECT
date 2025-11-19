const express = require('express');
const router = express.Router();
const { sendEmailReport, savePlan } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// Route: POST /api/reports/email
// Desc: Send report to user email
// Access: Protected (User must be logged in or have valid session)
router.post('/email', protect, sendEmailReport);

// Route: POST /api/reports/save
// Desc: Save plan to user profile
router.post('/save', protect, savePlan);

module.exports = router;
