// routes/authRoutes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const authController = require("../controllers/authController");
const { authLimiter } = require("../middleware/security");
const { requireAuth } = require("../middleware/auth");

// Get frontend URL from environment variable with fallback
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("=== Google callback start ===");
    console.log("Session ID before auth:", req.session?.id);
    next();
  },
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login`, session: true }),
  (req, res, next) => {
    console.log("=== Google callback after passport ===");
    console.log("Session ID:", req.session?.id);
    console.log("Session passport:", req.session?.passport);
    console.log("isAuthenticated():", req.isAuthenticated?.());
    console.log("User:", req.user);

    // Explicitly save the session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session (Google):", err);
        return res.redirect(`${FRONTEND_URL}/login?error=session`);
      }
      console.log("Session saved successfully, redirecting to frontend");
      res.redirect(`${FRONTEND_URL}/dashboard`);
    });
  }
);

// GitHub OAuth
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/github/callback",
  (req, res, next) => {
    console.log("=== GitHub callback start ===");
    console.log("Session ID before auth:", req.session?.id);
    next();
  },
  passport.authenticate("github", { failureRedirect: `${FRONTEND_URL}/login`, session: true }),
  (req, res, next) => {
    console.log("=== GitHub callback after passport ===");
    console.log("Session ID:", req.session?.id);
    console.log("Session passport:", req.session?.passport);
    console.log("isAuthenticated():", req.isAuthenticated?.());
    console.log("User:", req.user);

    // Explicitly save the session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session (GitHub):", err);
        return res.redirect(`${FRONTEND_URL}/login?error=session`);
      }
      console.log("Session saved successfully, redirecting to frontend");
      res.redirect(`${FRONTEND_URL}/dashboard`);
    });
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
