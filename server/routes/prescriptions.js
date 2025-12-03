// File Location: server/routes/prescriptions.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const logActivity = require('../utils/logger');
const upload = require('../middleware/upload');

router.use(authMiddleware);

// @route   POST /api/prescriptions
// @desc    Create a new prescription record, with optional file upload
// @access  Private
router.post('/', upload.single('prescriptionFile'), async (req, res) => {
  const { patient_name, doctor_id, product_id } = req.body;
  const pharmacist_id_verified = req.user.id;
  const filePath = req.file ? `/uploads/prescriptions/${req.file.filename}` : null;

  if (!patient_name || !doctor_id || !product_id) {
    return res.status(400).json({ msg: 'Patient, doctor, and product are required.' });
  }

  try {
    const newPrescription = await pool.query(
      `INSERT INTO prescriptions (patient_name, doctor_id, product_id, status, date_issued, pharmacist_id_verified, file_path)
       VALUES ($1, $2, $3, 'Verified', CURRENT_DATE, $4, $5) RETURNING id`,
      [patient_name, doctor_id, product_id, pharmacist_id_verified, filePath]
    );

    const newPrescriptionId = newPrescription.rows[0].id;
    
    const logDetails = JSON.stringify({ key: 'prescription_verified', id: newPrescriptionId, patient: patient_name });
    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'prescription_verified',
      details: logDetails
    });

    res.status(201).json({ prescriptionId: newPrescriptionId });
  } catch (err) {
    console.error("Create Prescription Error:", err.message);
    res.status(500).send({ msg: 'Server Error' });
  }
});

module.exports = router;