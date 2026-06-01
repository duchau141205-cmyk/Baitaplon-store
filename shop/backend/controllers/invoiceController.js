const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get full order invoice data
// @route   GET /api/admin/orders/:id/invoice
// @access  Private/Admin|Staff
const getOrderInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        // Build invoice data
        const invoiceData = {
            invoiceNumber: `MHS-${order._id.toString().slice(-8).toUpperCase()}`,
            orderId: order._id,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt || new Date(),
            customer: {
                name: order.user ? order.user.name : (order.shippingAddress.fullName || 'Khách hàng'),
                email: order.user ? order.user.email : '',
                phone: order.shippingAddress.phone || '',
                address: order.shippingAddress.address || '',
                city: order.shippingAddress.city || '',
            },
            items: order.orderItems.map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.price,
                subtotal: item.qty * item.price,
                image: item.image,
            })),
            paymentMethod: order.paymentMethod,
            totalPrice: order.totalPrice,
            promoCode: order.promoCode || '',
            discountAmount: order.discountAmount || 0,
            status: order.status,
            notes: order.notes || '',
        };

        res.json(invoiceData);
    } catch (err) {
        console.error('Invoice error:', err);
        res.status(500).json({ message: 'Lỗi server khi tạo hóa đơn' });
    }
};

module.exports = { getOrderInvoice };
