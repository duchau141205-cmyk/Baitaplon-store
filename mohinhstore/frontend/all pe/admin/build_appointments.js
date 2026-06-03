const fs = require('fs');
const staffFile = 'd:/BAITAPLON/mohinhstore/frontend/all pe/admin/staff.html';
const staffContent = fs.readFileSync(staffFile, 'utf8');

const tabAppointmentsStart = staffContent.indexOf('<div id="tab-appointments"');
const tabAppointmentsEnd = staffContent.indexOf('<!-- TAB 3: ORDERS -->');
let apptHtml = staffContent.substring(tabAppointmentsStart, tabAppointmentsEnd);

apptHtml = apptHtml.replace('class="tab-content active"', '');
apptHtml = apptHtml.replace('class="tab-content"', '');
apptHtml = apptHtml.replace('id="tab-appointments"', '');

const editModalStart = staffContent.indexOf('<!-- Edit Consultation Modal -->');
const editModalEnd = staffContent.indexOf('<!-- Order Detail Modal -->');
const editModalHtml = staffContent.substring(editModalStart, editModalEnd);

const jsStart = staffContent.indexOf('// --- CONSULTATIONS TAB RENDERING (sidebar list) ---');
const jsEnd = staffContent.indexOf('// --- ORDERS TAB RENDERING ---');
const jsChatStart = staffContent.indexOf('// ===== STAFF CHAT FUNCTIONS =====');
const jsChatEnd = staffContent.lastIndexOf('</script>');

let jsCode1 = staffContent.substring(jsStart, jsEnd);
let jsCode2 = staffContent.substring(jsChatStart, jsChatEnd);

const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản lý Lịch hẹn & Tư vấn | Mô Hình Store Admin</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/admin.css">
    <link rel="stylesheet" href="../assets/css/admin-components.css">
    <style>
        body {
            font-family: var(--font-body);
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header"><div class="logo">MÔ HÌNH ADMIN</div></div>
            <nav class="sidebar-menu">
                <a href="index.html"><i class="fas fa-th-large"></i> Tổng quan</a>
                <a href="products.html"><i class="fas fa-box"></i> Sản phẩm</a>
                <a href="categories.html"><i class="fas fa-list"></i> Danh mục</a>
                <a href="orders.html"><i class="fas fa-shopping-cart"></i> Đơn hàng</a>
                <a href="users.html"><i class="fas fa-users"></i> Khách hàng</a>
                <a href="reports.html"><i class="fas fa-chart-line"></i> Báo cáo</a>
                <a href="appointments.html" class="active"><i class="fas fa-calendar-check"></i> Lịch hẹn & Tư vấn</a>
                <a href="promotions.html"><i class="fas fa-percent"></i> Khuyến mãi</a>
            </nav>
            <div class="sidebar-footer"><a href="#" onclick="AdminAuth.logout()"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></div>
        </aside>

        <!-- Main Content -->
        <div class="main-content">
            <header class="top-header">
                <div class="page-title" style="display: flex; align-items: center; gap: 1rem;">
                    <button class="mobile-toggle" onclick="AdminUtils.toggleSidebar()"><i class="fas fa-bars"></i></button>
                    <h2>Quản lý Lịch hẹn & Tư vấn</h2>
                </div>
                <div class="admin-info">
                    <span class="admin-name" id="display-admin-name">Admin</span>
                    <div class="avatar">A</div>
                </div>
            </header>

            <div class="content-body">
                ${apptHtml}
            </div>
        </div>
    </div>

    <!-- Quick Status Modal -->
    <div id="quick-status-modal" class="modal">
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Cập nhật trạng thái tư vấn</h3>
                <span class="close-modal" onclick="AdminUtils.hideModal('quick-status-modal')">&times;</span>
            </div>
            <div class="modal-body">
                <input type="hidden" id="quick-status-id">
                <div class="form-group">
                    <label>Trạng thái xử lý</label>
                    <select id="quick-status-select" class="form-control">
                        <option value="Pending">Chờ xử lý</option>
                        <option value="Contacted">Đã liên hệ</option>
                        <option value="Completed">Hoàn thành</option>
                        <option value="Cancelled">Đã hủy</option>
                    </select>
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="AdminUtils.hideModal('quick-status-modal')">Hủy</button>
                    <button class="btn btn-primary" onclick="saveQuickStatus()">Lưu thay đổi</button>
                </div>
            </div>
        </div>
    </div>

    ${editModalHtml}

    <script src="../assets/js/admin-auth.js"></script>
    <script src="../assets/js/admin-api.js"></script>
    <script src="../assets/js/admin-utils.js"></script>
    <script>
        AdminAuth.checkAuth();
        let allConsultations = [];
        let filterStatus = 'all';
        let searchQuery = '';

        document.addEventListener('DOMContentLoaded', () => {
            const adminInfo = AdminAuth.getAdminInfo();
            if (adminInfo) {
                document.getElementById('display-admin-name').innerText = adminInfo.name;
                document.querySelector('.avatar').innerText = adminInfo.name.charAt(0);
            }

            loadAllData();

            try {
                const eventSource = new EventSource('/api/consultations/stream');
                eventSource.onmessage = async (event) => {
                    if (event.data === 'REFRESH') {
                        const qm = document.getElementById('quick-status-modal');
                        const isModalOpen = (qm && qm.classList.contains('active'));
                        if (!isModalOpen) {
                            await loadAllData(true);
                            if (typeof currentStaffChatId !== 'undefined' && currentStaffChatId) {
                                await openStaffChat(currentStaffChatId);
                            }
                        }
                    }
                };
            } catch (e) {}

            setInterval(() => {
                const qm = document.getElementById('quick-status-modal');
                const isModalOpen = (qm && qm.classList.contains('active'));
                if (!isModalOpen) loadAllData(true);
            }, 30000);

            document.getElementById('filter-appointment-status').addEventListener('change', renderAppointmentsTab);
            document.getElementById('search-appointment').addEventListener('input', renderAppointmentsTab);
        });

        async function loadAllData(isSilent = false) {
            if (!isSilent) AdminUtils.showLoader();
            try {
                const consultations = await AdminAPI.get('/consultations/admin', isSilent);
                if (consultations) {
                    allConsultations = consultations;
                    renderAppointmentsTab();
                }
            } catch (err) {} finally {
                if (!isSilent) AdminUtils.hideLoader();
            }
        }

        function openQuickStatus(id, currentStatus) {
            document.getElementById('quick-status-id').value = id;
            document.getElementById('quick-status-select').value = currentStatus;
            AdminUtils.showModal('quick-status-modal');
        }

        async function saveQuickStatus() {
            const id = document.getElementById('quick-status-id').value;
            const newStatus = document.getElementById('quick-status-select').value;
            try {
                const res = await AdminAPI.put(\`/consultations/admin/\${id}/status\`, { status: newStatus }, true);
                if (res) {
                    AdminUtils.toast('Cập nhật trạng thái thành công!');
                    AdminUtils.hideModal('quick-status-modal');
                    loadAllData(true);
                }
            } catch (err) {
                AdminUtils.toast('Lỗi cập nhật trạng thái', 'danger');
            }
        }

${jsCode1}
${jsCode2}

    </script>
</body>
</html>`;

fs.writeFileSync('d:/BAITAPLON/mohinhstore/frontend/all pe/admin/appointments.html', fullHtml);
console.log('appointments.html completely rebuilt.');
