const express = require('express');
const router = express.Router();
const { sendEmailReport, savePlan } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

// Route: POST /api/reports/email
// Desc: Send report to user email
// Access: Protected (User must be logged in or have valid session)
router.post('/email', requireAuth, sendEmailReport);

// Route: POST /api/reports/save
// Desc: Save plan to user profile
router.post('/save', requireAuth, savePlan);

module.exports = router;
