// File Location: server/middleware/adminMiddleware.js

function adminMiddleware(req, res, next) {
  // Assumes authMiddleware has already run and attached req.user
  // --- THIS IS THE KEY CHANGE ---
  // We check if the 'roles' array includes 'admin'
  if (req.user && req.user.roles && req.user.roles.includes('admin')) {
    next(); // User is an admin, allow access
  } else {
    res.status(403).json({ msg: 'Forbidden: Admin access required.' });
  }
}

module.exports = adminMiddleware;