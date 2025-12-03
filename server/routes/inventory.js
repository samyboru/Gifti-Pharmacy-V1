// File Location: server/routes/inventory.js

const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
// --- FIX 1: Import the Notification Service ---
const notificationService = require('../services/notificationService');

// 1. GET INVENTORY DETAILS
router.get('/details', authMiddleware, async (req, res) => {
    try {
        const { productId, batch } = req.query;
        if (!productId) return res.status(400).json({ msg: "Product ID is required" });

        let query = `
            SELECT i.id, i.product_id, p.name, p.brand, p.requires_prescription,
                i.batch_number, i.expiry_date, i.quantity_of_packages,
                i.purchase_price, i.selling_price, s.name as supplier_name
            FROM inventory_items i
            JOIN products p ON i.product_id = p.id
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            WHERE i.product_id = $1
        `;
        const params = [productId];
        if (batch && batch !== '' && batch !== 'N/A') {
            query += ` AND i.batch_number = $2`;
            params.push(batch);
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching details:", err.message);
        res.status(500).send("Server Error");
    }
});

// 2. GET ALL INVENTORY
router.get('/', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT i.id, i.product_id, p.name, p.brand, p.requires_prescription,
                i.batch_number, i.expiry_date, i.quantity_of_packages, 
                i.purchase_price, i.selling_price, i.supplier_id, s.name as supplier_name
            FROM inventory_items i
            JOIN products p ON i.product_id = p.id
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            ORDER BY i.expiry_date ASC
        `;
        const allInventory = await pool.query(query);
        res.json(allInventory.rows);
    } catch (err) {
        console.error("Error fetching inventory:", err.message);
        res.status(500).send("Server Error");
    }
});

// 3. ADD NEW STOCK
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { product_id, batch_number, expiry_date, quantity_of_packages, purchase_price, selling_price, supplier_id } = req.body;

        if (!product_id || !batch_number || !expiry_date || !selling_price) {
            return res.status(400).json({ msg: "Please fill in all required fields." });
        }

        const newItem = await pool.query(
            `INSERT INTO inventory_items (product_id, batch_number, expiry_date, quantity_of_packages, purchase_price, selling_price, supplier_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [product_id, batch_number, expiry_date, quantity_of_packages || 0, purchase_price || 0, selling_price, supplier_id || null]
        );

        // --- FIX: Add 'await' so we wait for the alert to be created ---
        await notificationService.generateAlerts();

        res.json(newItem.rows[0]);
    } catch (err) {
        console.error("Error adding stock:", err.message);
        res.status(500).send("Server Error");
    }
});

// 4. UPDATE INVENTORY ITEM
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { batch_number, expiry_date, quantity_of_packages, purchase_price, selling_price, supplier_id } = req.body;

        const updateQuery = `
            UPDATE inventory_items 
            SET batch_number = $1, expiry_date = $2, quantity_of_packages = $3, purchase_price = $4, selling_price = $5, supplier_id = $6
            WHERE id = $7 RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [
            batch_number, expiry_date, quantity_of_packages, purchase_price, selling_price, supplier_id, id
        ]);

        if (updateResult.rows.length === 0) return res.status(404).json({ msg: "Inventory item not found" });

        // --- FIX: Add 'await' ---
        await notificationService.generateAlerts();

        res.json({ msg: "Inventory updated", item: updateResult.rows[0] });
    } catch (err) {
        console.error("Error updating inventory:", err.message);
        res.status(500).send("Server Error");
    }
});

// 5. DELETE INVENTORY ITEM
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM inventory_items WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) return res.status(404).json({ msg: "Item not found" });
        
        // --- FIX: Add 'await' ---
        await notificationService.generateAlerts();

        res.json({ msg: "Batch deleted successfully" });
    } catch (err) {
        console.error("Error deleting inventory:", err.message);
        if (err.code === '23503') return res.status(400).json({ msg: "Cannot delete: Batch has associated sales." });
        res.status(500).send("Server Error");
    }
});
module.exports = router;