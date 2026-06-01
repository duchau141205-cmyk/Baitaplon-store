const mongoose = require('mongoose');
const Promotion = require('./models/Promotion');
require('dotenv').config();

const MONGO_URI = 'mongodb://localhost:27017/mohinh_store';

const promos = [
    {
        code: 'MOHINHVIP',
        description: 'Giảm 15% cho đơn từ 1.000.000đ, tối đa 300.000đ. Dành cho khách VIP.',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValue: 1000000,
        maxDiscountValue: 300000,
        usageLimit: 50,
        isActive: true
    },
    {
        code: 'FREESHIP50K',
        description: 'Hỗ trợ 50.000đ phí vận chuyển cho đơn từ 300.000đ.',
        discountType: 'amount',
        discountValue: 50000,
        minOrderValue: 300000,
        maxDiscountValue: 0,
        usageLimit: 200,
        isActive: true
    },
    {
        code: 'NEWBIE',
        description: 'Mừng bạn mới, giảm ngay 20% (tối đa 100.000đ) không yêu cầu đơn tối thiểu.',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 0,
        maxDiscountValue: 100000,
        usageLimit: 500,
        isActive: true
    },
    {
        code: 'SUMMER2026',
        description: 'Siêu sale mùa hè, giảm 10% (tối đa 200.000đ) cho đơn từ 500.000đ.',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 500000,
        maxDiscountValue: 200000,
        usageLimit: 100,
        isActive: true
    },
    {
        code: 'FLASHSALE',
        description: 'Giảm sốc 200.000đ cho đơn hàng khủng từ 2.000.000đ.',
        discountType: 'amount',
        discountValue: 200000,
        minOrderValue: 2000000,
        maxDiscountValue: 0,
        usageLimit: 20,
        isActive: true
    }
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        for (const promo of promos) {
            // Upsert based on code
            await Promotion.findOneAndUpdate({ code: promo.code }, promo, { upsert: true, new: true });
            console.log('Upserted promo: ' + promo.code);
        }
        console.log('All promotions added successfully.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
