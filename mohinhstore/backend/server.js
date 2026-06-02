const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.warn("Không thể đổi DNS Server:", e.message);
}

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const customerRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminCategoryRoutes = require('./routes/adminCategoryRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const authRoutes = require('./routes/authRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config({ override: true });

connectDB();

const app = express();

const path = require('path');

app.use(cors({
    origin: function(origin, callback) {
        // Cho phép requests không có origin (mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        // Cho phép localhost dev và tất cả subdomain của onrender.com
        const allowed = [
            'http://localhost:5000',
            'http://localhost:3000',
            'http://127.0.0.1:5000'
        ];
        if (allowed.includes(origin) || origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(null, true); // Cho phép tất cả trong giai đoạn đầu
    },
    credentials: true
}));
app.use(express.json());

const { protect } = require('./middleware/auth');
const { updateUserPassword } = require('./controllers/userController');

// API Routes (Prioritize these)
app.put('/api/users/password', protect, updateUserPassword);
app.use('/api/users', customerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend', 'all pe')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'all pe', 'index.html'));
});

// Error Handling Middleware
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// Graceful shutdown to fix port in use errors during restarts
const mongoose = require('mongoose');

const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing MongoDB', err);
            process.exit(1);
        }
    });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', () => {
    server.close(async () => {
        await mongoose.connection.close();
        process.kill(process.pid, 'SIGUSR2');
    });
});
