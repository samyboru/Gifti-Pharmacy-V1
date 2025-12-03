// File Location: server/routes/purchaseOrders.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const logActivity = require('../utils/logger');
const { body, param, query, validationResult } = require('express-validator');
const pharmacistMiddleware = require('../middleware/pharmacistMiddleware');

// Apply Authentication & Role Check
router.use(authMiddleware, pharmacistMiddleware);

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

// @route   GET /api/purchase-orders
router.get('/', [
    query('status').optional().isIn(['Pending', 'Received', 'Cancelled']),
    query('created_by').optional().isInt(),
    query('time_range').optional().isString(),
], handleValidationErrors, async (req, res) => {
  const { status, created_by, time_range, date_from, date_to } = req.query;
  try {
    let conditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) { conditions.push(`LOWER(po.status) = LOWER($${paramIndex++})`); queryParams.push(status); }
    if (created_by) { conditions.push(`po.created_by = $${paramIndex++}`); queryParams.push(created_by); }
    
    if (time_range) {
        if (time_range === 'today') conditions.push(`DATE(po.date_created) = CURRENT_DATE`);
        else if (time_range === 'last_7_days') conditions.push(`po.date_created >= CURRENT_DATE - INTERVAL '7 days'`);
        else if (time_range === 'last_30_days') conditions.push(`po.date_created >= CURRENT_DATE - INTERVAL '30 days'`);
        else if (time_range === 'custom' && date_from && date_to) {
            conditions.push(`DATE(po.date_created) BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
            queryParams.push(date_from, date_to); paramIndex += 2;
        }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        po.id, po.status, po.date_created, 
        po.received_at, po.canceled_at, po.updated_at,
        s.name as supplier_name,
        u_create.username as created_by_name,
        u_recv.username as received_by_name,
        u_cancel.username as canceled_by_name,
        u_update.username as updated_by_name,
        COALESCE(item_summary.total_items, 0)::int AS total_items,
        COALESCE(item_summary.total_quantity, 0)::int AS total_quantity,
        (SELECT SUM(poi.quantity * poi.price_per_item) FROM purchase_order_items poi WHERE poi.po_id = po.id) as total_value
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u_create ON po.created_by = u_create.id
      LEFT JOIN users u_recv ON po.received_by = u_recv.id
      LEFT JOIN users u_cancel ON po.canceled_by = u_cancel.id
      LEFT JOIN users u_update ON po.updated_by = u_update.id
      LEFT JOIN (
          SELECT po_id, COUNT(id) AS total_items, SUM(quantity) AS total_quantity
          FROM purchase_order_items GROUP BY po_id
      ) AS item_summary ON po.id = item_summary.po_id
      ${whereClause}
      ORDER BY po.date_created DESC, po.id DESC;
    `;
    const allPOs = await pool.query(sqlQuery, queryParams);
    res.json(allPOs.rows);
  } catch (err) {
    console.error("GET POs Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   GET /api/purchase-orders/:id
router.get('/:id', [param('id').isInt()], handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  try {
    const poQuery = `
        SELECT po.*, s.name as supplier_name, 
        u_create.username as created_by_name,
        (SELECT SUM(poi.quantity * poi.price_per_item) FROM purchase_order_items poi WHERE poi.po_id = po.id) as total_value
        FROM purchase_orders po 
        LEFT JOIN suppliers s ON po.supplier_id = s.id 
        LEFT JOIN users u_create ON po.created_by = u_create.id
        WHERE po.id = $1
    `;
    const itemsQuery = `SELECT poi.*, p.name as product_name FROM purchase_order_items poi JOIN products p ON poi.product_id = p.id WHERE poi.po_id = $1`;
    const historyQuery = `SELECT h.action, h.changed_at, u.username as changed_by_name FROM po_history h JOIN users u ON h.changed_by = u.id WHERE h.po_id = $1 ORDER BY h.changed_at DESC LIMIT 5`;

    const [poRes, itemsRes, historyRes] = await Promise.all([pool.query(poQuery, [id]), pool.query(itemsQuery, [id]), pool.query(historyQuery, [id])]);
    if (poRes.rows.length === 0) return res.status(404).json({ msg: 'PO not found' });
    
    res.json({ ...poRes.rows[0], items: itemsRes.rows, history: historyRes.rows });
  } catch (err) { res.status(500).send({ msg: 'Server Error' }); }
});

// @route   POST /api/purchase-orders (Create)
router.post('/', [
    body('supplier_id').isInt(),
    body('items').isArray({ min: 1 }),
], handleValidationErrors, async (req, res) => {
  const { supplier_id, items } = req.body;
  
  // Budget Logic
  const rawRoles = req.user.roles || req.user.role || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price_per_item), 0);
  if (userRoles.includes('pharmacist') && !userRoles.includes('admin') && totalValue > 5000) {
      return res.status(403).json({ msg: `Budget Limit Exceeded: Limit is 5,000 ETB.` });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poResult = await client.query('INSERT INTO purchase_orders (supplier_id, created_by) VALUES ($1, $2) RETURNING id', [supplier_id, req.user.id]);
    const newPOId = poResult.rows[0].id;
    for (const item of items) {
      await client.query('INSERT INTO purchase_order_items (po_id, product_id, quantity, price_per_item) VALUES ($1, $2, $3, $4)', [newPOId, item.product_id, item.quantity, item.price_per_item]);
    }
    await client.query("INSERT INTO po_history (po_id, action, changed_by) VALUES ($1, 'Created', $2)", [newPOId, req.user.id]);
    await client.query('COMMIT');
    
    const logDetails = JSON.stringify({ key: 'create_po', id: newPOId });
    logActivity({ userId: req.user.id, username: req.user.username, action: 'create_po', details: logDetails });
    res.status(201).json({ success: true, message: 'Purchase Order created successfully', poId: newPOId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).send({ msg: 'Server Error' });
  } finally { client.release(); }
});

// @route   PUT /api/purchase-orders/:id (Edit)
router.put('/:id', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const { supplier_id, items } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const checkRes = await client.query("SELECT status FROM purchase_orders WHERE id = $1 FOR UPDATE", [id]);
        if (checkRes.rows.length === 0 || checkRes.rows[0].status !== 'Pending') throw new Error("Cannot edit non-pending PO");

        await client.query("UPDATE purchase_orders SET supplier_id = $1, updated_by = $2, updated_at = NOW() WHERE id = $3", [supplier_id, req.user.id, id]);
        await client.query("DELETE FROM purchase_order_items WHERE po_id = $1", [id]);
        for (const item of items) {
            await client.query('INSERT INTO purchase_order_items (po_id, product_id, quantity, price_per_item) VALUES ($1, $2, $3, $4)', [id, item.product_id, item.quantity, item.price_per_item]);
        }
        await client.query("INSERT INTO po_history (po_id, action, changed_by) VALUES ($1, 'Edited', $2)", [id, req.user.id]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'PO updated.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ msg: err.message });
    } finally { client.release(); }
});

// @route   PUT /api/purchase-orders/:id/cancel (Cancel)
router.put('/:id/cancel', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const checkRes = await client.query("SELECT status FROM purchase_orders WHERE id = $1 FOR UPDATE", [id]);
        if (checkRes.rows.length === 0 || checkRes.rows[0].status !== 'Pending') throw new Error("Can only cancel Pending orders");
        await client.query("UPDATE purchase_orders SET status = 'Cancelled', canceled_by = $2, canceled_at = NOW() WHERE id = $1", [id, req.user.id]);
        await client.query("INSERT INTO po_history (po_id, action, changed_by) VALUES ($1, 'Cancelled', $2)", [id, req.user.id]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'PO cancelled.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ msg: err.message });
    } finally { client.release(); }
});

// @route   PUT /api/purchase-orders/:id/receive (Receive Stock)
router.put('/:id/receive', [
    param('id').isInt(),
    body('receivedItems').isArray({ min: 1 }),
], handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  const { receivedItems } = req.body;
  const received_by_userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const poCheck = await client.query("SELECT supplier_id FROM purchase_orders WHERE id = $1 AND status = 'Pending' FOR UPDATE", [id]);
    if (poCheck.rows.length === 0) throw new Error('Purchase Order not found or already processed.');
    const { supplier_id } = poCheck.rows[0];

    const today = new Date();
    today.setHours(0,0,0,0);

    for (const item of receivedItems) {
        // 1. Check Expiry
        const expiryDate = new Date(item.expiry_date);
        if (expiryDate < today) {
            throw new Error(`Cannot receive expired stock (Product ID: ${item.product_id}).`);
        }

        // 2. CHECK FOR DUPLICATE BATCH (Explicit Check)
        const duplicateCheck = await client.query(
            "SELECT id FROM inventory_items WHERE product_id = $1 AND batch_number = $2",
            [item.product_id, item.batch_number]
        );

        if (duplicateCheck.rows.length > 0) {
             // Fetch product name for better error message
             const prodNameRes = await client.query("SELECT name FROM products WHERE id = $1", [item.product_id]);
             const prodName = prodNameRes.rows[0]?.name || 'Product';
             throw new Error(`Batch "${item.batch_number}" already exists for ${prodName}. Batch numbers must be unique.`);
        }

        // 3. Insert Item
        await client.query(
            `INSERT INTO inventory_items (product_id, supplier_id, quantity_of_packages, purchase_price, selling_price, batch_number, expiry_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [item.product_id, supplier_id, item.quantity, item.price_per_item, item.selling_price, item.batch_number, item.expiry_date]
        );
        
        // Notifications
        const productRes = await client.query('SELECT name FROM products WHERE id = $1', [item.product_id]);
        if (productRes.rows[0]) {
            await client.query(`UPDATE notifications SET is_read = TRUE WHERE message LIKE $1`, [`${productRes.rows[0].name}%`]);
        }
    }
    
    // Update PO Status
    await client.query("UPDATE purchase_orders SET status = 'Received', received_by = $2, received_at = NOW() WHERE id = $1", [id, received_by_userId]);
    
    // Log History
    await client.query("INSERT INTO po_history (po_id, action, changed_by) VALUES ($1, 'Received', $2)", [id, received_by_userId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Stock received successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    // Send the explicit error message to the frontend
    res.status(400).json({ success: false, msg: err.message });
  } finally {
    client.release();
  }
});

// @route   DELETE /api/purchase-orders/:id (Admin Only)
router.delete('/:id', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const rawRoles = req.user.roles || req.user.role || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    if (!userRoles.includes('admin')) return res.status(403).json({ msg: 'Access Denied' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const checkRes = await client.query("SELECT status FROM purchase_orders WHERE id = $1 FOR UPDATE", [id]);
        if (checkRes.rows.length === 0) throw new Error("PO not found");
        
        const status = checkRes.rows[0].status.toLowerCase(); 
        if (status !== 'received' && status !== 'cancelled') throw new Error("Only Received/Cancelled orders can be deleted.");

        await client.query("DELETE FROM purchase_order_items WHERE po_id = $1", [id]);
        await client.query("DELETE FROM po_history WHERE po_id = $1", [id]);
        await client.query("DELETE FROM purchase_orders WHERE id = $1", [id]);
        
        await client.query('COMMIT');
        const logDetails = JSON.stringify({ key: 'delete_po', id });
        logActivity({ userId: req.user.id, username: req.user.username, action: 'delete_po', details: logDetails });
        res.json({ success: true, message: 'PO deleted.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ msg: err.message });
    } finally { client.release(); }
});

module.exports = router;