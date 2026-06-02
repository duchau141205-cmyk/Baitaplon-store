const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log("Đã đổi DNS Server sang Google (8.8.8.8) và Cloudflare (1.1.1.1).");
} catch (e) {
    console.warn("Không thể đổi DNS Server:", e.message);
}

const mongoose = require('mongoose');

const cloudUri = process.argv[2];

if (!cloudUri) {
    console.error("Vui lòng cung cấp chuỗi kết nối MongoDB Atlas làm đối số!");
    console.error("Ví dụ: node migrate_db.js \"mongodb+srv://...\"");
    process.exit(1);
}

const localUri = 'mongodb://localhost:27017/mohinh_store';

async function run() {
    console.log("1. Đang kết nối tới MongoDB cục bộ...");
    const localConn = await mongoose.createConnection(localUri).asPromise();
    console.log("Kết nối MongoDB cục bộ thành công!");

    console.log("2. Đang kết nối tới MongoDB Atlas (Cloud)...");
    const cloudConn = await mongoose.createConnection(cloudUri).asPromise();
    console.log("Kết nối MongoDB Atlas thành công!");

    const collections = ['categories', 'products', 'users', 'orders', 'consultations', 'promotions'];

    for (const colName of collections) {
        console.log(`\nĐang đồng bộ collection: ${colName}...`);
        
        const localColl = localConn.collection(colName);
        const cloudColl = cloudConn.collection(colName);

        // Lấy toàn bộ tài liệu từ local
        const docs = await localColl.find({}).toArray();
        console.log(`Tìm thấy ${docs.length} tài liệu ở local.`);

        if (docs.length === 0) {
            console.log(`Bỏ qua đồng bộ vì collection ${colName} trống.`);
            continue;
        }

        // Xóa sạch dữ liệu cũ ở Cloud để tránh trùng lặp
        console.log(`Đang làm sạch dữ liệu cũ trên Cloud cho ${colName}...`);
        await cloudColl.deleteMany({});

        // Chèn dữ liệu mới vào Cloud
        console.log(`Đang chèn ${docs.length} tài liệu vào Cloud...`);
        const result = await cloudColl.insertMany(docs);
        console.log(`Thành công! Đã chèn ${result.insertedCount} tài liệu.`);
    }

    console.log("\n==========================================");
    console.log("ĐỒNG BỘ CƠ SỞ DỮ LIỆU HOÀN TẤT THÀNH CÔNG!");
    console.log("==========================================");

    await localConn.close();
    await cloudConn.close();
    process.exit(0);
}

run().catch(err => {
    console.error("Lỗi đồng bộ:", err.message);
    process.exit(1);
});
