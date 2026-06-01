const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'Email đã được sử dụng' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
        phone: req.body.phone || '',
        role: 'customer' // Luôn đăng ký là customer
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            points: user.points || 0,
            rank: user.rank || 'Bronze',
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
};

// @desc    Login for customer
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isActive) {
            res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa' });
            return;
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            points: user.points || 0,
            rank: user.rank || 'Bronze',
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
};

// @desc    Login for admin
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.role !== 'admin' && user.role !== 'staff') {
            res.status(403).json({ message: 'Truy cập bị từ chối. Tài khoản không có quyền truy cập.' });
            return;
        }

        if (!user.isActive) {
            res.status(401).json({ message: 'Tài khoản của bạn đã bị khóa' });
            return;
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is set by the auth middleware (protect)
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Reset password (forgot password)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu mới' });
        return;
    }

    if (newPassword.length < 6) {
        res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        return;
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
        return;
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
};

module.exports = { register, login, adminLogin, getMe, forgotPassword };
