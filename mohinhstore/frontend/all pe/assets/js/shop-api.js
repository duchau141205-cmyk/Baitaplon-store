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
    },

    getNotifications() {
        return this.get('/notifications', true);
    },

    readNotification(id) {
        return this.put(`/notifications/${id}/read`, null, true);
    },

    readAllNotifications() {
        return this.put('/notifications/read-all', null, true);
    }
};

// Dynamic injection of floating AI Chatbot
document.addEventListener('DOMContentLoaded', () => {
    // Check if the current page is an admin page or inside an iframe
    if (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/staff/')) {
        return;
    }

    // Redirect admin and staff users away from customer pages
    if (ShopAPI.isAuthenticated()) {
        const user = ShopAPI.getUserInfo();
        if (user && (user.role === 'admin' || user.role === 'staff')) {
            const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
            if (!isAuthPage) {
                alert('Tài khoản của bạn không được phép truy cập trang khách hàng!');
            }
            if (user.role === 'staff') {
                window.location.href = 'admin/staff.html';
            } else {
                window.location.href = 'admin/index.html';
            }
            return;
        }
    }

    // Check if redirected from Admin preview mode
    if (sessionStorage.getItem('from_admin') === 'true') {
        injectAdminBackButton();
    }

    function injectAdminBackButton() {
        if (document.getElementById('admin-back-preview-widget')) return;

        // Inject CSS for the back button
        const backBtnStyle = document.createElement('style');
        backBtnStyle.innerHTML = `
            .admin-back-widget {
                position: fixed;
                bottom: 30px;
                left: 30px;
                z-index: 9999;
                font-family: 'Plus Jakarta Sans', sans-serif;
                animation: slideUpIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .admin-back-btn {
                display: flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #ff0080, #7928ca);
                color: white;
                padding: 12px 20px;
                border-radius: 30px;
                font-weight: 700;
                font-size: 0.88rem;
                box-shadow: 0 4px 20px rgba(121, 40, 202, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                text-decoration: none;
            }
            .admin-back-btn:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 8px 25px rgba(121, 40, 202, 0.6), 0 0 0 1px rgba(255,255,255,0.2) inset;
            }
            .admin-back-btn i {
                font-size: 0.95rem;
                transition: transform 0.2s;
            }
            .admin-back-btn:hover i {
                transform: translateX(-3px);
            }
            .admin-back-close {
                position: absolute;
                top: -8px;
                right: -8px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #151b23;
                border: 1px solid rgba(255,255,255,0.15);
                color: #aaa;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .admin-back-close:hover {
                background: #ff4d4d;
                color: white;
                border-color: #ff4d4d;
            }
            @keyframes slideUpIn {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(backBtnStyle);

        // Inject HTML
        const widget = document.createElement('div');
        widget.className = 'admin-back-widget';
        widget.id = 'admin-back-preview-widget';
        widget.innerHTML = `
            <a href="admin/login.html" class="admin-back-btn" id="admin-back-action-btn">
                <i class="fas fa-arrow-left"></i> Quay lại Admin
            </a>
            <button class="admin-back-close" id="admin-back-close-btn" title="Tắt chế độ xem trước">&times;</button>
        `;
        document.body.appendChild(widget);

        // Click handler to clear flag and go to admin login
        const actionBtn = document.getElementById('admin-back-action-btn');
        actionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('from_admin');
            window.location.href = 'admin/login.html';
        });

        // Click handler to just hide the widget
        const closeBtn = document.getElementById('admin-back-close-btn');
        closeBtn.addEventListener('click', () => {
            sessionStorage.removeItem('from_admin');
            widget.style.opacity = '0';
            widget.style.transform = 'translateY(20px)';
            widget.style.transition = 'all 0.3s ease';
            setTimeout(() => widget.remove(), 300);
        });
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

        /* Notification Icon & Dropdown Styles */
        .notification-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        .notification-btn {
            position: relative;
            background: transparent;
            border: none;
            color: var(--text-color, #f0f3f6);
            cursor: pointer;
            padding: 5px;
            transition: var(--transition, all 0.2s);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .notification-btn i {
            font-size: 18px !important;
        }
        .notification-btn:hover i {
            color: var(--primary-color, #00d4ff);
        }
        .notification-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: var(--accent-color, #ff0080);
            color: white;
            font-size: 8px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            line-height: 1;
        }
        .notification-badge.active {
            display: flex;
        }
        .notification-dropdown {
            position: absolute;
            top: 45px;
            right: -10px;
            width: 320px;
            max-height: 400px;
            background: rgba(21, 27, 35, 0.95);
            border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(15px);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(10px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform-origin: top right;
        }
        .notification-dropdown.active {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        .notification-header {
            padding: 12px 16px;
            border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .notification-header h4 {
            margin: 0;
            font-size: 0.95rem;
            color: white;
            font-weight: 600;
        }
        .notification-mark-all {
            background: transparent;
            border: none;
            color: var(--primary-color, #00d4ff);
            font-size: 0.75rem;
            cursor: pointer;
            font-weight: 500;
            transition: var(--transition, all 0.2s);
        }
        .notification-mark-all:hover {
            color: #00b4db;
            text-decoration: underline;
        }
        .notification-list {
            flex: 1;
            overflow-y: auto;
            max-height: 300px;
        }
        .notification-item {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            display: flex;
            gap: 12px;
            cursor: pointer;
            transition: var(--transition, all 0.2s);
            position: relative;
        }
        .notification-item:hover {
            background: rgba(255, 255, 255, 0.03);
        }
        .notification-item.unread {
            background: rgba(0, 212, 255, 0.04);
        }
        .notification-item.unread::before {
            content: '';
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            background: var(--primary-color, #00d4ff);
            border-radius: 50%;
        }
        .notification-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            flex-shrink: 0;
        }
        .notification-icon.success {
            background: rgba(46, 160, 67, 0.15);
            color: var(--success-color, #2ea043);
        }
        .notification-icon.info {
            background: rgba(0, 212, 255, 0.15);
            color: var(--primary-color, #00d4ff);
        }
        .notification-icon.danger {
            background: rgba(248, 81, 73, 0.15);
            color: var(--danger-color, #f85149);
        }
        .notification-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: left;
        }
        .notification-title {
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-color, #f0f3f6);
        }
        .notification-desc {
            font-size: 0.78rem;
            color: var(--text-muted, #8b949e);
            line-height: 1.3;
        }
        .notification-time {
            font-size: 0.7rem;
            color: #555;
            margin-top: 4px;
        }
        .notification-empty {
            padding: 30px 16px;
            text-align: center;
            color: var(--text-muted, #8b949e);
            font-size: 0.85rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        .notification-empty i {
            font-size: 1.5rem;
            color: #333;
        }
        .notification-footer {
            padding: 10px 16px;
            border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
            text-align: center;
            background: rgba(13, 17, 23, 0.5);
        }
        .notification-view-all {
            color: var(--text-muted, #8b949e);
            font-size: 0.75rem;
            font-weight: 500;
            transition: var(--transition, all 0.2s);
        }
        .notification-view-all:hover {
            color: var(--primary-color, #00d4ff);
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

    // --- INJECT NOTIFICATION UI IF AUTHENTICATED ---
    if (ShopAPI.isAuthenticated()) {
        injectNotificationUI();
    }

    function injectNotificationUI() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        // Check if already injected
        if (document.getElementById('header-notification-wrapper')) return;

        // Create wrapper
        const notifWrapper = document.createElement('div');
        notifWrapper.className = 'notification-wrapper';
        notifWrapper.id = 'header-notification-wrapper';
        
        notifWrapper.innerHTML = `
            <button class="notification-btn" id="notif-toggle-btn" title="Thông báo">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notif-unread-count">0</span>
            </button>
            <div class="notification-dropdown" id="notif-dropdown-box">
                <div class="notification-header">
                    <h4>Thông báo</h4>
                    <button class="notification-mark-all" id="notif-read-all-btn">Đọc tất cả</button>
                </div>
                <div class="notification-list" id="notif-list-container">
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <span>Không có thông báo nào</span>
                    </div>
                </div>
                <div class="notification-footer">
                    <a href="profile.html?tab=orders" class="notification-view-all">Xem lịch sử đơn hàng</a>
                </div>
            </div>
        `;

        // Insert before cart-icon if exists, or append
        const cartIcon = navActions.querySelector('.cart-icon');
        if (cartIcon) {
            navActions.insertBefore(notifWrapper, cartIcon);
        } else {
            navActions.appendChild(notifWrapper);
        }

        const toggleBtn = document.getElementById('notif-toggle-btn');
        const dropdown = document.getElementById('notif-dropdown-box');
        const readAllBtn = document.getElementById('notif-read-all-btn');

        // Toggle dropdown
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notifWrapper.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Mark all as read
        readAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await ShopAPI.readAllNotifications();
                await fetchAndRenderNotifications();
            } catch (err) {
                console.error('Error marking all as read:', err);
            }
        });

        // Helper function for relative time
        function getRelativeTimeStr(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            
            if (diffMins < 1) return 'Vừa xong';
            if (diffMins < 60) return `${diffMins} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;
            
            return date.toLocaleDateString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            });
        }

        // Fetch & render helper
        async function fetchAndRenderNotifications() {
            try {
                const notifications = await ShopAPI.getNotifications();
                if (!notifications) return;

                const badge = document.getElementById('notif-unread-count');
                const container = document.getElementById('notif-list-container');
                
                // Calculate unread count
                const unreadCount = notifications.filter(n => !n.isRead).length;
                if (unreadCount > 0) {
                    badge.innerText = unreadCount;
                    badge.classList.add('active');
                } else {
                    badge.classList.remove('active');
                }

                if (notifications.length === 0) {
                    container.innerHTML = `
                        <div class="notification-empty">
                            <i class="fas fa-bell-slash"></i>
                            <span>Không có thông báo nào</span>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = notifications.map(notif => {
                    let iconClass = 'info';
                    let iconHtml = '<i class="fas fa-info-circle"></i>';
                    
                    if (notif.type === 'OrderPlaced') {
                        iconClass = 'success';
                        iconHtml = '<i class="fas fa-shopping-bag"></i>';
                    } else if (notif.type === 'OrderCancelled') {
                        iconClass = 'danger';
                        iconHtml = '<i class="fas fa-times-circle"></i>';
                    } else if (notif.type === 'OrderStatusChanged') {
                        if (notif.title.includes('giao thành công') || notif.title.includes('Delivered')) {
                            iconClass = 'success';
                            iconHtml = '<i class="fas fa-check-circle"></i>';
                        } else if (notif.message.includes('vận chuyển') || notif.message.includes('Shipping')) {
                            iconClass = 'info';
                            iconHtml = '<i class="fas fa-truck"></i>';
                        } else if (notif.message.includes('xác nhận') || notif.message.includes('Confirmed')) {
                            iconClass = 'info';
                            iconHtml = '<i class="fas fa-clipboard-check"></i>';
                        } else if (notif.message.includes('hủy') || notif.message.includes('Cancelled')) {
                            iconClass = 'danger';
                            iconHtml = '<i class="fas fa-times-circle"></i>';
                        }
                    }

                    const relativeTime = getRelativeTimeStr(notif.createdAt);

                    return `
                        <div class="notification-item ${notif.isRead ? '' : 'unread'}" data-id="${notif._id}" data-related="${notif.relatedId || ''}">
                            <div class="notification-icon ${iconClass}">
                                ${iconHtml}
                            </div>
                            <div class="notification-content">
                                <div class="notification-title">${notif.title}</div>
                                <div class="notification-desc">${notif.message}</div>
                                <div class="notification-time">${relativeTime}</div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Add click handlers for notification items
                const items = container.querySelectorAll('.notification-item');
                items.forEach(item => {
                    item.addEventListener('click', async () => {
                        const notifId = item.getAttribute('data-id');
                        const relatedId = item.getAttribute('data-related');
                        
                        try {
                            await ShopAPI.readNotification(notifId);
                        } catch (err) {
                            console.error('Error marking notification as read:', err);
                        }

                        // Direct to order page
                        if (relatedId) {
                            if (window.location.pathname.includes('profile.html')) {
                                const url = new URL(window.location.href);
                                url.searchParams.set('tab', 'orders');
                                url.searchParams.set('orderId', relatedId);
                                window.location.href = url.toString();
                            } else {
                                window.location.href = `profile.html?tab=orders&orderId=${relatedId}`;
                            }
                        } else {
                            window.location.href = 'profile.html?tab=orders';
                        }
                    });
                });

            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        }

        // Initial fetch
        fetchAndRenderNotifications();

        // Poll every 10 seconds
        setInterval(fetchAndRenderNotifications, 10000);
    }
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


