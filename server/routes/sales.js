// File Location: server/routes/sales.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const logActivity = require('../utils/logger');
const { body, param, validationResult } = require('express-validator');

router.use(authMiddleware);

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// @route   GET /api/sales
// @desc    Get all completed sales records
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT s.id, s.total_amount, s.tax_amount, s.created_at as sale_date, u.username AS cashier_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC;
    `;
    const salesHistory = await pool.query(query);
    res.json(salesHistory.rows);
  } catch (err) {
    console.error("GET Sales History Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   GET /api/sales/pending
router.get('/pending', async (req, res) => {
    try {
        const pendingSales = await pool.query(
            `SELECT ps.id, ps.cart_data, u.username as pharmacist_name, ps.created_at 
             FROM pending_sales ps
             JOIN users u ON ps.pharmacist_id = u.id
             WHERE ps.status = 'pending' 
             ORDER BY ps.created_at ASC`
        );
        res.json(pendingSales.rows);
    } catch (err) {
        console.error("Get Pending Sales Error:", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route   GET /api/sales/:id
// @desc    Get full details for receipt
router.get('/:id', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    try {
        const saleQuery = `
            SELECT s.id, s.total_amount, s.tax_amount, s.created_at as sale_date, u.username as cashier_name
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = $1;
        `;
        
        // --- FIX: Changed quantity_sold to quantity ---
        const itemsQuery = `
            SELECT 
                p.name as product_name, 
                si.quantity as quantity_sold, -- Aliasing it so frontend doesn't break
                si.price_at_sale as price_at_time_of_sale
            FROM sale_items si
            JOIN inventory_items ii ON si.inventory_item_id = ii.id
            JOIN products p ON ii.product_id = p.id
            WHERE si.sale_id = $1;
        `;
        
        const [saleRes, itemsRes] = await Promise.all([
            pool.query(saleQuery, [id]),
            pool.query(itemsQuery, [id])
        ]);
        if (saleRes.rows.length === 0) {
            return res.status(404).json({ msg: 'Sale not found.' });
        }
        const receiptData = { ...saleRes.rows[0], items: itemsRes.rows };
        res.json(receiptData);
    } catch (err) {
        console.error("Get Receipt Error:", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// @route   POST /api/sales/handoff
router.post('/handoff', [
    body('cart').isArray({ min: 1 }),
    body('cart.*.id').isInt(),
    body('cart.*.quantityInCart').isInt({ gt: 0 }),
], handleValidationErrors, async (req, res) => {
    const { cart } = req.body;
    const pharmacist_id = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const item of cart) {
            const inventoryItemId = item.id;
            const physicalStockRes = await client.query('SELECT quantity_of_packages FROM inventory_items WHERE id = $1 FOR UPDATE', [inventoryItemId]);
            if (physicalStockRes.rows.length === 0) throw new Error(`Item in cart not found.`);
            const physicalStock = physicalStockRes.rows[0].quantity_of_packages;
            
            // Check pending
            const pendingStockRes = await client.query(`SELECT jsonb_array_elements(cart_data) AS item FROM pending_sales WHERE status = 'pending'`);
            let reservedStock = 0;
            pendingStockRes.rows.forEach(row => {
                if (row.item.id === inventoryItemId) reservedStock += row.item.quantityInCart;
            });
            
            if ((physicalStock - reservedStock) < item.quantityInCart) {
                throw new Error(`Not enough available stock.`);
            }
        }
        const cartDataJson = JSON.stringify(cart);
        await client.query('INSERT INTO pending_sales (pharmacist_id, cart_data) VALUES ($1, $2) RETURNING id', [pharmacist_id, cartDataJson]);
        await client.query('COMMIT');
        const logDetails = JSON.stringify({ key: 'sale_handoff', username: req.user.username });
        logActivity({ userId: req.user.id, username: req.user.username, action: 'sale_handoff', details: logDetails });
        res.status(201).json({ success: true, message: 'Sale sent to cashier.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ msg: err.message });
    } finally { client.release(); }
});

// @route   POST /api/sales
// @desc    Process Sale (Checkout)
router.post('/', [
    body('pending_sale_id').optional().isInt(),
    body('cart').optional().isArray(),
], handleValidationErrors, async (req, res) => {
  const { cart, pending_sale_id } = req.body;
  const { id: user_id, username } = req.user;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let saleCart;
    let serverCalculatedSubtotal = 0;

    if (pending_sale_id) {
        const pendingSaleRes = await client.query("SELECT * FROM pending_sales WHERE id = $1 AND status = 'pending' FOR UPDATE", [pending_sale_id]);
        if (pendingSaleRes.rows.length === 0) throw new Error('Pending sale not found.');
        saleCart = pendingSaleRes.rows[0].cart_data;
    } else {
        saleCart = cart;
    }

    if (!saleCart || saleCart.length === 0) throw new Error('Cart is empty.');

    // Price Verification
    for (const item of saleCart) {
        const dbItemResult = await client.query('SELECT selling_price FROM inventory_items WHERE id = $1', [item.id]);
        if (dbItemResult.rows.length === 0) throw new Error(`Invalid item: ${item.id}`);
        
        const dbPrice = parseFloat(dbItemResult.rows[0].selling_price);
        serverCalculatedSubtotal += dbPrice * item.quantityInCart;
        item.selling_price = dbPrice; // Ensure we save the DB price
    }

    const serverCalculatedTax = serverCalculatedSubtotal * 0.15; 
    const serverCalculatedTotal = serverCalculatedSubtotal + serverCalculatedTax;

    const saleResult = await client.query('INSERT INTO sales (total_amount, tax_amount, user_id) VALUES ($1, $2, $3) RETURNING id', [serverCalculatedTotal, serverCalculatedTax, user_id]);
    const newSaleId = saleResult.rows[0].id;

    for (const item of saleCart) {
      const { id: inventory_item_id, quantityInCart: quantity_sold, selling_price: price_at_time_of_sale } = item;
      
      const stockCheck = await client.query('SELECT quantity_of_packages FROM inventory_items WHERE id = $1 FOR UPDATE', [inventory_item_id]);
      if (stockCheck.rows.length === 0) throw new Error(`Item ${inventory_item_id} not found.`);
      if (stockCheck.rows[0].quantity_of_packages < quantity_sold) throw new Error(`Not enough stock.`);
      
      await client.query('UPDATE inventory_items SET quantity_of_packages = quantity_of_packages - $1 WHERE id = $2', [quantity_sold, inventory_item_id]);
      
      // --- FIX: Changed quantity_sold to quantity (matches DB Schema) ---
      await client.query(
        `INSERT INTO sale_items (sale_id, inventory_item_id, quantity, price_at_sale) VALUES ($1, $2, $3, $4)`,
        [newSaleId, inventory_item_id, quantity_sold, price_at_time_of_sale]
      );
    }

    if (pending_sale_id) {
        await client.query("UPDATE pending_sales SET status = 'completed' WHERE id = $1", [pending_sale_id]);
    }
    
    await client.query('COMMIT');
    const logDetails = JSON.stringify({ key: 'sale_completed', id: newSaleId, total: Number(serverCalculatedTotal).toFixed(2) });
    logActivity({ userId: user_id, username: username, action: 'sale_completed', details: logDetails });
    
    res.status(201).json({ success: true, message: 'Sale processed.', saleId: newSaleId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sale Transaction Error:', err.message);
    res.status(400).json({ success: false, msg: err.message });
  } finally { client.release(); }
});

module.exports = router;