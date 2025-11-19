// routes/authRoutes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const authController = require("../controllers/authController");
const { authLimiter } = require("../middleware/security");
const { requireAuth } = require("../middleware/auth");
const jwt = require("jsonwebtoken");

// Get frontend URL from environment variable with fallback
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login`, session: false }),
  (req, res) => {
    const user = req.user;
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
    }

    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      authProvider: "google",
    };

    const secret = process.env.JWT_SECRET || "insecure_jwt_secret";
    const token = jwt.sign(payload, secret, { expiresIn: "1d" });
    const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl);
  }
);

// GitHub OAuth
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: `${FRONTEND_URL}/login`, session: false }),
  (req, res) => {
    const user = req.user;
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
    }

    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      authProvider: "github",
    };

    const secret = process.env.JWT_SECRET || "insecure_jwt_secret";
    const token = jwt.sign(payload, secret, { expiresIn: "1d" });
    const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl);
  }
);

// Get current user
router.get("/user", authController.getCurrentUser);

// Register new user with email/password
router.post("/register", authLimiter, authController.register);

// Login with email/password
router.post("/login", authLimiter, authController.login);

// Verify MFA during login
router.post("/verify-mfa", authLimiter, authController.verifyMfaLogin);

// MFA setup (requires authentication)
router.get("/mfa/setup", requireAuth, authController.generateMfaSecret);

// Enable MFA after verification (requires authentication)
router.post("/mfa/enable", requireAuth, authController.verifyAndEnableMfa);

// Logout
router.get("/logout", authController.logout);

module.exports = router;
