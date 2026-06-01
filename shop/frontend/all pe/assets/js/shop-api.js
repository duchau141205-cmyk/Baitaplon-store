/**
 * MÔ HÌNH STORE - SHOP API WRAPPER
 */

const BASE_URL = window.location.port === '5000' || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? '/api'
    : 'http://localhost:5000/api';

const ShopAPI = {
    async call(method, endpoint, body = null, requiresAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (requiresAuth) {
            const token = localStorage.getItem('user_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error; // Throw error to be caught by the caller
        }
    },

    get(endpoint, requiresAuth = false) {
        return this.call('GET', endpoint, null, requiresAuth);
    },

    post(endpoint, body, requiresAuth = false) {
        return this.call('POST', endpoint, body, requiresAuth);
    },

    put(endpoint, body, requiresAuth = false) {
        return this.call('PUT', endpoint, body, requiresAuth);
    },

    delete(endpoint, requiresAuth = false) {
        return this.call('DELETE', endpoint, null, requiresAuth);
    },

    // Auth Helpers
    async login(email, password) {
        const data = await this.post('/auth/login', { email, password });
        if (data && data.token) {
            localStorage.setItem('user_token', data.token);
            const { token, ...userInfo } = data;
            localStorage.setItem('user_info', JSON.stringify(userInfo));
            return data;
        }
        return null;
    },

    async register(userData) {
        const data = await this.post('/auth/register', userData);
        if (data && data.token) {
            localStorage.setItem('user_token', data.token);
            const { token, ...userInfo } = data;
            localStorage.setItem('user_info', JSON.stringify(userInfo));
        }
        return data;
    },

    logout() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        window.location.href = 'login.html';
    },

    getUserInfo() {
        const info = localStorage.getItem('user_info');
        return info ? JSON.parse(info) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('user_token');
    },

    likeProduct(id) {
        return this.post(`/products/${id}/like`, null, true);
    },

    createProductReview(id, reviewData) {
        return this.post(`/products/${id}/reviews`, reviewData, true);
    }
};

