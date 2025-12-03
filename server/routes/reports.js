// File Location: server/routes/reports.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { query, validationResult } = require('express-validator');

// Helper for validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

router.use(authMiddleware);

// @route   GET /api/reports/sales-summary
// @desc    Get sales and profit summary over a date range
router.get('/sales-summary', [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year'])
], handleValidationErrors, async (req, res) => {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    try {
        // Postgres date_trunc parameter
        let truncType = groupBy; 

        const sqlQuery = `
            WITH SalesData AS (
                SELECT 
                    DATE_TRUNC($1, s.created_at) as period,
                    SUM(s.total_amount) as revenue,
                    COUNT(s.id) as transaction_count
                FROM sales s
                WHERE s.created_at BETWEEN $2 AND $3
                GROUP BY 1
            ),
            CostData AS (
                SELECT 
                    DATE_TRUNC($1, s.created_at) as period,
                    SUM(si.quantity * ii.purchase_price) as total_cost
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                JOIN inventory_items ii ON si.inventory_item_id = ii.id
                WHERE s.created_at BETWEEN $2 AND $3
                GROUP BY 1
            )
            SELECT 
                to_char(sd.period, 'YYYY-MM-DD') as date,
                COALESCE(sd.revenue, 0) as sales,
                COALESCE(sd.revenue - cd.total_cost, 0) as profit,
                COALESCE(sd.transaction_count, 0) as transactions
            FROM SalesData sd
            LEFT JOIN CostData cd ON sd.period = cd.period
            ORDER BY sd.period ASC;
        `;

        const result = await pool.query(sqlQuery, [truncType, startDate, endDate]);
        res.json(result.rows);
    } catch (err) {
        console.error("Reports Error (Summary):", err.message);
        res.status(500).send({ msg: 'Server Error: Could not generate report.' });
    }
});

// @route   GET /api/reports/top-products
// @desc    Get best selling products
router.get('/top-products', [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('limit').optional().isInt()
], handleValidationErrors, async (req, res) => {
    const { startDate, endDate, limit = 5 } = req.query;

    try {
        const sqlQuery = `
            SELECT 
                p.name,
                SUM(si.quantity) as total_sold,
                SUM(si.quantity * si.price_at_sale) as revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN inventory_items ii ON si.inventory_item_id = ii.id
            JOIN products p ON ii.product_id = p.id
            WHERE s.created_at BETWEEN $1 AND $2
            GROUP BY p.id, p.name
            ORDER BY total_sold DESC
            LIMIT $3;
        `;

        const result = await pool.query(sqlQuery, [startDate, endDate, limit]);
        res.json(result.rows);
    } catch (err) {
        console.error("Reports Error (Top Products):", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route   GET /api/reports/category-performance
// @desc    Get sales by category
router.get('/category-performance', [
    query('startDate').isISO8601(),
    query('endDate').isISO8601()
], handleValidationErrors, async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const sqlQuery = `
            SELECT 
                p.category,
                SUM(si.quantity * si.price_at_sale) as value
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN inventory_items ii ON si.inventory_item_id = ii.id
            JOIN products p ON ii.product_id = p.id
            WHERE s.created_at BETWEEN $1 AND $2
            GROUP BY p.category
            ORDER BY value DESC;
        `;

        const result = await pool.query(sqlQuery, [startDate, endDate]);
        res.json(result.rows);
    } catch (err) {
        console.error("Reports Error (Categories):", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route   GET /api/reports/stats
// @desc    Get KPI Stats (Total Sales, Profit, etc)
router.get('/stats', [
    query('startDate').isISO8601(),
    query('endDate').isISO8601()
], handleValidationErrors, async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        // 1. Total Sales & Transactions
        const salesQuery = `
            SELECT 
                COUNT(id) as total_transactions,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM sales 
            WHERE created_at BETWEEN $1 AND $2
        `;
        
        // 2. Total Cost (for Profit calc)
        const costQuery = `
            SELECT COALESCE(SUM(si.quantity * ii.purchase_price), 0) as total_cost
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN inventory_items ii ON si.inventory_item_id = ii.id
            WHERE s.created_at BETWEEN $1 AND $2
        `;

        // 3. Items Sold
        const itemsQuery = `
            SELECT COALESCE(SUM(si.quantity), 0) as items_sold
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.created_at BETWEEN $1 AND $2
        `;

        const [salesRes, costRes, itemsRes] = await Promise.all([
            pool.query(salesQuery, [startDate, endDate]),
            pool.query(costQuery, [startDate, endDate]),
            pool.query(itemsQuery, [startDate, endDate])
        ]);

        const revenue = parseFloat(salesRes.rows[0].total_revenue);
        const cost = parseFloat(costRes.rows[0].total_cost);
        const profit = revenue - cost;

        res.json({
            revenue,
            profit,
            transactions: parseInt(salesRes.rows[0].total_transactions),
            itemsSold: parseInt(itemsRes.rows[0].items_sold),
            margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0
        });

    } catch (err) {
        console.error("Reports Error (Stats):", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

module.exports = router;