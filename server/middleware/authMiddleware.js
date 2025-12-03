// File Location: server/middleware/authMiddleware.js
// This file verifies the token on every protected request.

const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../keys'); // Use the centralized secret

function authMiddleware(req, res, next) {
  // --- START: CRITICAL SECURITY FIX ---
  // The token is now read from the secure httpOnly cookie named 'authToken'.
  const token = req.cookies.authToken;
  // --- END: CRITICAL SECURITY FIX ---

  // Check if no token is provided
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    // Add the decoded user payload to the request object so subsequent routes can use it.
    req.user = decoded.user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    // This will catch 'jwt malformed', 'invalid signature', 'jwt expired', etc.
    // If the token is invalid, we clear the bad cookie to prevent login loops.
    res.clearCookie('authToken');
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = authMiddleware;