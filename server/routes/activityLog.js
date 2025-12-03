// File Location: server/routes/activityLog.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET /api/activity-log
// @desc    Get all activity log entries
// @access  Private (Admin Only)
router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    // Corrected query for the new schema (column name is 'timestamp')
    const logEntries = await pool.query(
      'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100'
    );
    res.json(logEntries.rows);
  } catch (err) {
    console.error("Activity Log Error:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;