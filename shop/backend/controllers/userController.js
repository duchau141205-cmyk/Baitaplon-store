const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const count = await User.countDocuments({});
    const users = await User.find({})
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({ users, page, pages: Math.ceil(count / pageSize) });
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const blockUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'admin') {
            res.status(400).json({ message: 'Cannot block admin' });
            return;
        }
        user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            points: updatedUser.points,
            rank: updatedUser.rank
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
const updateUserPassword = async (req, res) => {
    // Explicitly select password because it might be excluded by default or middleware
    const user = await User.findById(req.user._id).select('+password');
    const { oldPassword, newPassword } = req.body;

    if (user && (await user.matchPassword(oldPassword))) {
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Đổi mật khẩu thành công!' });
    } else {
        res.status(401).json({ message: 'Mật khẩu cũ không chính xác' });
    }
};

// @desc    Admin reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
const adminResetPassword = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.password = req.body.newPassword || '123456'; // Mặc định là 123456 nếu không truyền
        await user.save();
        res.json({ message: `Đã đặt lại mật khẩu cho ${user.name} thành công!` });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Admin update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserByAdmin = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        
        if (req.body.role) {
            user.role = req.body.role;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

module.exports = { getUsers, blockUser, updateUserProfile, updateUserPassword, adminResetPassword, updateUserByAdmin };
