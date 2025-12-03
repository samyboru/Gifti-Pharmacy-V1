// File Location: server/routes/doctors.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const logActivity = require('../utils/logger');

router.use(authMiddleware);

// @route   GET /api/doctors
// @desc    Get a list of all doctors
// @access  Private
router.get('/', async (req, res) => {
  try {
    const doctors = await pool.query('SELECT id, name FROM doctors ORDER BY name ASC');
    res.json(doctors.rows);
  } catch (err) {
    console.error("GET Doctors Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

// @route   POST /api/doctors
// @desc    Create a new doctor
// @access  Private
router.post('/', async (req, res) => {
    const { name, license_number, specialty } = req.body;
    if (!name || !license_number) {
        return res.status(400).json({ msg: 'Doctor name and license number are required.' });
    }
    try {
        const newDoctor = await pool.query(
            'INSERT INTO doctors (name, license_number, specialty) VALUES ($1, $2, $3) RETURNING *',
            [name, license_number, specialty]
        );

        const logDetails = JSON.stringify({ key: 'doctor_created', name });
        logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'doctor_created',
            details: logDetails
        });

        res.status(201).json(newDoctor.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'A doctor with this license number already exists.' });
        }
        console.error("POST Doctor Error:", err.message);
        res.status(500).send({ msg: 'Server Error' });
    }
});

module.exports = router;