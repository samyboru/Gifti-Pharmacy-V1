// File Location: server/middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the storage destination and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // We will save files to public/uploads/prescriptions
    // The 'public' folder will be served statically
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'prescriptions');
    
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create a unique filename to prevent overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `prescription-${uniqueSuffix}${extension}`);
  }
});

// Optional: Filter to only accept images and PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB file size limit
});

module.exports = upload;