// middleware/jwtAuth.js
// Attach user from JWT in Authorization header (Bearer token)

const jwt = require('jsonwebtoken');

module.exports = function jwtAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'insecure_jwt_secret';
    const decoded = jwt.verify(token, secret);

    // Attach minimal user info from token
    req.user = {
      _id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      authProvider: decoded.authProvider,
    };
    req.jwt = decoded;

    // If passport's isAuthenticated isn't present, provide a simple version
    if (!req.isAuthenticated) {
      req.isAuthenticated = () => true;
    }
  } catch (err) {
    console.error('Invalid JWT in Authorization header:', err.message);
  }

  next();
};
