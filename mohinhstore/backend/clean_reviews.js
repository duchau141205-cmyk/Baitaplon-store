const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log("Đã đổi DNS Server sang Google (8.8.8.8) và Cloudflare (1.1.1.1).");
} catch (e) {
    console.warn("Không thể đổi DNS Server:", e.message);
}

const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("Không tìm thấy MONGO_URI trong file .env!");
    process.exit(1);
}

async function cleanReviews() {
    try {
        console.log("Đang kết nối tới Database...");
        await mongoose.connect(MONGO_URI);
        console.log("Kết nối Database thành công!");

        console.log("Đang quét danh sách tài khoản staff và admin...");
        const staffAndAdmins = await User.find({ role: { $in: ['staff', 'admin'] } });
        const staffIds = staffAndAdmins.map(u => u._id.toString());
        console.log(`Tìm thấy ${staffIds.length} tài khoản là Staff hoặc Admin:`, staffAndAdmins.map(u => `${u.name} (${u.role})`).join(', '));

        console.log("Đang tải danh sách sản phẩm để tiến hành lọc đánh giá...");
        const products = await Product.find({});
        let totalRemoved = 0;

        for (let product of products) {
            const originalCount = product.reviews.length;
            
            // Chỉ giữ lại những đánh giá mà ID người dùng KHÔNG thuộc danh sách staff/admin
            product.reviews = product.reviews.filter(review => {
                const userIdStr = review.user.toString();
                const isStaffOrAdmin = staffIds.includes(userIdStr);
                if (isStaffOrAdmin) {
                    totalRemoved++;
                }
                return !isStaffOrAdmin;
            });

            const newCount = product.reviews.length;
            
            if (originalCount !== newCount) {
                console.log(`Sản phẩm [${product.name}]: Đã xóa ${originalCount - newCount} đánh giá của staff/admin.`);
                
                product.numReviews = newCount;
                if (newCount > 0) {
                    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / newCount;
                } else {
                    product.rating = 0;
                }
                await product.save();
            }
        }

        console.log("\n==========================================");
        console.log(`HOÀN TẤT DỌN DẸP! Đã xóa tổng cộng ${totalRemoved} đánh giá của staff/admin.`);
        console.log("Chỉ giữ lại đánh giá của khách hàng (customer).");
        console.log("==========================================");
        mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("Lỗi khi dọn dẹp đánh giá:", error);
        process.exit(1);
    }
}

cleanReviews();
