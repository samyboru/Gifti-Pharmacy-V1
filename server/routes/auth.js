// File Location: server/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const logActivity = require('../utils/logger');
const { jwtSecret } = require('../keys');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware'); // <-- IMPORT authMiddleware

// --- START: ADVANCED SECURITY MIDDLEWARE ---
const authLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
    message: { msg: 'Too many requests for this account from this IP. Please try again after 5 minutes.' },
    keyGenerator: (req, res) => {
        const ip = rateLimit.ipKeyGenerator(req, res);
        
        // --- THIS IS THE FIX ---
        // Safely check for req.body and req.body.username to prevent crashes on GET requests.
        if (req.body && req.body.username) {
            return `${ip}-${req.body.username}`;
        }
        
        return ip;
    },
});
// --- END: ADVANCED SECURITY MIDDLEWARE ---

const maskEmail = (email) => {
  if (typeof email !== 'string' || !email.includes('@')) return 'an unconfigured email';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `***@${domain}`;
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
};
const maskPhone = (phone) => {
  if (typeof phone !== 'string' || phone.length < 4) return 'an unconfigured phone number';
  return `***-***-${phone.slice(-4)}`;
};

router.post('/register', async (req, res) => {
  const { username, email, phone, password, role = 'pharmacist' } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Username, email, and password are required.' });
  }
  try {
    let user = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (user.rows.length > 0) {
      return res.status(400).json({ msg: 'User with that username or email already exists.' });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (username, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role',
      [username, email, phone, password_hash, role]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// --- START: NEW LOGOUT ROUTE ---
// Placed before the rate limiter as there is no harm in logging out multiple times.
router.post('/logout', (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
    res.status(200).json({ msg: 'Logged out successfully.' });
});
// --- END: NEW LOGOUT ROUTE ---

// --- START: NEW VERIFY ROUTE ---
// This endpoint allows the frontend to check if a valid cookie session exists.
// It has its own authMiddleware, so it does not need the rate limiter.
router.get('/verify', authMiddleware, (req, res) => {
    // If authMiddleware succeeds (by reading the cookie), it attaches the user data to req.user.
    res.status(200).json(req.user);
});
// --- END: NEW VERIFY ROUTE ---

// Apply the rate limiter to all subsequent, more sensitive routes.
router.use(authLimiter);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let userResult = await client.query('SELECT * FROM users WHERE username = $1 FOR UPDATE', [username]);
    if (userResult.rows.length === 0) {
      await client.query('COMMIT');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    let user = userResult.rows[0];
    if (user.status === 'locked') {
      if (user.lockout_until && new Date() > new Date(user.lockout_until)) {
        await client.query('UPDATE users SET status = $1, failed_login_attempts = $2, lockout_until = $3 WHERE id = $4', ['active', 0, null, user.id]);
        user.status = 'active';
      } else {
        await client.query('COMMIT');
        return res.status(403).json({ msg: 'Account is temporarily locked. Please try again later.' });
      }
    }
    if (user.status !== 'active') {
      await client.query('COMMIT');
      return res.status(403).json({ msg: `Account is currently ${user.status}.` });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const newAttemptCount = user.failed_login_attempts + 1;
      if (newAttemptCount >= 3) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000);
        await client.query("UPDATE users SET failed_login_attempts = $1, status = 'locked', lockout_until = $2 WHERE id = $3", [newAttemptCount, lockoutTime, user.id]);
        const logDetails = JSON.stringify({ key: 'account_locked', username: user.username });
        logActivity({ userId: user.id, username: user.username, action: 'account_locked', details: logDetails });
        await client.query('COMMIT');
        return res.status(403).json({ msg: 'Account locked for 15 minutes.' });
      } else {
        await client.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [newAttemptCount, user.id]);
      }
      await client.query('COMMIT');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (user.failed_login_attempts > 0) {
      await client.query('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1', [user.id]);
    }
    
    const payload = { user: { id: user.id, username: user.username, roles: user.role } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '8h' });

    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000,
        path: '/',
    });

    logActivity({ userId: user.id, username: user.username, action: 'user_login', details: `User logged in` });
    await client.query('COMMIT');
    
    // Send back user data, but not the token or password hash.
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Login Error:', err.message);
    res.status(500).send({ msg: 'Server Error' });
  } finally {
    client.release();
  }
});

router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  try {
    const userResult = await pool.query('SELECT id, username, email, phone, status FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.json({ msg: 'If an account with that username exists, a reset code has been sent.' });
    }
    const user = userResult.rows[0];

    if (user.status === 'locked' || user.status === 'blocked') {
        const logDetails = JSON.stringify({ key: 'password_reset_attempt_denied', username: username, reason: `Account status: ${user.status}` });
        logActivity({ userId: user.id, username, action: 'password_reset_attempt_denied', details: logDetails });
        return res.json({ msg: 'If an account with that username exists and is active, a reset code has been sent.' });
    }

    const resetToken = crypto.randomInt(100000, 999999).toString();
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3', [resetToken, tokenExpires, user.id]);
    console.log(`Password reset token for ${user.username}: ${resetToken}`);
    res.json({ 
      msg: 'Reset code sent.', 
      maskedEmail: maskEmail(user.email), 
      maskedPhone: maskPhone(user.phone) 
    });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

router.post('/verify-token', async (req, res) => {
    const { username, token } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1 AND reset_token = $2 AND reset_token_expires_at > NOW()', [username, token]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid or expired token.' });
        }
        res.json({ msg: 'Token verified successfully.' });
    } catch (err) {
        console.error("Verify Token Error:", err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/reset-password', async (req, res) => {
    const { username, token, newPassword } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1 AND reset_token = $2 AND reset_token_expires_at > NOW()', [username, token]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid or expired token. Please try again.' });
        }
        const user = userResult.rows[0];
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, status = \'active\', failed_login_attempts = 0 WHERE id = $2', [password_hash, user.id]);
        
        const logDetails = JSON.stringify({ key: 'password_reset', username: user.username });
        logActivity({ userId: user.id, username: user.username, action: 'password_reset', details: logDetails });
        
        res.json({ msg: 'Password has been reset successfully.' });
    } catch (err) {
        console.error("Reset Password Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;