const fs = require('fs');
const staffFile = 'd:/BAITAPLON/shop/frontend/all pe/admin/staff.html';
const apptFile = 'd:/BAITAPLON/shop/frontend/all pe/admin/appointments.html';

const staffContent = fs.readFileSync(staffFile, 'utf8');
let apptContent = fs.readFileSync(apptFile, 'utf8');

// 1. Extract HTML
const tabAppointmentsStart = staffContent.indexOf('<div id="tab-appointments"');
const tabAppointmentsEnd = staffContent.indexOf('<!-- TAB 3: ORDERS -->');
let apptHtml = staffContent.substring(tabAppointmentsStart, tabAppointmentsEnd);

// Remove the inline style 'display: none' from the tab if it has one, or 'tab-content' classes that hide it
apptHtml = apptHtml.replace('class="tab-content"', '');
apptHtml = apptHtml.replace('id="tab-appointments"', '');

// Replace the table content in appointments.html with apptHtml
const replaceStart = apptContent.indexOf('<div class="card" style="display: flex; gap: 1rem; flex-wrap: wrap;');
const replaceEnd = apptContent.indexOf('</div>\r\n        </div>\r\n    </div>\r\n\r\n    <!-- Status Change Modal -->');
apptContent = apptContent.substring(0, replaceStart) + apptHtml + apptContent.substring(replaceEnd);

// 2. Extract Edit Consultation Modal
const editModalStart = staffContent.indexOf('<!-- Edit Consultation Modal -->');
const editModalEnd = staffContent.indexOf('<!-- Order Detail Modal -->');
const editModalHtml = staffContent.substring(editModalStart, editModalEnd);
apptContent = apptContent.replace('<!-- Status Change Modal -->', editModalHtml + '\n    <!-- Status Change Modal -->');

// 3. Extract JS
// The JS in staff.html for consultations:
const jsStart = staffContent.indexOf('// --- CONSULTATIONS TAB RENDERING (sidebar list) ---');
const jsEnd = staffContent.indexOf('// --- ORDERS TAB RENDERING ---');
const jsChatStart = staffContent.indexOf('// ===== STAFF CHAT FUNCTIONS =====');
const jsChatEnd = staffContent.lastIndexOf('</script>');

let jsCode1 = staffContent.substring(jsStart, jsEnd);
let jsCode2 = staffContent.substring(jsChatStart, jsChatEnd);

// Replace appointments.html script section
const apptJsStart = apptContent.indexOf('let allAppointments = [];');
const apptJsEnd = apptContent.indexOf('</script>');

let newJs = `
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
                const consultations = await AdminAPI.get('/consultations/admin');
                if (consultations) {
                    allConsultations = consultations;
                    renderAppointmentsTab();
                }
            } catch (err) {} finally {
                if (!isSilent) AdminUtils.hideLoader();
            }
        }
` + jsCode1 + '\n' + jsCode2;

apptContent = apptContent.substring(0, apptJsStart) + newJs + '\n    ' + apptContent.substring(apptJsEnd);

fs.writeFileSync(apptFile, apptContent);
console.log('Successfully injected staff chat UI into admin appointments.');
