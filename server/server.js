// File Location: server/server.js

const express = require('express');
const mongoose = require('mongoose'); // <--- ADDED THIS
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(helmet());

// --- 1. FIXED CORS FOR CLOUD DEPLOYMENT ---
const allowedOrigins = [
  'http://localhost:5173',           // Your local frontend
  'https://my-frontend.vercel.app',  // <--- YOU WILL REPLACE THIS LATER WITH YOUR VERCEL URL
  undefined                          // Allows Postman/Backend testing
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // If the origin is in our allowed list, let it pass
        // OR if the origin ends with .vercel.app (Dynamic check)
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Essential for your cookies
}));

app.use(express.json());
app.use(cookieParser());

// --- 2. ADDED MONGODB CONNECTION HERE ---
console.log("Debug Mongo URI:", process.env.MONGO_URI); 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.use(express.static(path.join(__dirname, 'public')));

// Import Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const suppliersRoutes = require('./routes/suppliers');
const salesRoutes = require('./routes/sales');
const purchaseOrdersRoutes = require('./routes/purchaseOrders');
const dashboardRoutes = require('./routes/dashboard');
const activityLogRoutes = require('./routes/activityLog');
const inventoryRoutes = require('./routes/inventory');
const doctorsRoutes = require('./routes/doctors');
const prescriptionsRoutes = require('./routes/prescriptions');
const notificationsRoutes = require('./routes/notifications');
const notificationService = require('./services/notificationService');
const reportsRoutes = require('./routes/reports');

// Services
//try {
  //  notificationService.generateAlerts();
   // setInterval(() => {
   //     notificationService.generateAlerts();
   // }, 3600000);
//} catch (error) {
   // console.log("Notification service warning:", error.message);
//}

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);

// Root Route (Important for Glitch health check)
app.get('/', (req, res) => {
    res.send('Backend is running successfully!');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend server started on port ${PORT}`));