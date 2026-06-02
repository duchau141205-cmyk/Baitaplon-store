const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const getDateFilter = (period) => {
    if (!period || period === 'all') {
        return {};
    }
    const now = new Date();
    let start;
    if (period === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'month') {
        start = new Date();
        start.setDate(start.getDate() - 30);
    } else if (period === 'week') {
        start = new Date();
        start.setDate(start.getDate() - 7);
    } else {
        return {};
    }
    return { createdAt: { $gte: start } };
};

// @desc    Get summary stats
// @route   GET /api/admin/reports/summary
// @access  Private/Admin
const getSummary = async (req, res) => {
    const dateFilter = getDateFilter(req.query.period);
    const numProducts = await Product.countDocuments({});
    const numOrders = await Order.countDocuments(dateFilter);
    const numUsers = await User.countDocuments({ role: 'customer' });

    const totalRevenueResult = await Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, ...dateFilter } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);

    const totalRevenue = (req.user && req.user.role === 'staff')
        ? 0
        : (totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0);

    res.json({
        numProducts,
        numOrders,
        numUsers,
        totalRevenue
    });
};

// @desc    Get revenue stats over time
// @route   GET /api/admin/reports/revenue
// @access  Private/Admin
const getRevenue = async (req, res) => {
    const { period } = req.query;
    let groupBy = {};
    let sort = {};

    if (period === 'year') {
        groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
        sort = { '_id.year': 1, '_id.month': 1 };
    } else if (period === 'month') {
        groupBy = { month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
        sort = { '_id.month': 1, '_id.day': 1 };
    } else { // week (default)
        groupBy = { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } };
        sort = { '_id.date': 1 };
    }

    const dateFilter = getDateFilter(period);

    const revenueData = await Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, ...dateFilter } },
        {
            $group: {
                _id: groupBy,
                total: { $sum: '$totalPrice' }
            }
        },
        { $sort: sort }
    ]);

    res.json(revenueData);
};

// @desc    Get top 5 best-selling products
// @route   GET /api/admin/reports/top-products
// @access  Private/Admin
const getTopProducts = async (req, res) => {
    try {
        const dateFilter = getDateFilter(req.query.period);
        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' }, ...dateFilter } },
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.product',
                    name: { $first: '$orderItems.name' },
                    image: { $first: '$orderItems.image' },
                    price: { $first: '$orderItems.price' },
                    sold: { $sum: '$orderItems.qty' }
                }
            },
            { $sort: { sold: -1 } }
        ]);
        res.json(topProducts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy top sản phẩm', error: error.message });
    }
};

module.exports = {
    getSummary,
    getRevenue,
    getTopProducts
};
