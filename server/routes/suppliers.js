// File Location: server/routes/suppliers.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const logActivity = require('../utils/logger');
const { body, param, validationResult } = require('express-validator'); // <-- ADDED for validation
const pharmacistMiddleware = require('../middleware/pharmacistMiddleware'); // <-- ADDED for role control
const adminMiddleware = require('../middleware/adminMiddleware'); // <-- ADDED for role control

// Protect all routes in this file
router.use(authMiddleware);

// Helper for handling validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private (All authenticated users can view)
router.get('/', async (req, res) => {
  try {
    const allSuppliers = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(allSuppliers.rows);
  } catch (err) {
    console.error("GET Suppliers Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   POST /api/suppliers
// @desc    Create a new supplier
// @access  Private (Pharmacist or Admin)
router.post('/', pharmacistMiddleware, [ // <-- APPLIED: Role-based access control
    body('name', 'Supplier name is required').notEmpty().trim().escape(),
    body('contact_person').optional({ checkFalsy: true }).trim().escape(),
    body('email', 'Please provide a valid email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isString().trim().escape(),
], handleValidationErrors, async (req, res) => {
  const { name, contact_person, email, phone } = req.body;
  try {
    const newSupplier = await pool.query(
      'INSERT INTO suppliers (name, contact_person, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, contact_person, email, phone]
    );
    const logDetails = JSON.stringify({ key: 'supplier_created', name });
    logActivity({ userId: req.user.id, username: req.user.username, action: 'supplier_created', details: logDetails });
    res.status(201).json(newSupplier.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ msg: `A supplier with the name '${name}' or email '${email}' already exists.` });
    }
    console.error("POST Supplier Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update a supplier
// @access  Private (Pharmacist or Admin)
router.put('/:id', pharmacistMiddleware, [ // <-- APPLIED: Role-based access control
    param('id', 'Supplier ID must be an integer').isInt(),
    body('name', 'Supplier name is required').notEmpty().trim().escape(),
    body('contact_person').optional({ checkFalsy: true }).trim().escape(),
    body('email', 'Please provide a valid email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isString().trim().escape(),
], handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  const { name, contact_person, email, phone } = req.body;
  try {
    const updatedSupplier = await pool.query(
      'UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4 WHERE id = $5 RETURNING *',
      [name, contact_person, email, phone, id]
    );
    if (updatedSupplier.rows.length === 0) {
      return res.status(404).json({ msg: 'Supplier not found' });
    }
    const logDetails = JSON.stringify({ key: 'supplier_updated', name });
    logActivity({ userId: req.user.id, username: req.user.username, action: 'supplier_updated', details: logDetails });
    res.json(updatedSupplier.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ msg: `Another supplier with the name '${name}' or email '${email}' already exists.` });
    }
    console.error("PUT Supplier Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Delete a supplier
// @access  Private (Admin Only)
router.delete('/:id', adminMiddleware, [ // <-- APPLIED: Stricter Admin-only access for deletion
    param('id', 'Supplier ID must be an integer').isInt(),
], handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Security: Check if supplier is linked to any inventory items before deleting.
    const inventoryLinkCheck = await client.query('SELECT id FROM inventory_items WHERE supplier_id = $1 LIMIT 1', [id]);
    if (inventoryLinkCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ msg: 'Cannot delete supplier. It is still linked to one or more inventory items.' });
    }
    const deleteOp = await client.query('DELETE FROM suppliers WHERE id = $1 RETURNING name', [id]);
    if (deleteOp.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ msg: 'Supplier not found' });
    }
    await client.query('COMMIT');
    const logDetails = JSON.stringify({ key: 'supplier_deleted', name: deleteOp.rows[0].name });
    logActivity({ userId: req.user.id, username: req.user.username, action: 'supplier_deleted', details: logDetails });
    res.json({ msg: 'Supplier deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    // Security: Check for foreign key constraints from other tables like `purchase_orders`.
    if (err.code === '23503') {
        return res.status(400).json({ msg: 'Cannot delete supplier as it is referenced in purchase orders or other records.' });
    }
    console.error("DELETE Supplier Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  } finally {
    client.release();
  }
});

module.exports = router;