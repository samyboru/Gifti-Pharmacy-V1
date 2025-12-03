// File Location: server/middleware/cashierMiddleware.js

function cashierMiddleware(req, res, next) {
  // Assumes authMiddleware has already run and attached req.user
  if (req.user && (req.user.role === 'cashier' || req.user.role === 'pharmacist' || req.user.role === 'admin')) {
    next(); // User has sufficient privileges, allow access
  } else {
    res.status(403).json({ msg: 'Forbidden: Cashier access or higher required.' });
  }
}

module.exports = cashierMiddleware;