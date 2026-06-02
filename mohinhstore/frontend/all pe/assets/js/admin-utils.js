/* 
 * ADMIN UTILITIES 
 */

// Check sidebar state immediately on script load to prevent layout shift (skip on staff.html)
if (localStorage.getItem('sidebar_collapsed') === 'true' && !window.location.pathname.includes('staff.html')) {
    if (document.body) {
        document.body.classList.add('sidebar-collapsed');
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('sidebar-collapsed');
        });
    }
}

const AdminUtils = {
    // Format currency to VNĐ
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const mo = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${h}:${m} - ${d}/${mo}/${y}`;
    },

    // Toast Notification
    toast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideLeft 0.3s ease-out;
            min-width: 250px;
        `;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>${message}</span>
                <i class="fas fa-times" style="cursor: pointer; margin-left: 10px;" onclick="this.parentElement.parentElement.remove()"></i>
            </div>
        `;

        document.getElementById('toast-container').appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s';
                setTimeout(() => toast.remove(), 500);
            }
        }, 3000);
    },

    // Modal Controls
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    },

    // Confirm dialog
    confirm(message, callback) {
        if (window.confirm(message)) {
            callback();
        }
    },

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }
};

// Add slideLeft animation to head
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideLeft {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Hide restricted sidebar links for staff role & Inject Profile Dropdown
function initAdminUtils() {
    if (window.adminUtilsInitialized) return;
    window.adminUtilsInitialized = true;

    // 1. Sidebar Collapse Button & Styles Injection
    const sidebar = document.querySelector('.sidebar');
    const isStaffPage = window.location.pathname.includes('staff.html');

    // Force remove collapsed class on staff.html to ensure sidebar is always expanded
    if (isStaffPage && document.body) {
        document.body.classList.remove('sidebar-collapsed');
    }

    if (sidebar && !isStaffPage) {
        // Dynamically wrap text nodes of sidebar links in span tags for clean transition
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a, .sidebar-menu button, .sidebar-footer a');
        sidebarLinks.forEach(link => {
            Array.from(link.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
                    const span = document.createElement('span');
                    span.className = 'sidebar-text';
                    span.textContent = node.nodeValue.trim();
                    node.parentNode.replaceChild(span, node);
                }
            });
        });

        // Dynamically wrap logo text in span.logo-text for clean transition
        const logo = document.querySelector('.logo');
        if (logo) {
            Array.from(logo.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
                    const span = document.createElement('span');
                    span.className = 'logo-text';
                    span.textContent = node.nodeValue.trim();
                    node.parentNode.replaceChild(span, node);
                }
            });
        }

        const collapseStyle = document.createElement('style');
        collapseStyle.innerHTML = `
            /* Smooth transitions */
            .sidebar {
                transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            .main-content {
                transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            /* Sidebar text and logo transitions */
            .sidebar-text {
                transition: opacity 0.2s ease, visibility 0.2s ease;
                opacity: 1;
                visibility: visible;
                display: inline-block;
                white-space: nowrap;
            }
            .logo-text {
                transition: opacity 0.2s ease, visibility 0.2s ease;
                opacity: 1;
                visibility: visible;
                display: inline-block;
                white-space: nowrap;
            }
            
            /* Collapse Button */
            #sidebar-collapse-btn {
                background: #0f1217;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: var(--text-muted);
                cursor: pointer;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.65rem;
                transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
                position: absolute;
                right: -11px;
                top: 50%;
                z-index: 1001;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                opacity: 0;
                transform: translateY(-50%) scale(0.8);
            }
            .sidebar:hover #sidebar-collapse-btn {
                opacity: 1;
                transform: translateY(-50%) scale(1);
            }
            #sidebar-collapse-btn:hover {
                background: #151b23;
                color: var(--primary-color);
                border-color: var(--primary-color);
                box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
                transform: translateY(-50%) scale(1.1) !important;
            }
            
            /* Collapsed State Styles */
            body.sidebar-collapsed .sidebar {
                width: 70px;
            }
            body.sidebar-collapsed .main-content {
                margin-left: 70px;
            }
            body.sidebar-collapsed .sidebar-header {
                padding: 24px 10px;
            }
            body.sidebar-collapsed .sidebar-text {
                opacity: 0;
                visibility: hidden;
                width: 0;
                overflow: hidden;
                margin: 0 !important;
                padding: 0 !important;
            }
            body.sidebar-collapsed .logo-text {
                opacity: 0;
                visibility: hidden;
                width: 0;
                overflow: hidden;
            }
            body.sidebar-collapsed .logo {
                font-size: 0 !important;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            body.sidebar-collapsed .logo::after {
                content: 'M';
                font-size: 1.4rem;
                font-weight: 800;
                color: var(--primary-color);
                display: block;
            }
            body.sidebar-collapsed .sidebar-menu {
                padding: 16px 8px;
            }
            body.sidebar-collapsed .sidebar-menu a,
            body.sidebar-collapsed .sidebar-menu button {
                font-size: 0 !important;
                justify-content: center !important;
                padding: 12px 0 !important;
                gap: 0 !important;
                border-left: 0 !important;
            }
            body.sidebar-collapsed .sidebar-menu a i,
            body.sidebar-collapsed .sidebar-menu button i {
                font-size: 1.25rem !important;
                margin: 0 !important;
            }
            body.sidebar-collapsed .sidebar-footer {
                padding: 16px 8px;
            }
            body.sidebar-collapsed .sidebar-footer a {
                font-size: 0 !important;
                justify-content: center !important;
                padding: 12px 0 !important;
            }
            body.sidebar-collapsed .sidebar-footer a i {
                font-size: 1.25rem !important;
                margin: 0 !important;
            }
            body.sidebar-collapsed #sidebar-collapse-btn i {
                transform: rotate(180deg);
            }
        `;
        document.head.appendChild(collapseStyle);

        if (!document.getElementById('sidebar-collapse-btn')) {
            const collapseBtn = document.createElement('button');
            collapseBtn.id = 'sidebar-collapse-btn';
            collapseBtn.title = 'Thu gọn / Mở rộng menu';
            collapseBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            
            const sidebarHeader = document.querySelector('.sidebar-header');
            if (sidebarHeader) {
                sidebarHeader.style.position = 'relative';
                sidebarHeader.appendChild(collapseBtn);
            } else {
                sidebar.appendChild(collapseBtn);
            }
            
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
                localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
            });
        }

        if (typeof AdminAuth !== 'undefined') {
            const adminInfo = AdminAuth.getAdminInfo();
            if (adminInfo && adminInfo.role === 'staff') {
                // Update logo text
                const logo = document.querySelector('.sidebar-header .logo');
                if (logo) {
                    logo.innerText = 'MÔ HÌNH STAFF';
                }

                const menuLinks = document.querySelectorAll('.sidebar-menu a');
                menuLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href) {
                        if (href === 'index.html' || href.endsWith('/index.html')) {
                            link.setAttribute('href', 'staff.html');
                            link.innerHTML = '<i class="fas fa-desktop"></i> <span class="sidebar-text">Tổng quan công việc</span>';
                        } else if (href.includes('products.html') || href.includes('categories.html') || href.includes('users.html') || href.includes('reports.html') || href.includes('promotions.html')) {
                            link.style.display = 'none';
                        }
                    }
                });
            } else if (adminInfo && adminInfo.role === 'admin') {
                // Sidebar Navigation shortcuts for admin between admin and staff portals
                const sidebarMenu = document.querySelector('.sidebar-menu');
                if (sidebarMenu) {
                    if (window.location.pathname.includes('staff.html')) {
                        // On staff.html, add a link to index.html (Admin Dashboard)
                        const adminLink = document.createElement('a');
                        adminLink.href = 'index.html';
                        adminLink.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 15px 25px; color: #aaa; text-decoration: none; font-size: 0.95rem; transition: all 0.3s ease; border-left: 4px solid transparent;';
                        adminLink.innerHTML = '<i class="fas fa-chart-line" style="color: #00d4ff; width: 20px; text-align: center; font-size: 0.95rem;"></i> <span class="sidebar-text">Trang Quản trị</span>';
                        adminLink.addEventListener('mouseover', () => {
                            adminLink.style.color = 'white';
                            adminLink.style.background = 'rgba(255, 255, 255, 0.05)';
                        });
                        adminLink.addEventListener('mouseout', () => {
                            adminLink.style.color = '#aaa';
                            adminLink.style.background = 'none';
                        });
                        sidebarMenu.appendChild(adminLink);
                    } else {
                        // On admin pages, add a link to staff.html (Staff Portal)
                        const staffLink = document.createElement('a');
                        staffLink.href = 'staff.html';
                        staffLink.innerHTML = '<i class="fas fa-user-tie" style="color: #ffc107;"></i> <span class="sidebar-text">Cổng Nhân viên</span>';
                        sidebarMenu.appendChild(staffLink);
                    }
                }
            }

            // Profile Dropdown Menu Injection
            const adminInfoEl = document.querySelector('.admin-info');
            if (adminInfoEl) {
                // Style sheet injection
                const dropdownStyle = document.createElement('style');
                dropdownStyle.innerHTML = `
                    .admin-info {
                        position: relative;
                        cursor: pointer;
                        padding: 6px 12px;
                        border-radius: 20px;
                        background: rgba(255, 255, 255, 0.02);
                        border: 1px solid var(--glass-border);
                        transition: all 0.2s ease;
                    }
                    .admin-info:hover {
                        background: rgba(255, 255, 255, 0.06);
                        border-color: rgba(0, 212, 255, 0.25);
                    }
                    .admin-profile-dropdown {
                        display: none;
                        position: absolute;
                        top: 50px;
                        right: 0;
                        width: 230px;
                        background: rgba(21, 27, 35, 0.95);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 12px;
                        box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(15px);
                        z-index: 9999;
                        padding: 8px 0;
                        flex-direction: column;
                        transform-origin: top right;
                        animation: dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .admin-profile-dropdown.show {
                        display: flex;
                    }
                    .admin-profile-dropdown-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 10px 16px;
                        color: #8b949e;
                        font-size: 0.88rem;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    }
                    .admin-profile-dropdown-item i {
                        font-size: 0.95rem;
                        text-align: center;
                    }
                    .admin-profile-dropdown-item:hover {
                        background: rgba(0, 212, 255, 0.08);
                        color: #00d4ff;
                    }
                    .admin-profile-dropdown-divider {
                        height: 1px;
                        background: rgba(255, 255, 255, 0.08);
                        margin: 6px 0;
                    }
                    @keyframes dropdownFade {
                        from { opacity: 0; transform: translateY(10px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `;
                document.head.appendChild(dropdownStyle);

                // Create dropdown menu element
                const dropdown = document.createElement('div');
                dropdown.className = 'admin-profile-dropdown';
                
                // Build items based on role
                const currentRole = adminInfo ? adminInfo.role : 'admin';
                let menuHtml = '';
                
                if (currentRole === 'admin') {
                    menuHtml += `
                        <a href="staff.html" class="admin-profile-dropdown-item">
                            <i class="fas fa-user-tie" style="color: #ffc107; width: 16px;"></i> Cổng Nhân viên
                        </a>
                        <a href="index.html" class="admin-profile-dropdown-item">
                            <i class="fas fa-chart-line" style="color: #00d4ff; width: 16px;"></i> Trang quản trị (Admin)
                        </a>
                        <div class="admin-profile-dropdown-divider"></div>
                    `;
                } else if (currentRole === 'staff') {
                    menuHtml += `
                        <a href="staff.html" class="admin-profile-dropdown-item">
                            <i class="fas fa-desktop" style="color: #00d4ff; width: 16px;"></i> Cổng Nhân viên
                        </a>
                        <div class="admin-profile-dropdown-divider"></div>
                    `;
                }
                
                menuHtml += `
                    <a href="#" class="admin-profile-dropdown-item" id="admin-dropdown-gohome">
                        <i class="fas fa-home" style="color: #2ea043; width: 16px;"></i> Xem website (Đăng xuất)
                    </a>
                    <a href="#" class="admin-profile-dropdown-item" id="admin-dropdown-logout" style="color: #ff4d4d;">
                        <i class="fas fa-sign-out-alt" style="color: #ff4d4d; width: 16px;"></i> Đăng xuất
                    </a>
                `;
                
                dropdown.innerHTML = menuHtml;
                adminInfoEl.appendChild(dropdown);

                // Toggle logic
                adminInfoEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('show');
                });

                // Close when clicking outside
                document.addEventListener('click', (e) => {
                    if (!adminInfoEl.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });

                // Go to guest homepage action
                const goHomeBtn = document.getElementById('admin-dropdown-gohome');
                if (goHomeBtn) {
                    goHomeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Clear tokens, set from_admin preview flag and redirect
                        sessionStorage.setItem('from_admin', 'true');
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminInfo');
                        localStorage.removeItem('user_token');
                        localStorage.removeItem('user_info');
                        window.location.href = '../index.html';
                    });
                }

                // Logout action
                const logoutBtn = document.getElementById('admin-dropdown-logout');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        AdminAuth.logout();
                    });
                }
            }
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminUtils);
} else {
    initAdminUtils();
}