// Dynamic injection of floating AI Chatbot
document.addEventListener('DOMContentLoaded', () => {
    // Check if the current page is an admin page or inside an iframe
    if (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/staff/')) {
        return;
    }

    // 1. Inject CSS Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .ai-chat-widget {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .ai-chat-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00b4db, #0083b0);
            box-shadow: 0 0 15px rgba(0, 180, 219, 0.4), 0 5px 15px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            color: white;
            font-size: 1.5rem;
            position: relative;
        }
        .ai-chat-btn:hover {
            transform: scale(1.1) rotate(10deg);
            box-shadow: 0 0 25px rgba(0, 180, 219, 0.6), 0 8px 20px rgba(0,0,0,0.4);
        }
        .ai-chat-btn .pulse-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid #00d4ff;
            animation: chat-pulse 2s infinite;
            pointer-events: none;
        }
        @keyframes chat-pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .ai-chat-window {
            position: absolute;
            bottom: 75px;
            right: 0;
            width: 360px;
            height: 480px;
            border-radius: 20px;
            background: rgba(13, 17, 23, 0.95);
            border: 1px solid var(--primary-color, #00d4ff);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(15px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.8) translateY(20px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform-origin: bottom right;
        }
        .ai-chat-window.active {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }
        .ai-chat-header {
            padding: 15px 20px;
            background: linear-gradient(135deg, rgba(0, 180, 219, 0.1), rgba(0, 131, 176, 0.1));
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .ai-chat-profile {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .ai-chat-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00b4db, #0083b0);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            color: white;
            box-shadow: 0 0 10px rgba(0, 180, 219, 0.3);
        }
        .ai-chat-window-body {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scroll-behavior: smooth;
        }
        .ai-msg {
            max-width: 80%;
            display: flex;
            flex-direction: column;
        }
        .ai-msg.client {
            align-self: flex-end;
        }
        .ai-msg.bot {
            align-self: flex-start;
        }
        .ai-msg-bubble {
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 0.88rem;
            line-height: 1.5;
            word-break: break-word;
        }
        .ai-msg.client .ai-msg-bubble {
            background: linear-gradient(135deg, #00b4db, #0083b0);
            color: white;
            border-radius: 14px 14px 2px 14px;
        }
        .ai-msg.bot .ai-msg-bubble {
            background: rgba(255, 255, 255, 0.06);
            color: #ddd;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px 14px 14px 2px;
        }
        .ai-msg-meta {
            font-size: 0.7rem;
            color: #666;
            margin-bottom: 3px;
            margin-left: 2px;
        }
        .ai-msg.client .ai-msg-meta {
            text-align: right;
            margin-right: 2px;
        }
        .ai-chat-window-footer {
            padding: 12px 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .ai-chat-input {
            flex: 1;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.12);
            color: white;
            padding: 10px 14px;
            border-radius: 10px;
            font-family: inherit;
            font-size: 0.88rem;
            outline: none;
            resize: none;
            height: 38px;
            line-height: 1.2;
            transition: border-color 0.2s;
        }
        .ai-chat-input:focus {
            border-color: var(--primary-color, #00d4ff);
        }
        .ai-chat-send-btn {
            background: linear-gradient(135deg, #00b4db, #0083b0);
            border: none;
            width: 38px;
            height: 38px;
            border-radius: 10px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            transition: opacity 0.2s;
        }
        .ai-chat-send-btn:hover {
            opacity: 0.85;
        }
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 12px;
            align-self: flex-start;
        }
        .typing-indicator span {
            width: 6px;
            height: 6px;
            background: #aaa;
            border-radius: 50%;
            animation: wave 1.2s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes wave {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
        }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML Widget
    const widget = document.createElement('div');
    widget.className = 'ai-chat-widget';
    widget.innerHTML = `
        <div class="ai-chat-btn" id="ai-chat-toggle-btn">
            <i class="fas fa-robot"></i>
            <div class="pulse-ring"></div>
        </div>
        <div class="ai-chat-window" id="ai-chat-window-box">
            <div class="ai-chat-header">
                <div class="ai-chat-profile">
                    <div class="ai-chat-avatar"><i class="fas fa-robot"></i></div>
                    <div>
                        <h4 style="margin:0;font-size:0.95rem;color:white;font-weight:600;">Mô Hình Store AI</h4>
                        <div style="font-size:0.75rem;color:#28a745;display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;background:#28a745;border-radius:50%;"></span>Trực tuyến</div>
                    </div>
                </div>
                <button id="ai-chat-close-btn" style="background:transparent;border:none;color:#aaa;cursor:pointer;font-size:1.1rem;padding:5px;"><i class="fas fa-times"></i></button>
            </div>
            <div class="ai-chat-window-body" id="ai-chat-body">
                <div class="ai-msg bot">
                    <div class="ai-msg-meta">AI Assistant</div>
                    <div class="ai-msg-bubble">Xin chào! Tôi là Trợ lý AI của Mô Hình Store. Tôi có thể giúp gì cho bạn hôm nay? Hãy hỏi tôi về sản phẩm, khuyến mãi, hoặc địa chỉ cửa hàng nhé!</div>
                </div>
            </div>
            <div class="ai-chat-window-footer">
                <textarea class="ai-chat-input" id="ai-chat-input-text" placeholder="Nhập câu hỏi của bạn..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendWidgetMessage();}"></textarea>
                <button class="ai-chat-send-btn" id="ai-chat-send-trigger" onclick="sendWidgetMessage()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // 3. Event Listeners
    const toggleBtn = document.getElementById('ai-chat-toggle-btn');
    const closeBtn = document.getElementById('ai-chat-close-btn');
    const chatWindow = document.getElementById('ai-chat-window-box');

    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            document.getElementById('ai-chat-input-text').focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });
});

// Send Message logic from widget
async function sendWidgetMessage() {
    const input = document.getElementById('ai-chat-input-text');
    const content = input.value.trim();
    if (!content) return;

    input.value = '';
    
    // Add client message
    const body = document.getElementById('ai-chat-body');
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    const clientMsg = document.createElement('div');
    clientMsg.className = 'ai-msg client';
    clientMsg.innerHTML = `
        <div class="ai-msg-meta">Bạn &bull; ${timeStr}</div>
        <div class="ai-msg-bubble">${content}</div>
    `;
    body.appendChild(clientMsg);
    body.scrollTop = body.scrollHeight;

    // Show Typing Indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.id = 'ai-typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typingIndicator);
    body.scrollTop = body.scrollHeight;

    // Generate AI response
    try {
        const responseText = await getWidgetAiReply(content);
        
        // Remove typing indicator after delay
        setTimeout(() => {
            const indicator = document.getElementById('ai-typing-indicator');
            if (indicator) indicator.remove();

            const botMsg = document.createElement('div');
            botMsg.className = 'ai-msg bot';
            botMsg.innerHTML = `
                <div class="ai-msg-meta">AI Assistant &bull; ${timeStr}</div>
                <div class="ai-msg-bubble">${responseText.replace(/\n/g, '<br>')}</div>
            `;
            body.appendChild(botMsg);
            body.scrollTop = body.scrollHeight;
        }, 1000);
    } catch (e) {
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.remove();
    }
}

// Local dynamic AI answering mimicking server logic (with dynamic product search!)
async function getWidgetAiReply(userQuery) {
    const query = userQuery.toLowerCase().trim();

    // 1. Check greeting
    if (query.match(/\b(chào|hello|hi|alo|chao|kính chào|kinh chao)\b/)) {
        return "Xin chào! Tôi là Trợ lý AI của Mô Hình Store. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi về các mẫu mô hình, chương trình khuyến mãi, địa chỉ cửa hàng hoặc chính sách giao hàng nhé!";
    }

    // 2. Gundam products
    if (query.includes('gundam') || query.includes('gunpla') || query.includes('robot')) {
        try {
            const response = await fetch('/api/products?keyword=gundam&limit=3');
            const data = await response.json();
            if (data && data.products && data.products.length > 0) {
                const list = data.products.map(p => `- ${p.name} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice || p.price)})`).join('\n');
                return `Dạ, Mô Hình Store đang sẵn hàng các dòng mô hình Gundam cao cấp và bán rất chạy:\n${list}\n\nBạn có muốn tôi tư vấn chi tiết hơn về mẫu nào không ạ?`;
            }
        } catch(e) {}
        return "Mô Hình Store có sẵn nhiều mô hình Gundam chính hãng Bandai Nhật Bản các tỉ lệ HG, RG, MG. Bạn đang tìm mẫu Gundam cụ thể nào?";
    }

    // 3. Cars / vehicles
    if (query.includes('xe') || query.includes('oto') || query.includes('lamborghini') || query.includes('ferrari') || query.includes('car') || query.includes('siêu xe')) {
        try {
            const response = await fetch('/api/products?keyword=car&limit=3');
            const data = await response.json();
            if (data && data.products && data.products.length > 0) {
                const list = data.products.map(p => `- ${p.name} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.salePrice || p.price)})`).join('\n');
                return `Dạ, shop đang có sẵn các mẫu mô hình siêu xe tỉ lệ cao cấp vô cùng sắc nét:\n${list}\n\nBạn quan tâm đến dòng xe đua hay xe dân dụng ạ?`;
            }
        } catch(e) {}
        return "Mô Hình Store chuyên các siêu xe mô hình tĩnh kim loại tỉ lệ 1:24, 1:18 từ các hãng nổi tiếng Bburago, Maisto, Rastar. Bạn muốn tìm thương hiệu hoặc mẫu cụ thể nào?";
    }

    // 4. Promos
    if (query.includes('khuyến mãi') || query.includes('khuyen mai') || query.includes('giảm giá') || query.includes('giam gia') || query.includes('voucher') || query.includes('code') || query.includes('mã')) {
        return "Hiện tại Mô Hình Store đang áp dụng các ưu đãi:\n- Mã **NEWBIE**: Giảm 20% tối đa 100k cho thành viên mới.\n- Mã **FREESHIP50K**: Hỗ trợ 50k phí ship cho đơn từ 300k.\n- Mã **MOHINHVIP**: Giảm 15% cho đơn từ 1.000.000đ.\n\nHãy nhập các mã này ở giỏ hàng khi thanh toán nhé!";
    }

    // 5. Shipping
    if (query.includes('ship') || query.includes('vận chuyển') || query.includes('giao hàng') || query.includes('giao hang') || query.includes('bao lâu')) {
        return "Thời gian giao hàng toàn quốc của shop:\n- Nội thành Hà Nội: 1-2 ngày.\n- Các tỉnh khác: 3-5 ngày.\nMiễn phí vận chuyển (tối đa 50k) cho đơn từ 300k khi dùng mã FREESHIP50K.";
    }

    // 6. Address
    if (query.includes('địa chỉ') || query.includes('dia chi') || query.includes('ở đâu') || query.includes('cửa hàng') || query.includes('cua hang') || query.includes('shop ở')) {
        return "Showroom của Mô Hình Store đặt tại số **31 Dịch Vọng Hậu, Cầu Giấy, Hà Nội**.\nShowroom mở cửa từ 8:00 đến 22:00 hàng ngày, rất hân hạnh được đón tiếp bạn!";
    }

    // 7. Contact / support
    if (query.includes('liên hệ') || query.includes('sđt') || query.includes('hotline') || query.includes('email') || query.includes('nhân viên')) {
        return "Để liên hệ trực tiếp với đội ngũ tư vấn của shop:\n- Hotline hỗ trợ: **0564821121**\n- Email hỗ trợ: **Mohinhstore@gmail.com**\nBạn có thể nhắn tin trực tiếp ở đây, nhân viên trực tổng đài sẽ hỗ trợ bạn ngay khi có thể!";
    }

    // 8. Generic fallback
    return "Cảm ơn câu hỏi của bạn. Tôi là Trợ lý AI của Mô Hình Store. Hiện tại tôi có thể cung cấp thông tin sản phẩm, mã giảm giá và địa chỉ showroom. Nếu cần gặp nhân viên tư vấn trực tiếp, bạn vui lòng gọi hotline **0564821121** nhé!";
}


