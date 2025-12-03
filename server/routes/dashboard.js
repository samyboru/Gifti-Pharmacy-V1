// File Location: server/routes/dashboard.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// @route   GET /api/dashboard/stats
// @desc    Get key statistics for the dashboard
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        // 1. Sales (Last 30 Days) - FIX: Changed sale_date to created_at
        const salesRes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM sales 
            WHERE created_at >= NOW() - INTERVAL '30 days'
        `);

        // 2. Total Products
        const productsRes = await pool.query('SELECT COUNT(*) as count FROM products');

        // 3. Suppliers
        const suppliersRes = await pool.query('SELECT COUNT(*) as count FROM suppliers');

        // 4. Pending POs
        const pendingPOsRes = await pool.query("SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'Pending'");

        // 5. Inventory Stats (Low Stock, Out of Stock, Expired)
        const inventoryRes = await pool.query(`
            SELECT 
                COUNT(CASE WHEN quantity_of_packages = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN quantity_of_packages > 0 AND quantity_of_packages <= 10 THEN 1 END) as low_stock,
                COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired,
                COUNT(CASE WHEN expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END) as expiring_soon
            FROM inventory_items
        `);

        res.json({
            sales30Days: parseFloat(salesRes.rows[0].total),
            totalProducts: parseInt(productsRes.rows[0].count),
            suppliers: parseInt(suppliersRes.rows[0].count),
            pendingPOs: parseInt(pendingPOsRes.rows[0].count),
            outOfStock: parseInt(inventoryRes.rows[0].out_of_stock),
            lowStock: parseInt(inventoryRes.rows[0].low_stock),
            expired: parseInt(inventoryRes.rows[0].expired),
            expiringSoon: parseInt(inventoryRes.rows[0].expiring_soon)
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
// @route   GET /api/dashboard/alerts
// @desc    Get critical inventory alerts with specific links
// @access  Private
router.get('/alerts', async (req, res) => {
    const expiringSoonThresholdDays = 30;
    try {
        const expiringSoonDate = new Date();
        expiringSoonDate.setDate(expiringSoonDate.getDate() + expiringSoonThresholdDays);
        const thresholdDateString = expiringSoonDate.toISOString().split('T')[0];

        const expiredQuery = `
            SELECT DISTINCT ON (i.product_id, i.batch_number)
                p.id AS product_id, p.name, i.batch_number, i.expiry_date 
            FROM inventory_items i JOIN products p ON i.product_id = p.id 
            WHERE i.expiry_date < CURRENT_DATE AND i.quantity_of_packages > 0;`;
            
        const expiringSoonQuery = `
            SELECT DISTINCT ON (i.product_id, i.batch_number)
                p.id AS product_id, p.name, i.batch_number, i.expiry_date 
            FROM inventory_items i JOIN products p ON i.product_id = p.id 
            WHERE i.expiry_date >= CURRENT_DATE AND i.expiry_date <= $1 AND i.quantity_of_packages > 0;`;
            
        const outOfStockQuery = `
            SELECT p.id AS product_id, p.name 
            FROM products p 
            WHERE (SELECT COALESCE(SUM(i.quantity_of_packages), 0) FROM inventory_items i WHERE i.product_id = p.id) = 0;`;

        const [expiredRes, expiringSoonRes, outOfStockRes] = await Promise.all([
            pool.query(expiredQuery),
            pool.query(expiringSoonQuery, [thresholdDateString]),
            pool.query(outOfStockQuery)
        ]);
        
        let alerts = [];
        
        expiredRes.rows.forEach(item => alerts.push({ 
            product_id: item.product_id, 
            type: 'expired', 
            message: `${item.name} (Batch: ${item.batch_number || 'N/A'}) has expired.`, 
            date: item.expiry_date,
            link: `/inventory?productId=${item.product_id}&batch=${item.batch_number || ''}` 
        }));
        
        expiringSoonRes.rows.forEach(item => {
            const daysLeft = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            alerts.push({ 
                product_id: item.product_id, 
                type: 'expiring_soon', 
                message: `${item.name} (Batch: ${item.batch_number || 'N/A'}) will expire in ${daysLeft} days.`, 
                date: item.expiry_date,
                link: `/inventory?productId=${item.product_id}&batch=${item.batch_number || ''}`
            });
        });

        outOfStockRes.rows.forEach(item => alerts.push({ 
            product_id: item.product_id, 
            type: 'out_of_stock', 
            message: `${item.name} is out of stock.`, 
            date: null,
            link: `/inventory?productId=${item.product_id}` 
        }));

        alerts.sort((a, b) => {
            const typeOrder = { 'expired': 1, 'expiring_soon': 2, 'out_of_stock': 3 };
            if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
            if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
            return 0;
        });

        res.json(alerts);
    } catch (err) {
        console.error("GET Dashboard Alerts Error:", err.message, err.stack);
        res.status(500).send({ msg: 'Server Error' });
    }
});

module.exports = router;