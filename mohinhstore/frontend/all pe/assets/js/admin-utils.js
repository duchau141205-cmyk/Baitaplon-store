/* 
 * ADMIN UTILITIES 
 */

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
document.addEventListener('DOMContentLoaded', () => {
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
                        link.innerHTML = '<i class="fas fa-desktop"></i> Tổng quan công việc';
                    } else if (href.includes('products.html') || href.includes('categories.html') || href.includes('users.html') || href.includes('reports.html') || href.includes('promotions.html')) {
                        link.style.display = 'none';
                    }
                }
            });
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
});
