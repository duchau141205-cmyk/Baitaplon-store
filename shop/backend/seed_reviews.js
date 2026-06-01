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

const reviewTemplates = [
    { rating: 5, comment: "Mô hình rất đẹp, sắc nét và chi tiết cực kỳ. Giao hàng nhanh và bọc hàng rất kỹ." },
    { rating: 5, comment: "Sản phẩm chất lượng tuyệt vời, màu sơn mịn không bị lem. Giá cả rất hợp lý so với chất lượng." },
    { rating: 5, comment: "Tuyệt cú mèo! Nhìn ngoài đời thực sự ngầu và to đẹp hơn cả trên hình nữa." },
    { rating: 5, comment: "Mô hình chính hãng chất lượng cao, các khớp chuyển động cực kỳ mượt mà." },
    { rating: 5, comment: "Nhân viên hỗ trợ tư vấn nhiệt tình, đóng gói hàng chuyên nghiệp 2 lớp xốp bong bóng." },
    { rating: 4, comment: "Hàng đẹp nhưng hộp hơi móp một chút do bên vận chuyển, sản phẩm bên trong vẫn nguyên vẹn 100%." },
    { rating: 4, comment: "Chất liệu nhựa cao cấp cầm đầm tay, chi tiết lên màu rất nét. Rất đáng tiền." },
    { rating: 5, comment: "Đẹp long lanh luôn, mua làm quà tặng bạn bè ai cũng trầm trồ thích thú." },
    { rating: 4, comment: "Mức độ hoàn thiện tốt, các chi tiết nhỏ sắc sảo, khớp hơi cứng một chút nhưng khớp giữ tư thế tốt." },
    { rating: 5, comment: "Tuyệt vời, shop uy tín, phản hồi khách hàng rất nhanh. Sẽ tiếp tục ủng hộ shop lâu dài." },
    { rating: 5, comment: "Mô hình lắp ráp khít, nhựa dẻo dai khó gãy, sách hướng dẫn rõ ràng chi tiết." }
];

async function seedReviews() {
    try {
        console.log("Đang kết nối tới Database...");
        await mongoose.connect(MONGO_URI);
        console.log("Kết nối Database thành công!");

        console.log("Đang tải danh sách người dùng...");
        const users = await User.find({});
        if (users.length === 0) {
            console.error("Không tìm thấy người dùng nào trong database để viết đánh giá!");
            process.exit(1);
        }
        console.log(`Tìm thấy ${users.length} người dùng.`);

        console.log("Đang tải danh sách sản phẩm...");
        const products = await Product.find({});
        console.log(`Tìm thấy ${products.length} sản phẩm.`);

        for (let product of products) {
            console.log(`Đang tạo đánh giá cho sản phẩm: ${product.name}`);
            
            // Xóa sạch đánh giá cũ nếu có để tránh trùng lặp khi chạy lại script
            product.reviews = [];

            // Chọn số lượng review ngẫu nhiên từ 2 đến 4
            const numReviewsToCreate = Math.floor(Math.random() * 3) + 2; 
            const chosenUsers = new Set();

            while (chosenUsers.size < Math.min(numReviewsToCreate, users.length)) {
                const randomUserIndex = Math.floor(Math.random() * users.length);
                chosenUsers.add(users[randomUserIndex]);
            }

            const reviewList = [];
            for (let user of chosenUsers) {
                // Chọn một mẫu review ngẫu nhiên
                const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
                
                reviewList.push({
                    name: user.name,
                    rating: template.rating,
                    comment: template.comment,
                    user: user._id,
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)) // ngẫu nhiên trong vòng 10 ngày qua
                });
            }

            product.reviews = reviewList;
            product.numReviews = reviewList.length;
            product.rating = reviewList.reduce((acc, item) => item.rating + acc, 0) / reviewList.length;

            await product.save();
        }

        console.log("\n==========================================");
        console.log("ĐÃ TẠO ĐÁNH GIÁ MẪU CHO TOÀN BỘ SẢN PHẨM!");
        console.log("==========================================");
        mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("Lỗi khi tạo đánh giá mẫu:", error);
        process.exit(1);
    }
}

seedReviews();
