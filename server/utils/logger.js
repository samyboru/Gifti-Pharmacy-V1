// File Location: server/utils/logger.js

const pool = require('../db');

/**
 * Logs an action to the activity_log table.
 * @param {object} logData - The data to be logged.
 * @param {number} logData.userId - The ID of the user performing the action.
 * @param {string} logData.username - The username of the user.
 * @param {string} logData.action - A short, consistent action type (e.g., 'USER_LOGIN').
 * @param {object} [logData.details] - Optional JSON object for extra context.
 */
const logActivity = ({ userId, username, action, details = null }) => {
  // --- THIS IS THE FIX ---
  // Standardize the action string to be lowercase with underscores.
  const standardizedAction = action.toLowerCase().replace(/ /g, '_');

  pool.query(
    'INSERT INTO activity_log (user_id, username, action, details) VALUES ($1, $2, $3, $4)',
    [userId, username, standardizedAction, details]
  ).catch(err => console.error('Failed to log activity:', err));
};

module.exports = logActivity;