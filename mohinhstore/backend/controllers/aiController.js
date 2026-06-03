const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Category = require('../models/Category');

/**
 * Handles incoming chatbox messages, queries MongoDB for store data,
 * and calls Gemini API (or runs a smart local search engine fallback) to formulate a reply.
 */
const getAiResponse = async (req, res) => {
    const { message } = req.body;
    console.log(`[AI CHATBOX] Nhận câu hỏi từ client: "${message}"`);
    if (!message) {
        console.warn('[AI CHATBOX] Cảnh báo: Nhận câu hỏi trống từ client.');
        return res.status(400).json({ message: 'Tin nhắn không được để trống' });
    }

    try {
        // 1. Gather dynamic data from MongoDB
        const [products, promotions, categories] = await Promise.all([
            Product.find({}).populate('category', 'name'),
            Promotion.find({ isActive: true }),
            Category.find({})
        ]);

        // 2. Format products list concisely for context
        const productListStr = products.map((p, idx) => {
            const priceStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
            const salePriceStr = p.salePrice && p.salePrice > 0 
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice) 
                : 'Không';
            const stockStr = p.countInStock > 0 ? `Còn hàng (${p.countInStock} cái)` : 'Hết hàng';
            const catName = p.category ? p.category.name : 'Chưa phân loại';
            const brandStr = p.brand || 'Chưa rõ';
            return `${idx + 1}. Tên: ${p.name} | Danh mục: ${catName} | Hãng: ${brandStr} | Giá gốc: ${priceStr} | Khuyến mãi: ${salePriceStr} | Tình trạng: ${stockStr}`;
        }).join('\n');

        // 3. Format active promotions list
        const promoListStr = promotions.length > 0 ? promotions.map((p, idx) => {
            const minOrderStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.minOrderValue);
            const discValue = p.discountType === 'percentage' ? `${p.discountValue}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.discountValue);
            return `${idx + 1}. Mã: ${p.code} | Giảm: ${discValue} | Yêu cầu đơn tối thiểu: ${minOrderStr} | Chi tiết: ${p.description || 'Không có mô tả'}`;
        }).join('\n') : 'Hiện không có mã khuyến mãi nào đang chạy.';

        // 4. Format categories list
        const catListStr = categories.map(c => `- ${c.name}`).join('\n');

        // 5. Construct system instruction with showroom details, policies, and products context
        const systemPrompt = `Bạn là Trợ lý AI thông minh, nhiệt tình của showroom Mô Hình Store (mohinhldhstore).
Nhiệm vụ của bạn là tư vấn cho khách hàng về các sản phẩm, chính sách giao hàng, khuyến mãi và địa chỉ của shop dựa trên các thông tin chính xác được cung cấp dưới đây.

LƯU Ý QUAN TRỌNG:
1. Hãy trả lời ngắn gọn, lịch sự, trực tiếp vào câu hỏi. Sử dụng đại từ xưng hô "Shop" hoặc "Mô Hình Store" và gọi khách hàng là "bạn" hoặc "quý khách".
2. Chỉ trả lời dựa trên dữ liệu sản phẩm, khuyến mãi và chính sách thực tế của shop dưới đây. Không tự bịa đặt thông tin không có trong danh sách.
3. Nếu khách hàng hỏi về mẫu mô hình không có trong danh sách sản phẩm bên dưới, hãy phản hồi khéo léo là hiện shop chưa có hàng mẫu này, và chủ động gợi ý họ tham khảo các mẫu tương tự đang có sẵn.
4. Nếu khách hàng muốn liên hệ trực tiếp với nhân viên hoặc đặt mua hàng nhanh, hãy nhắc họ số hotline và địa chỉ showroom của shop.

--- THÔNG TIN SHOWROOM ---
- Địa chỉ: 31 Dịch Vọng Hậu, Cầu Giấy, Hà Nội.
- Giờ mở cửa: 8:00 - 22:00 (Hàng ngày, kể cả thứ 7 và Chủ Nhật).
- Hotline hỗ trợ: 0564821121
- Email hỗ trợ: Mohinhstore@gmail.com
- Hướng dẫn đường đi: Showroom nằm ở mặt đường Dịch Vọng Hậu rất rộng rãi và dễ tìm, có chỗ đỗ xe máy và xe ô tô miễn phí cho khách hàng đến tham quan.

--- CHÍNH SÁCH GIAO HÀNG & ĐỔI TRẢ ---
- Giao hàng tiêu chuẩn:
  + Khu vực nội thành Hà Nội: Giao siêu tốc trong 2 giờ hoặc giao thường trong 1-2 ngày. Phí ship đồng giá 30k.
  + Các tỉnh thành khác trên toàn quốc: Giao hàng từ 3-5 ngày làm việc. Phí ship đồng giá 30k.
- Ưu đãi phí ship: Nhập mã FREESHIP50K để được giảm 50.000đ phí vận chuyển cho đơn hàng trị giá từ 300.000đ trở lên.
- Chính sách đổi trả: Đổi mới sản phẩm 1-đổi-1 trong vòng 7 ngày kể từ lúc nhận hàng nếu có lỗi do nhà sản xuất (Sản phẩm phải còn nguyên seal nilon hộp giấy, vỉ part nhựa chưa cắt rời và chưa qua lắp ráp).
- Phương thức thanh toán: Chấp nhận chuyển khoản ngân hàng qua mã QR hoặc thanh toán COD khi nhận hàng.

--- DANH MỤC SẢN PHẨM ---
${catListStr}

--- DANH SÁCH SẢN PHẨM TRÊN HỆ THỐNG MỚI NHẤT ---
${productListStr}

--- CÁC MÃ KHUYẾN MÃI ĐANG HOẠT ĐỘNG ---
${promoListStr}
`;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
            console.log('[AI CHATBOX] GEMINI_API_KEY chưa cấu hình. Đang dùng Tìm kiếm Cục bộ (Fallback)...');
            const fallbackReply = generateFallbackResponse(message, products, promotions);
            console.log(`[AI CHATBOX] Phản hồi (Fallback): "${fallbackReply.substring(0, 60)}..."`);
            return res.json({ response: fallbackReply, isFallback: true });
        }

        // Call Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 800
                }
            })
        });

        const data = await response.json();
        if (response.ok && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            const reply = data.candidates[0].content.parts[0].text;
            console.log(`[AI CHATBOX] Phản hồi (Gemini LLM): "${reply.substring(0, 60)}..."`);
            return res.json({ response: reply });
        } else {
            console.error('[AI CHATBOX] Gemini API Error details:', JSON.stringify(data));
            const fallbackReply = generateFallbackResponse(message, products, promotions);
            console.log(`[AI CHATBOX] Phản hồi (Lỗi Gemini -> Fallback): "${fallbackReply.substring(0, 60)}..."`);
            return res.json({ response: fallbackReply, isFallback: true });
        }

    } catch (error) {
        console.error('[AI CHATBOX] Error in AI controller:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra ở máy chủ Trợ lý AI' });
    }
};

/**
 * Intelligent Keyword & Database search fallback when GEMINI_API_KEY is missing.
 */
function generateFallbackResponse(query, products, promotions) {
    const q = query.toLowerCase().trim();

    // 1. Welcome / Greeting
    if (q.match(/\b(chào|hello|hi|alo|chao|kính chào|kinh chao)\b/)) {
        return "Xin chào! Tôi là Trợ lý AI của Mô Hình Store. Tôi có thể giúp gì cho bạn hôm nay? Hãy hỏi tôi về sản phẩm, khuyến mãi, địa chỉ showroom hoặc chính sách giao hàng nhé!\n\n*(Lưu ý: Hệ thống đang chạy ở chế độ Tìm kiếm Cục bộ do chưa cấu hình GEMINI_API_KEY trong file .env)*";
    }

    // 2. Showroom location / Address
    if (q.includes('địa chỉ') || q.includes('dia chi') || q.includes('ở đâu') || q.includes('cửa hàng') || q.includes('cua hang') || q.includes('shop ở') || q.includes('showroom') || q.includes('hướng dẫn đường đi')) {
        return "Showroom của **Mô Hình Store** tọa lạc tại:\n- Địa chỉ: **31 Dịch Vọng Hậu, Cầu Giấy, Hà Nội** (mặt đường rộng rãi, đỗ xe máy/ô tô miễn phí).\n- Giờ mở cửa: **8:00 - 22:00** hàng ngày.\n- Hotline liên hệ nhanh: **0564821121**.\nRất mong được đón tiếp bạn ghé thăm!";
    }

    // 3. Contact info / Hotline
    if (q.includes('liên hệ') || q.includes('sđt') || q.includes('hotline') || q.includes('email') || q.includes('nhân viên') || q.includes('gọi')) {
        return "Bạn có thể liên hệ trực tiếp với Mô Hình Store qua các kênh sau:\n- Hotline hỗ trợ: **0564821121** (Zalo/Call)\n- Email: **Mohinhstore@gmail.com**\n- Địa chỉ showroom: 31 Dịch Vọng Hậu, Cầu Giấy, Hà Nội.\nNhân viên trực hotline luôn sẵn sàng tư vấn cho bạn!";
    }

    // 4. Shipping policy
    if (q.includes('ship') || q.includes('vận chuyển') || q.includes('giao hàng') || q.includes('giao hang') || q.includes('bao lâu') || q.includes('phí')) {
        return "Chính sách vận chuyển tại Mô Hình Store:\n- Phí giao hàng: Đồng giá **30.000đ** toàn quốc.\n- Thời gian nhận hàng:\n  + Nội thành Hà Nội: Giao hỏa tốc 2 giờ hoặc giao thường 1-2 ngày.\n  + Các tỉnh thành khác: 3-5 ngày làm việc.\n- Ưu đãi: Sử dụng mã **FREESHIP50K** để được giảm 50k phí ship cho đơn từ 300.000đ!";
    }

    // 5. Return policy / Warranty
    if (q.includes('đổi trả') || q.includes('doi tra') || q.includes('bảo hành') || q.includes('bao hanh') || q.includes('lỗi') || q.includes('hỏng')) {
        return "Chính sách đổi trả bảo hành của Mô Hình Store:\n- Hỗ trợ đổi mới sản phẩm **1-đổi-1 trong vòng 7 ngày** nếu phát hiện lỗi do nhà sản xuất.\n- Điều kiện: Sản phẩm phải còn nguyên seal nilon hộp giấy bên ngoài, chưa bóc bao nilon chứa vỉ part nhựa gundam/chi tiết xe và chưa tiến hành lắp ráp.";
    }

    // 6. Promotions / Vouchers
    if (q.includes('khuyến mãi') || q.includes('khuyen mai') || q.includes('giảm giá') || q.includes('giam gia') || q.includes('voucher') || q.includes('code') || q.includes('mã')) {
        if (promotions && promotions.length > 0) {
            const list = promotions.map(p => {
                const discValue = p.discountType === 'percentage' ? `${p.discountValue}%` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.discountValue);
                const minOrder = p.minOrderValue > 0 ? ` (Đơn tối thiểu: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.minOrderValue)})` : '';
                return `- Mã **${p.code}**: Giảm ${discValue}${minOrder}. ${p.description || ''}`;
            }).join('\n');
            return `Mô Hình Store đang áp dụng các chương trình ưu đãi hấp dẫn:\n${list}\n\nHãy lưu lại và nhập mã ở trang thanh toán để được giảm giá nhé!`;
        }
        return "Hiện tại hệ thống chưa ghi nhận chương trình khuyến mãi nào mới đang chạy. Bạn có thể sử dụng mã **FREESHIP50K** để nhận ưu đãi vận chuyển nếu đơn hàng trên 300.000đ.";
    }

    // 7. Dynamic Product Database Search (looks for matching keywords in product names/brands/categories)
    if (products && products.length > 0) {
        // Remove common Vietnamese conversational filler words to extract keywords
        const stopWords = ['shop', 'có', 'không', 'nào', 'gì', 'ở', 'đâu', 'với', 'cho', 'mình', 'cái', 'chi', 'tiết', 'bán', 'mua', 'tìm', 'loại', 'mẫu', 'sẵn', 'hàng', 'ạ', 'dạ', 'hỏi', 'tư', 'vấn', 'xe', 'mô', 'hình'];
        const keywords = q.split(/\s+/).filter(word => word && !stopWords.includes(word));

        if (keywords.length > 0) {
            const matched = products.filter(p => {
                const pName = p.name.toLowerCase();
                const pBrand = (p.brand || '').toLowerCase();
                const pCat = (p.category && p.category.name || '').toLowerCase();
                
                return keywords.some(keyword => 
                    pName.includes(keyword) || 
                    pBrand.includes(keyword) || 
                    pCat.includes(keyword)
                );
            });

            if (matched.length > 0) {
                const list = matched.slice(0, 5).map(p => {
                    const price = p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
                    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
                    const stock = p.countInStock > 0 ? `Còn hàng (${p.countInStock} sản phẩm)` : "Hết hàng (Nhận đặt trước)";
                    return `- **${p.name}** | Hãng: ${p.brand || 'Chưa rõ'} | Giá: ${formattedPrice} | Tình trạng: ${stock}`;
                }).join('\n');
                return `Dạ, dưới đây là các sản phẩm phù hợp với nhu cầu tìm kiếm của bạn:\n${list}\n\nBạn có muốn biết thêm chi tiết hoặc đặt mua sản phẩm nào không ạ?`;
            }
        }
    }

    // 8. General fallback response
    return "Cảm ơn câu hỏi của bạn. Tôi là Trợ lý AI của Mô Hình Store. Hiện tại tôi có thể cung cấp danh sách sản phẩm, mã giảm giá, địa chỉ showroom và chính sách vận chuyển.\n\nNếu cần trao đổi chi tiết hơn với nhân viên tư vấn, bạn vui lòng gọi hotline **0564821121** hoặc gửi yêu cầu tư vấn tại trang web nhé!";
}

module.exports = { getAiResponse };
