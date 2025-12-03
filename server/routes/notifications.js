// File Location: server/routes/notifications.js

const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// ---------------------------------------------------------------------------
// 1. GET UNREAD COUNT
// ---------------------------------------------------------------------------
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT COUNT(*) FROM notifications WHERE is_read = FALSE");
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ---------------------------------------------------------------------------
// 2. GET NOTIFICATIONS (Fixed Filtering Logic)
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, limit } = req.query;
        
        // Start with a base query
        let query = `SELECT * FROM notifications WHERE 1=1`; 
        const params = [];
        let paramIndex = 1;

        // --- FIX: Handle BOTH 'unread' and 'read' statuses ---
        if (status === 'unread') {
            query += ` AND is_read = FALSE`;
        } else if (status === 'read') {
            query += ` AND is_read = TRUE`;
        }

        query += ` ORDER BY created_at DESC`;

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(parseInt(limit));
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ---------------------------------------------------------------------------
// 3. MARK AS READ (Single)
// ---------------------------------------------------------------------------
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ msg: "Not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ---------------------------------------------------------------------------
// 4. MARK ALL AS READ (Bulk)
// ---------------------------------------------------------------------------
router.put('/mark-all-read', authMiddleware, async (req, res) => {
    try {
        await pool.query(`UPDATE notifications SET is_read = TRUE`);
        res.json({ msg: "All notifications marked as read" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;