const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        totalPrice,
        notes,
        promoCode
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        const Product = require('../models/Product');
        
        // Check stock for all items first
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${item.name}` });
            }
            if (product.countInStock < item.qty) {
                return res.status(400).json({ message: `Sản phẩm "${product.name}" chỉ còn ${product.countInStock} trong kho. Vui lòng giảm số lượng.` });
            }
        }

        // Deduct stock and increment sold count
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            product.countInStock -= item.qty;
            product.sold = (product.sold || 0) + item.qty;
            await product.save();
        }

        // Process promotion
        const Promotion = require('../models/Promotion');
        let checkedDiscount = 0;
        let finalPromoCode = '';

        // Calculate subtotal
        let subtotal = 0;
        for (const item of orderItems) {
            subtotal += Number(item.price) * Number(item.qty);
        }

        if (promoCode) {
            const formattedCode = promoCode.toUpperCase().trim();
            const promotion = await Promotion.findOne({ code: formattedCode });
            if (promotion) {
                if (promotion.isActive) {
                    const now = new Date();
                    const startValid = !promotion.startDate || now >= new Date(promotion.startDate);
                    const endValid = !promotion.endDate || now <= new Date(promotion.endDate);
                    const limitValid = promotion.usageLimit === 0 || promotion.usageCount < promotion.usageLimit;
                    const minSpendValid = subtotal >= promotion.minOrderValue;

                    if (startValid && endValid && limitValid && minSpendValid) {
                        if (promotion.discountType === 'percentage') {
                            checkedDiscount = subtotal * (promotion.discountValue / 100);
                            if (promotion.maxDiscountValue > 0 && checkedDiscount > promotion.maxDiscountValue) {
                                checkedDiscount = promotion.maxDiscountValue;
                            }
                        } else if (promotion.discountType === 'amount') {
                            checkedDiscount = promotion.discountValue;
                        }

                        if (checkedDiscount > subtotal) {
                            checkedDiscount = subtotal;
                        }
                        checkedDiscount = Math.round(checkedDiscount);
                        finalPromoCode = promotion.code;

                        // Increment usage count
                        promotion.usageCount += 1;
                        await promotion.save();
                    }
                }
            }
        }

        const calculatedTotalPrice = Math.max(0, subtotal - checkedDiscount);

        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            totalPrice: calculatedTotalPrice,
            notes,
            promoCode: finalPromoCode,
            discountAmount: checkedDiscount
        });

        const createdOrder = await order.save();

        // Award points immediately upon order creation as requested
        const user = await User.findById(req.user._id);
        if (user) {
            const numericTotalPrice = Number(calculatedTotalPrice);
            if (!isNaN(numericTotalPrice)) {
                const pointsEarned = Math.floor(numericTotalPrice / 10000);
                if (pointsEarned > 0) {
                    user.points = (user.points || 0) + pointsEarned;
                    
                    // Update rank based on points
                    if (user.points >= 10000) user.rank = 'Diamond';
                    else if (user.points >= 5000) user.rank = 'Platinum';
                    else if (user.points >= 2000) user.rank = 'Gold';
                    else if (user.points >= 500) user.rank = 'Silver';
                    
                    await user.save();
                }
            }
        }

        res.status(201).json(createdOrder);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    const { status, startDate, endDate } = req.query;
    let query = {};

    if (status) {
        query.status = status;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    const orders = await Order.find(query).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = 'Delivered';

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        const oldStatus = order.status;
        order.status = status;
        
        if (status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Delete order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        await Order.deleteOne({ _id: req.params.id });
        res.json({ message: 'Order removed' });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order items (for admin to edit/delete products in order)
// @route   PUT /api/admin/orders/:id/items
// @access  Private/Admin
const updateOrderItems = async (req, res) => {
    const { orderItems } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        order.orderItems = orderItems;
        
        // Recalculate total price based on the new items
        let total = 0;
        for (const item of orderItems) {
            total += Number(item.price) * Number(item.qty);
        }
        order.totalPrice = total;

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order customer info
// @route   PUT /api/admin/orders/:id/customer
// @access  Private/Admin
const updateOrderCustomer = async (req, res) => {
    const { name, phone, address } = req.body;
    const order = await Order.findById(req.params.id).populate('user');

    if (order) {
        if (order.user && name) {
            const User = require('../models/User');
            const user = await User.findById(order.user._id);
            if (user) {
                user.name = name;
                await user.save();
            }
        }
        if (phone) order.shippingAddress.phone = phone;
        if (address) {
            // Assume address includes city or is just a single string for simplicity
            order.shippingAddress.address = address;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderToDelivered,
    updateOrderStatus,
    deleteOrder,
    updateOrderItems,
    updateOrderCustomer
};
