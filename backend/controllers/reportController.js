const nodemailer = require('nodemailer');
const Plan = require('../models/Plan');

// Configure transporter (mock for dev, real for prod)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * @desc    Send financial report via email
 * @route   POST /api/reports/email
 * @access  Private
 */
exports.sendEmailReport = async (req, res) => {
  try {
    const { email, planData, planId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Save Plan to DB (Upsert based on wealthManagerId)
    if (planId) {
      try {
        await Plan.findOneAndUpdate(
          { wealthManagerId: planId },
          {
            user: req.user ? req.user._id : null, // Link to user if authenticated
            wealthManagerId: planId,
            riskProfile: planData.riskProfile,
            projections: {
              successProbability: planData.headlineSuccessProbability
            },
            allocation: planData.allocation
          },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.error('Failed to save plan to DB:', dbError);
        // Continue sending email even if DB save fails
      }
    }

    // Create HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Financial Plan Summary</h2>
        <p>Plan ID: <strong>${planId || 'N/A'}</strong></p>
        
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Key Projections</h3>
          <ul style="padding-left: 20px;">
            <li><strong>Projected Growth:</strong> See attached PDF</li>
            <li><strong>Success Probability:</strong> ${planData?.headlineSuccessProbability || 0}%</li>
            <li><strong>Risk Profile:</strong> ${planData?.riskProfile || 'Medium'}</li>
          </ul>
        </div>

        <p>Please find your detailed wealth strategy attached (if generated).</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888;">
          This is an automated message from your Wealth Strategy Platform.
        </p>
      </div>
    `;

    // Send mail
    const info = await transporter.sendMail({
      from: '"Wealth Strategy" <noreply@wealthstrategy.com>',
      to: email,
      subject: `Your Financial Plan Report - ${new Date().toLocaleDateString()}`,
      html: htmlContent
    });

    console.log('Message sent: %s', info.messageId);

    res.status(200).json({
      success: true,
      message: 'Report emailed successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

/**
 * @desc    Save financial plan to database
 * @route   POST /api/reports/save
 * @access  Private
 */
exports.savePlan = async (req, res) => {
  try {
    const { planId, planData } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required' });
    }

    const plan = await Plan.findOneAndUpdate(
      { wealthManagerId: planId },
      {
        user: req.user ? req.user._id : null,
        wealthManagerId: planId,
        riskProfile: planData.riskProfile,
        projections: {
          successProbability: planData.headlineSuccessProbability
        },
        allocation: planData.allocation
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Plan saved successfully',
      plan
    });
  } catch (error) {
    console.error('Save plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save plan',
      error: error.message
    });
  }
};
