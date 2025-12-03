// File Location: server/middleware/pharmacistMiddleware.js

const pharmacistMiddleware = (req, res, next) => {
    // This middleware assumes 'authMiddleware' has already run and attached the user object.
    // In your auth.js, the JWT payload is { user: { ..., roles: [...] } }
    const roles = req.user?.roles || [];

    // An Admin can do everything a Pharmacist can.
    if (roles.includes('admin') || roles.includes('pharmacist')) {
        // User has the required role, proceed.
        next();
    } else {
        // User is not authorized.
        res.status(403).json({ msg: 'Access denied. Pharmacist or Admin privileges required.' });
    }
};

module.exports = pharmacistMiddleware;