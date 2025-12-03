// File Location: server/routes/users.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const logActivity = require('../utils/logger');
const { body, param, validationResult } = require('express-validator'); 

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const VALID_ROLES = ['pharmacist', 'cashier'];

// 1. GLOBAL AUTHENTICATION
router.use(authMiddleware);

// 2. MIXED ACCESS ROUTE (Admin OR Pharmacist)
// Defined BEFORE the strict adminMiddleware is applied.
router.get('/creators', async (req, res) => {
    
    // --- DEBUGGING LOG ---
    // This will print to your VS Code terminal. Check this if it fails!
    console.log("User requesting creators:", req.user); 
    
    // Robustly handle 'role' vs 'roles'
    const rawRoles = req.user.roles || req.user.role || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    // Check permissions
    if (!userRoles.includes('admin') && !userRoles.includes('pharmacist')) {
         console.log("Access Denied. User roles found:", userRoles);
         return res.status(403).json({ msg: 'Access denied. Pharmacist or Admin role required.' });
    }

    try {
        // Only fetch users who are Admins or Pharmacists
        const creators = await pool.query(
            "SELECT id, username FROM users WHERE 'admin' = ANY(role) OR 'pharmacist' = ANY(role) ORDER BY username ASC"
        );
        res.json(creators.rows);
    } catch (err)
    {
        console.error("GET User Creators Error:", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// 3. STRICT ADMIN ROUTES (Everything below this line is Admin Only)
router.use(adminMiddleware);

// @route   GET /api/users
router.get('/', async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT id, username, email, phone, role, status FROM users ORDER BY username ASC');
    res.json(allUsers.rows);
  } catch (err) {
    console.error("GET Users Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   POST /api/users (Create User)
router.post('/', [
    body('username', 'Username is required').notEmpty().trim().escape(),
    body('email', 'Valid email required').isEmail().normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isString().trim().escape(),
    body('password', 'Min 6 chars').isLength({ min: 6 }),
    body('roles', 'Roles array required').isArray({ min: 1 }),
    body('roles.*').isIn(VALID_ROLES),
], handleValidationErrors, async (req, res) => {
  const { username, email, phone, password, roles } = req.body;
  
  if (roles.includes('admin')) {
      return res.status(403).json({ msg: 'Forbidden: Cannot create admin.' });
  }

  try {
    let user = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (user.rows.length > 0) return res.status(400).json({ msg: 'User already exists.' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const newUserResult = await pool.query(
      'INSERT INTO users (username, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, phone, role, status',
      [username, email, phone, password_hash, roles]
    );
    
    const logDetails = JSON.stringify({ key: 'user_created', username });
    logActivity({ userId: req.user.id, username: req.user.username, action: 'user_created', details: logDetails });

    res.status(201).json(newUserResult.rows[0]);
  } catch (err) {
    console.error("POST User Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   PUT /api/users/:id (Update User)
router.put('/:id', [
    param('id').isInt(),
    body('username').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('roles').isArray({ min: 1 }),
    body('roles.*').isIn(VALID_ROLES),
], handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, roles } = req.body;

  if (roles.includes('admin')) return res.status(403).json({ msg: 'Forbidden.' });

  try {
    const updatedUser = await pool.query(
      'UPDATE users SET username = $1, email = $2, phone = $3, role = $4 WHERE id = $5 RETURNING id, username, email, role, phone, status',
      [username, email, phone, roles, id]
    );
    if (updatedUser.rows.length === 0) return res.status(404).json({ msg: 'User not found' });
    
    const logDetails = JSON.stringify({ key: 'user_updated', name: username });
    logActivity({ userId: req.user.id, username: req.user.username, action: 'user_updated', details: logDetails });

    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error("PUT User Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   PUT /api/users/:id/status
router.put('/:id/status', [
    param('id').isInt(),
    body('status').isIn(['active', 'inactive', 'blocked']),
], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (parseInt(id, 10) === req.user.id) return res.status(400).json({ msg: 'Cannot change own status.' });

    try {
        let query = status === 'active' 
            ? 'UPDATE users SET status = $1, failed_login_attempts = 0, lockout_until = NULL WHERE id = $2 RETURNING *'
            : 'UPDATE users SET status = $1 WHERE id = $2 RETURNING *';
            
        const updatedUserResult = await pool.query(query, [status, id]);
        if (updatedUserResult.rows.length === 0) return res.status(404).json({ msg: 'User not found.' });
        
        const { password_hash, reset_token, ...safeUserData } = updatedUserResult.rows[0];
        res.json(safeUserData);
    } catch (err) {
        console.error("Update Status Error:", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route   GET /api/users/:id/activity
router.get('/:id/activity', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    try {
        const activity = await pool.query(`SELECT id, action, details, timestamp FROM activity_log WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 5`, [req.params.id]);
        res.json(activity.rows);
    } catch (err) {
        console.error("GET User Activity Error:", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

module.exports = router;