/* 
 * ADMIN AUTH LOGIC 
 */

const AdminAuth = {
    // Check if admin is logged in
    checkAuth() {
        const token = localStorage.getItem('adminToken');
        const adminInfoStr = localStorage.getItem('adminInfo');

        // If on login page and have token, redirect to dashboard
        if (window.location.pathname.includes('login.html')) {
            if (token && adminInfoStr) {
                try {
                    const adminInfo = JSON.parse(adminInfoStr);
                    if (adminInfo.role === 'staff') {
                        window.location.href = 'staff.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                } catch(e) {
                    window.location.href = 'index.html';
                }
            }
            return;
        }

        // If on other pages and no token, redirect to login
        if (!token || !adminInfoStr) {
            this.logout();
            return;
        }

        // Staff role restrictions
        try {
            const adminInfo = JSON.parse(adminInfoStr);
            if (adminInfo.role === 'staff') {
                const path = window.location.pathname;
                const isIndex = path.endsWith('/admin/') || path.endsWith('/admin') || path.endsWith('/index.html');
                const restrictedPages = ['products.html', 'categories.html', 'users.html', 'reports.html', 'orders.html', 'appointments.html', 'promotions.html'];
                const isRestricted = isIndex || restrictedPages.some(page => path.includes(page) && !path.includes('staff.html'));
                if (isRestricted) {
                    alert('Tài khoản Nhân viên không có quyền truy cập trang này!');
                    window.location.href = 'staff.html';
                }
            } else {
                // If admin goes to staff.html, they are allowed, but we can redirect or let them see it
            }
        } catch (e) {
            console.error('Error parsing admin info:', e);
            this.logout();
        }
    },

    // Save token and info after successful login
    login(token, adminData) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminInfo', JSON.stringify(adminData));
        if (adminData.role === 'staff') {
            window.location.href = 'staff.html';
        } else {
            window.location.href = 'index.html';
        }
    },

    // Clear session and redirect to login page
    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        window.location.href = '../login.html';
    },

    // Get current token
    getToken() {
        return localStorage.getItem('adminToken');
    },

    // Get current admin info
    getAdminInfo() {
        const info = localStorage.getItem('adminInfo');
        return info ? JSON.parse(info) : null;
    }
};

// Auto check auth on script load (if not on login page)
if (!window.location.pathname.includes('login.html')) {
    AdminAuth.checkAuth();
}
