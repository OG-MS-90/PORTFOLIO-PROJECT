// controllers/authController.js
const User = require("../models/User");
const speakeasy = require("speakeasy");
const { AuthenticationError } = require("../utils/errors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Generate a new MFA secret for a user
 */
exports.generateMfaSecret = async (req, res) => {
  try {
    // User must be authenticated already
    if (!req.isAuthenticated() || !req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `ESOP Manager:${req.user.email}`
    });

    // Save the secret to the user
    await User.findByIdAndUpdate(req.user._id, {
      mfaSecret: secret.base32,
      mfaEnabled: false // Not enabled until verified
    });

    // Return the secret and QR code URL
    res.json({
      secret: secret.base32,
      otpAuthUrl: secret.otpauth_url
    });
  } catch (error) {
    console.error("Error generating MFA secret:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate MFA secret"
    });
  }
};

/**
 * Verify MFA token and enable MFA for user
 */
exports.verifyAndEnableMfa = async (req, res) => {
  try {
    const { token } = req.body;

    if (!req.isAuthenticated() || !req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.mfaSecret) {
      throw new Error("MFA not set up for this user");
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: token,
      window: 1 // Allow 1 time step before/after for clock drift
    });

    if (verified) {
      // Enable MFA
      await User.findByIdAndUpdate(user._id, { mfaEnabled: true });
      res.json({
        status: "success",
        message: "MFA enabled successfully"
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "Invalid verification code"
      });
    }
  } catch (error) {
    console.error("MFA verification error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "MFA verification failed"
    });
  }
};

/**
 * Verify MFA token during login
 */
exports.verifyMfaLogin = async (req, res) => {
  try {
    const { email, token } = req.body;

    // Find the user
    const user = await User.findOne({ email });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new AuthenticationError("Invalid credentials or MFA not enabled");
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: token,
      window: 1
    });

    if (verified) {
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          throw err;
        }
        
        // Create JWT token for API access
        const token = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET || "insecure_jwt_secret",
          { expiresIn: "1d" }
        );

        res.json({
          status: "success",
          message: "MFA verification successful",
          user: {
            id: user._id,
            email: user.email,
            name: user.name
          },
          token
        });
      });
    } else {
      res.status(401).json({
        status: "error",
        message: "Invalid verification code"
      });
    }
  } catch (error) {
    console.error("MFA login verification error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "MFA verification failed"
    });
  }
};

/**
 * Get the current authenticated user
 */
exports.getCurrentUser = (req, res) => {
  if (req.isAuthenticated() && req.user) {
    // Don't send sensitive information
    const { _id, email, name, authProvider, mfaEnabled } = req.user;
    res.json({
      id: _id,
      email,
      name,
      authProvider,
      mfaEnabled
    });
  } else {
    res.status(401).json({
      status: "error",
      message: "Not authenticated"
    });
  }
};

/**
 * Register a new user with email/password
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User with this email already exists"
      });
    }

    // Create a new user
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');

    const user = new User({
      email,
      name,
      authProvider: "local",
      hash,
      salt
    });

    await user.save();

    res.status(201).json({
      status: "success",
      message: "Registration successful. Please log in."
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Registration failed"
    });
  }
};

/**
 * Login with email/password
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user || user.authProvider !== "local") {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }

    // Verify password
    const hash = crypto.pbkdf2Sync(password, user.salt, 10000, 512, 'sha512').toString('hex');
    if (hash !== user.hash) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password"
      });
    }

    // Check if MFA is required
    if (user.mfaEnabled) {
      return res.json({
        status: "success",
        message: "MFA verification required",
        requireMfa: true,
        userId: user._id
      });
    }

    // Log the user in
    req.login(user, (err) => {
      if (err) {
        throw err;
      }

      // Create JWT token for API access
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "insecure_jwt_secret",
        { expiresIn: "1d" }
      );

      res.json({
        status: "success",
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        },
        token
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Login failed"
    });
  }
};

/**
 * Logout the user
 */
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Logout failed"
      });
    }
    res.json({
      status: "success",
      message: "Logged out successfully"
    });
  });
};