const Consultation = require('../models/Consultation');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');

let sseClients = [];

const notifyClients = () => {
    sseClients.forEach(client => {
        try {
            client.write(`data: REFRESH\n\n`);
        } catch(e) {
            console.error('SSE send error:', e);
        }
    });
};

// @desc    Create new consultation request
// @route   POST /api/consultations
// @access  Public
const createConsultation = async (req, res) => {
    const { name, email, phone, service, date, time, notes, userId } = req.body;

    if (!name || !phone) {
        res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên và Số điện thoại)' });
        return;
    }

    const consultation = await Consultation.create({
        name,
        email,
        phone,
        service,
        date,
        time,
        notes,
        user: userId || undefined
    });

    if (consultation) {
        notifyClients();
        res.status(201).json(consultation);
    } else {
        res.status(400).json({ message: 'Dữ liệu yêu cầu không hợp lệ' });
    }
};

// @desc    Get all consultations
// @route   GET /api/admin/consultations
// @access  Private (Admin/Staff)
const getConsultations = async (req, res) => {
    const consultations = await Consultation.find({}).sort({ createdAt: -1 });
    res.json(consultations);
};

// @desc    Update consultation status
// @route   PUT /api/admin/consultations/:id/status
// @access  Private (Admin/Staff)
const updateConsultationStatus = async (req, res) => {
    const { status } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (consultation) {
        consultation.status = status || consultation.status;
        const updated = await consultation.save();
        notifyClients();
        res.json(updated);
    } else {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
    }
};

// @desc    Update full consultation details (name, email, phone, service, notes)
// @route   PUT /api/admin/consultations/:id
// @access  Private (Admin/Staff)
const updateConsultationDetails = async (req, res) => {
    const { name, email, phone, service, notes } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (consultation) {
        consultation.name = name || consultation.name;
        consultation.email = email !== undefined ? email : consultation.email;
        consultation.phone = phone || consultation.phone;
        consultation.service = service || consultation.service;
        consultation.notes = notes !== undefined ? notes : consultation.notes;

        const updated = await consultation.save();
        notifyClients();
        res.json(updated);
    } else {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
    }
};

// @desc    Delete consultation
// @route   DELETE /api/admin/consultations/:id
// @access  Private (Admin only)
const deleteConsultation = async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);

    if (consultation) {
        await consultation.deleteOne();
        res.json({ message: 'Đã xóa yêu cầu tư vấn thành công' });
    } else {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
    }
};

const handleSseStream = (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');
    sseClients.push(res);
    req.on('close', () => {
        sseClients = sseClients.filter(c => c !== res);
    });
};

const getMyConsultations = async (req, res) => {
    const consultations = await Consultation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(consultations);
};

const getConsultationById = async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }
    if (consultation.user && consultation.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'Không có quyền truy cập yêu cầu này' });
        return;
    }
    res.json(consultation);
};

const getConsultationByIdForStaff = async (req, res) => {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }
    res.json(consultation);
};

