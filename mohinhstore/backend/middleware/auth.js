const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, req_res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return req_res.status(401).json({ message: 'Người dùng không tồn tại hoặc đã bị xóa' });
            }
            return next();
        } catch (error) {
            console.error(error);
            return req_res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return req_res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, req_res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        req_res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const adminOrStaff = (req, req_res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
        next();
    } else {
        req_res.status(401).json({ message: 'Not authorized as admin or staff' });
    }
};

module.exports = { protect, admin, adminOrStaff };
