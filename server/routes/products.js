// File Location: server/routes/products.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const logActivity = require('../utils/logger');
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

router.use(authMiddleware);

// =============================================================================
//  SEARCH ROUTE (FIXED)
// =============================================================================
// @route   GET /api/products/search
// @desc    Search products by name, brand, or category
router.get('/search', [
    query('query').notEmpty().withMessage('Query is required')
], handleValidationErrors, async (req, res) => {
    const { query } = req.query;
    try {
        // FIX: Removed 'quantity_in_stock' and 'selling_price' as they are in the inventory table
        const results = await pool.query(
            `SELECT id, name, brand, category 
             FROM products 
             WHERE 
                name ILIKE $1 OR 
                brand ILIKE $1 OR 
                category ILIKE $1 
             LIMIT 10`,
            [`%${query}%`]
        );
        res.json(results.rows);
    } catch (err) {
        console.error("Product Search Error:", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

// =============================================================================
//  STANDARD CRUD ROUTES
// =============================================================================

// @route   GET /api/products
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/products/:id
router.get('/:id', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/products
router.post('/', [
    body('name').notEmpty(),
    body('category').notEmpty(),
], handleValidationErrors, async (req, res) => {
    const rawRoles = req.user.roles || req.user.role || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    if (!userRoles.includes('admin') && !userRoles.includes('pharmacist')) {
        return res.status(403).json({ msg: 'Access Denied' });
    }

    const { name, brand, category, description, requires_prescription, min_stock_level } = req.body;

    try {
        const newProduct = await pool.query(
            `INSERT INTO products (name, brand, category, description, requires_prescription, min_stock_level) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, brand, category, description, requires_prescription || false, min_stock_level || 10]
        );
        
        const logDetails = JSON.stringify({ key: 'product_created', name });
        logActivity({ userId: req.user.id, username: req.user.username, action: 'product_created', details: logDetails });

        res.status(201).json(newProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/products/:id
router.put('/:id', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const rawRoles = req.user.roles || req.user.role || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    if (!userRoles.includes('admin') && !userRoles.includes('pharmacist')) {
        return res.status(403).json({ msg: 'Access Denied' });
    }

    const { id } = req.params;
    const { name, brand, category, description, requires_prescription, min_stock_level } = req.body;

    try {
        const updateProduct = await pool.query(
            `UPDATE products 
             SET name = $1, brand = $2, category = $3, description = $4, requires_prescription = $5, min_stock_level = $6 
             WHERE id = $7 RETURNING *`,
            [name, brand, category, description, requires_prescription, min_stock_level, id]
        );

        if (updateProduct.rows.length === 0) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        const logDetails = JSON.stringify({ key: 'product_updated', name });
        logActivity({ userId: req.user.id, username: req.user.username, action: 'product_updated', details: logDetails });

        res.json(updateProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/products/:id
router.delete('/:id', [param('id').isInt()], handleValidationErrors, async (req, res) => {
    const rawRoles = req.user.roles || req.user.role || [];
    const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    if (!userRoles.includes('admin')) {
        return res.status(403).json({ msg: 'Access Denied: Only Admins can delete products.' });
    }

    const { id } = req.params;
    try {
        const deleteProduct = await pool.query('DELETE FROM products WHERE id = $1 RETURNING name', [id]);
        if (deleteProduct.rows.length === 0) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        const logDetails = JSON.stringify({ key: 'product_deleted', name: deleteProduct.rows[0].name });
        logActivity({ userId: req.user.id, username: req.user.username, action: 'product_deleted', details: logDetails });

        res.json({ msg: 'Product deleted' });
    } catch (err) {
        console.error(err.message);
        if (err.code === '23503') {
            return res.status(400).json({ msg: 'Cannot delete product: It is part of existing inventory or sales records.' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;