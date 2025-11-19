// middleware/auth.js
const { AuthenticationError, AuthorizationError } = require('../utils/errors');

const requireAuth = (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError('Please log in to access this resource');
  }
  next();
};

const requireOwnership = (req, res, next) => {
  // This middleware should be used after requireAuth
  // It ensures the user can only access their own resources
  if (!req.user) {
    throw new AuthenticationError();
  }
  
  // Add user ID to request for easy access in controllers
  req.userId = req.user._id;
  next();
};

// Middleware to sanitize user input
const sanitizeInput = (req, res, next) => {
  // Basic XSS protection - strip HTML tags from string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<[^>]*>/g, '')
                  .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          } else {
            obj[key] = sanitizeValue(obj[key]);
          }
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    sanitizeObject(req.query);
  }

  next();
};

module.exports = {
  requireAuth,
  requireOwnership,
  sanitizeInput
};
