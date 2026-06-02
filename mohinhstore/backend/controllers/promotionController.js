const Promotion = require('../models/Promotion');

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private/Admin
const getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find({}).sort({ createdAt: -1 });
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a promotion
// @route   POST /api/promotions
// @access  Private/Admin
const createPromotion = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscountValue,
            startDate,
            endDate,
            usageLimit,
            isActive
        } = req.body;

        if (!code || !discountValue) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã và giá trị giảm giá.' });
        }

        const formattedCode = code.toUpperCase().trim();
        const promotionExists = await Promotion.findOne({ code: formattedCode });

        if (promotionExists) {
            return res.status(400).json({ message: 'Mã khuyến mãi này đã tồn tại.' });
        }

        const promotion = await Promotion.create({
            code: formattedCode,
            description,
            discountType,
            discountValue: Number(discountValue),
            minOrderValue: Number(minOrderValue || 0),
            maxDiscountValue: Number(maxDiscountValue || 0),
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            usageLimit: Number(usageLimit || 0),
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json(promotion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a promotion
// @route   PUT /api/promotions/:id
// @access  Private/Admin
const updatePromotion = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscountValue,
            startDate,
            endDate,
            usageLimit,
            isActive
        } = req.body;

        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({ message: 'Không tìm thấy mã khuyến mãi.' });
        }

        if (code) {
            const formattedCode = code.toUpperCase().trim();
            if (formattedCode !== promotion.code) {
                const promotionExists = await Promotion.findOne({ code: formattedCode });
                if (promotionExists) {
                    return res.status(400).json({ message: 'Mã khuyến mãi này đã tồn tại.' });
                }
                promotion.code = formattedCode;
            }
        }

        promotion.description = description !== undefined ? description : promotion.description;
        promotion.discountType = discountType !== undefined ? discountType : promotion.discountType;
        promotion.discountValue = discountValue !== undefined ? Number(discountValue) : promotion.discountValue;
        promotion.minOrderValue = minOrderValue !== undefined ? Number(minOrderValue) : promotion.minOrderValue;
        promotion.maxDiscountValue = maxDiscountValue !== undefined ? Number(maxDiscountValue) : promotion.maxDiscountValue;
        promotion.startDate = startDate ? new Date(startDate) : (startDate === null ? null : promotion.startDate);
        promotion.endDate = endDate ? new Date(endDate) : (endDate === null ? null : promotion.endDate);
        promotion.usageLimit = usageLimit !== undefined ? Number(usageLimit) : promotion.usageLimit;
        promotion.isActive = isActive !== undefined ? isActive : promotion.isActive;

        const updatedPromotion = await promotion.save();
        res.json(updatedPromotion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a promotion
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
const deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({ message: 'Không tìm thấy mã khuyến mãi.' });
        }

        await promotion.deleteOne();
        res.json({ message: 'Đã xóa mã khuyến mãi.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Apply promotion code
// @route   POST /api/promotions/apply
// @access  Private
const applyPromotionCode = async (req, res) => {
    try {
        const { code, orderTotal } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã giảm giá.' });
        }

        if (orderTotal === undefined || isNaN(orderTotal)) {
            return res.status(400).json({ message: 'Tổng giá trị đơn hàng không hợp lệ.' });
        }

        const formattedCode = code.toUpperCase().trim();
        const promotion = await Promotion.findOne({ code: formattedCode });

        if (!promotion) {
            return res.status(400).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' });
        }

        if (!promotion.isActive) {
            return res.status(400).json({ message: 'Mã giảm giá này đã bị vô hiệu hóa.' });
        }

        const now = new Date();
        if (promotion.startDate && now < new Date(promotion.startDate)) {
            return res.status(400).json({ message: 'Mã giảm giá chưa đến thời gian áp dụng.' });
        }

        if (promotion.endDate && now > new Date(promotion.endDate)) {
            return res.status(400).json({ message: 'Mã giảm giá đã hết hạn sử dụng.' });
        }

        if (promotion.usageLimit > 0 && promotion.usageCount >= promotion.usageLimit) {
            return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng.' });
        }

        const numericOrderTotal = Number(orderTotal);
        if (numericOrderTotal < promotion.minOrderValue) {
            return res.status(400).json({ 
                message: `Đơn hàng tối thiểu phải đạt ${promotion.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã.` 
            });
        }

        let discount = 0;
        if (promotion.discountType === 'percentage') {
            discount = numericOrderTotal * (promotion.discountValue / 100);
            if (promotion.maxDiscountValue > 0 && discount > promotion.maxDiscountValue) {
                discount = promotion.maxDiscountValue;
            }
        } else if (promotion.discountType === 'amount') {
            discount = promotion.discountValue;
        }

        // Discount cannot be larger than order total
        if (discount > numericOrderTotal) {
            discount = numericOrderTotal;
        }

        res.json({
            code: promotion.code,
            discountAmount: Math.round(discount),
            discountType: promotion.discountType,
            discountValue: promotion.discountValue
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active promotions for customers
// @route   GET /api/promotions/active
// @access  Public
const getActivePromotions = async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            $or: [{ startDate: null }, { startDate: { $lte: now } }],
            $or: [{ endDate: null }, { endDate: { $gte: now } }]
        }).sort({ discountValue: -1 });
        
        // Filter out those that hit usage limit
        const validPromotions = promotions.filter(p => p.usageLimit === 0 || p.usageCount < p.usageLimit);
        
        // Send a safe subset of data
        const publicPromotions = validPromotions.map(p => ({
            code: p.code,
            description: p.description,
            discountType: p.discountType,
            discountValue: p.discountValue,
            minOrderValue: p.minOrderValue,
            maxDiscountValue: p.maxDiscountValue,
            endDate: p.endDate
        }));

        res.json(publicPromotions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    applyPromotionCode,
    getActivePromotions
};