const generateAiResponse = async (userQuery) => {
    const query = userQuery.toLowerCase().trim();
    
    // 1. Check greeting
    if (query.match(/\b(chào|hello|hi|alo|chao|kính chào|kinh chao)\b/)) {
        return "Xin chào! Tôi là Trợ lý AI của Mô Hình Store. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi về các mẫu mô hình, chương trình khuyến mãi, địa chỉ cửa hàng hoặc chính sách giao hàng nhé!";
    }

    // 2. Check Gundam
    if (query.includes('gundam') || query.includes('gunpla') || query.includes('robot')) {
        try {
            const gundamProducts = await Product.find({ name: { $regex: 'gundam', $options: 'i' } }).limit(3);
            if (gundamProducts && gundamProducts.length > 0) {
                const list = gundamProducts.map(p => `- ${p.name} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice || p.price)})`).join('\n');
                return `Dạ, Mô Hình Store đang sẵn hàng các dòng mô hình Gundam cao cấp và bán rất chạy:\n${list}\n\nBạn có muốn tôi tư vấn chi tiết hơn về mẫu nào không ạ?`;
            }
        } catch (e) {
            console.error('Error fetching Gundam for AI:', e);
        }
        return "Dạ, shop có rất nhiều mẫu mô hình Gundam (HG, RG, MG, PG) chính hãng Bandai Nhật Bản. Bạn cần tìm mẫu Gundam của series nào ạ?";
    }

    // 3. Check Cars
    if (query.includes('xe') || query.includes('oto') || query.includes('ô tô') || query.includes('lamborghini') || query.includes('ferrari') || query.includes('car') || query.includes('siêu xe')) {
        try {
            const carProducts = await Product.find({ 
                $or: [
                    { name: { $regex: 'car', $options: 'i' } },
                    { name: { $regex: 'xe', $options: 'i' } },
                    { name: { $regex: 'lambo', $options: 'i' } }
                ]
            }).limit(3);
            if (carProducts && carProducts.length > 0) {
                const list = carProducts.map(p => `- ${p.name} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice || p.price)})`).join('\n');
                return `Dạ, shop đang có sẵn các mẫu mô hình siêu xe tĩnh tỉ lệ cao cấp vô cùng sắc nét:\n${list}\n\nBạn quan tâm đến dòng xe đua hay xe dân dụng ạ?`;
            }
        } catch (e) {
            console.error('Error fetching Cars for AI:', e);
        }
        return "Mô Hình Store chuyên cung cấp các mẫu mô hình siêu xe kim loại, xe tĩnh tỉ lệ (1:24, 1:18, 1:36) chính hãng từ các thương hiệu Bburago, Maisto, Rastar. Bạn muốn tìm thương hiệu hoặc mẫu xe cụ thể nào không?";
    }

    // 4. Check plane / aircraft
    if (query.includes('máy bay') || query.includes('may bay') || query.includes('plane') || query.includes('flight')) {
        try {
            const planeProducts = await Product.find({ 
                $or: [
                    { name: { $regex: 'máy bay', $options: 'i' } },
                    { name: { $regex: 'bay', $options: 'i' } },
                    { name: { $regex: 'plane', $options: 'i' } }
                ]
            }).limit(3);
            if (planeProducts && planeProducts.length > 0) {
                const list = planeProducts.map(p => `- ${p.name} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice || p.price)})`).join('\n');
                return `Shop đang có sẵn các mô hình máy bay quân sự và dân dụng rất hot:\n${list}\n\nCác mô hình đều có chân đế trưng bày rất sang trọng ạ!`;
            }
        } catch (e) {
            console.error('Error fetching Planes for AI:', e);
        }
        return "Shop có các mẫu mô hình máy bay dân dụng (Boeing, Airbus) và máy bay tiêm kích quân sự tỉ lệ chuẩn, chất liệu hợp kim cao cấp. Bạn đang tìm mẫu máy bay nào ạ?";
    }

    // 5. Check promotion / discount
    if (query.includes('khuyến mãi') || query.includes('khuyen mai') || query.includes('giảm giá') || query.includes('giam gia') || query.includes('voucher') || query.includes('code') || query.includes('mã')) {
        try {
            const now = new Date();
            const promotions = await Promotion.find({
                isActive: true,
                $and: [
                    { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
                    { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
                ]
            }).limit(3);
            if (promotions && promotions.length > 0) {
                const list = promotions.map(p => `- **${p.code}**: ${p.description}`).join('\n');
                return `Chào bạn! Hiện tại Mô Hình Store đang chạy các chương trình ưu đãi rất hấp dẫn:\n${list}\n\nBạn có thể sao chép và nhập mã khuyến mãi này tại trang thanh toán để được giảm giá ngay nhé!`;
            }
        } catch (e) {
            console.error('Error fetching promos for AI:', e);
        }
        return "Chào bạn, shop luôn dành các mã giảm giá cho khách hàng mới (Mã: NEWBIE giảm 20%) và miễn phí vận chuyển cho đơn từ 300k (Mã: FREESHIP50K). Mời bạn vào phần Khuyến mãi trên trang chủ để xem chi tiết nhé!";
    }

    // 6. Check shipping
    if (query.includes('ship') || query.includes('vận chuyển') || query.includes('van chuyen') || query.includes('giao hàng') || query.includes('giao hang') || query.includes('bao lâu') || query.includes('bao lau')) {
        return "Mô Hình Store hỗ trợ giao hàng toàn quốc:\n- Nội thành Hà Nội: Nhận hàng hỏa tốc trong ngày hoặc từ 1-2 ngày giao thường.\n- Ngoại thành và các tỉnh thành khác: Nhận hàng từ 3-5 ngày.\n- Đặc biệt: Miễn phí vận chuyển (tối đa 50k) cho đơn hàng trị giá từ 300.000đ trở lên khi áp dụng mã FREESHIP50K.";
    }

    // 7. Check Address
    if (query.includes('địa chỉ') || query.includes('dia chi') || query.includes('ở đâu') || query.includes('o dau') || query.includes('cửa hàng') || query.includes('cua hang') || query.includes('shop ở') || query.includes('shop o')) {
        return "Địa chỉ showroom chính thức của Mô Hình Store:\n- Số 31 Dịch Vọng Hậu, Cầu Giấy, Hà Nội.\n- Giờ mở cửa: 08:00 - 22:00 tất cả các ngày trong tuần (kể cả Thứ Bảy và Chủ Nhật). Bạn có thể ghé qua trực tiếp để xem và trải nghiệm sản phẩm nhé!";
    }

    // 8. Check Contact
    if (query.includes('liên hệ') || query.includes('lien he') || query.includes('sđt') || query.includes('sdt') || query.includes('hotline') || query.includes('email') || query.includes('điện thoại')) {
        return "Bạn có thể liên hệ với Mô Hình Store qua các kênh sau:\n- Hotline hỗ trợ 24/7: 0564821121\n- Email hỗ trợ: Mohinhstore@gmail.com\n- Fanpage: Mô Hình Store (Facebook/Instagram)";
    }

    // 9. Generic Response
    return "Cảm ơn bạn đã nhắn tin. Tôi là Trợ lý AI của Mô Hình Store. Câu hỏi của bạn đã được ghi nhận. Trong khi tôi chuyển thông tin này tới nhân viên tư vấn trực tuyến để hỗ trợ bạn cụ thể hơn, bạn có thể tham khảo trực tiếp các danh mục sản phẩm trên website hoặc gửi thêm câu hỏi nếu cần nhé!";
};

const sendCustomerMessage = async (req, res) => {
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
        return;
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }

    if (consultation.user && consultation.user.toString() !== req.user._id.toString()) {
        res.status(401).json({ message: 'Không có quyền truy cập yêu cầu này' });
        return;
    }

    if (!consultation.messages) {
        consultation.messages = [];
    }

    // 1. Push customer message
    consultation.messages.push({
        sender: 'customer',
        senderName: req.user.name,
        content: content,
        timestamp: new Date()
    });

    // 2. Generate and Push AI Response
    const aiResponse = await generateAiResponse(content);
    consultation.messages.push({
        sender: 'staff',
        senderName: 'AI Tư Vấn',
        content: aiResponse,
        timestamp: new Date()
    });

    await consultation.save();
    notifyClients();
    res.status(201).json(consultation);
};

const sendStaffMessage = async (req, res) => {
    const { content } = req.body;
    if (!content) {
        res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
        return;
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
        res.status(404).json({ message: 'Không tìm thấy yêu cầu tư vấn' });
        return;
    }

    if (!consultation.messages) {
        consultation.messages = [];
    }

    consultation.messages.push({
        sender: 'staff',
        senderName: req.user.name,
        content: content,
        timestamp: new Date()
    });

    await consultation.save();
    notifyClients();
    res.status(201).json(consultation);
};

module.exports = {
    createConsultation,
    getConsultations,
    updateConsultationStatus,
    updateConsultationDetails,
    deleteConsultation,
    handleSseStream,
    getMyConsultations,
    getConsultationById,
    getConsultationByIdForStaff,
    sendCustomerMessage,
    sendStaffMessage
};
