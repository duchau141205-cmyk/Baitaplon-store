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

// Hide restricted sidebar links for staff role
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
    }
});
