const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const repoDir = path.join(__dirname, '..');
const gitExe = 'C:\\Program Files\\Git\\cmd\\git.exe';
const logFile = path.join(__dirname, 'auto_sync.log');
const pidFile = path.join(__dirname, 'auto_sync.pid');
const debounceDelay = 5000; // 5 seconds

let syncTimer = null;
let changedFiles = new Set();

// Write log message helper
function log(message) {
    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(formattedMessage);
    try {
        fs.appendFileSync(logFile, formattedMessage + '\n', 'utf8');
    } catch (e) {
        console.error('Failed to write to log file:', e.message);
    }
}

// 0. PID lock to ensure only one instance runs
if (fs.existsSync(pidFile)) {
    try {
        const oldPidStr = fs.readFileSync(pidFile, 'utf8').trim();
        if (oldPidStr) {
            const oldPid = parseInt(oldPidStr, 10);
            // Check if process is still running
            process.kill(oldPid, 0); 
            log(`Chương trình theo dõi đã đang chạy với PID: ${oldPid}. Dừng phiên bản mới này.`);
            process.exit(0);
        }
    } catch (e) {
        // If kill(pid, 0) throws an error, the process is not running. 
        // We can safely overwrite the PID file and continue.
        log(`Phát hiện PID file cũ không còn hoạt động. Ghi đè tiến trình mới...`);
    }
}

// Write current PID
try {
    fs.writeFileSync(pidFile, process.pid.toString(), 'utf8');
} catch (e) {
    log(`[CẢNH BÁO] Không thể tạo file PID: ${e.message}`);
}

// Cleanup PID on exit
function cleanupPid() {
    try {
        if (fs.existsSync(pidFile)) {
            const savedPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
            if (savedPid === process.pid) {
                fs.unlinkSync(pidFile);
            }
        }
    } catch (e) {}
}

process.on('exit', cleanupPid);
process.on('SIGINT', () => { cleanupPid(); process.exit(0); });
process.on('SIGTERM', () => { cleanupPid(); process.exit(0); });
process.on('uncaughtException', (err) => {
    log(`[LỖI NGHIÊM TRỌNG] Uncaught Exception: ${err.stack || err.message}`);
    cleanupPid();
    process.exit(1);
});

// Check if a file should be ignored from syncing
function shouldIgnore(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    
    // Ignore Git folders/files
    if (normalized.includes('.git/') || normalized === '.git') return true;
    
    // Ignore node_modules
    if (normalized.includes('node_modules/') || normalized.includes('/node_modules')) return true;
    
    // Ignore VS Code workspace settings
    if (normalized.includes('.vscode/') || normalized === '.vscode') return true;
    
    // Ignore the sync tool folder completely
    if (normalized.includes('sync_tool/') || normalized.startsWith('sync_tool/')) return true;
    
    // Ignore self and self logs to prevent infinite loop
    if (normalized.endsWith('auto_sync_watcher.js')) return true;
    if (normalized.endsWith('auto_sync.log')) return true;
    if (normalized.endsWith('auto_sync.pid')) return true;
    if (normalized.endsWith('sync.bat')) return true;
    if (normalized.endsWith('baitaplon_sync_launcher.vbs')) return true;
    if (normalized.endsWith('run_watcher.bat')) return true;
    
    // Ignore OS files
    if (normalized.endsWith('Thumbs.db') || normalized.endsWith('.DS_Store')) return true;
    
    // Ignore local temporary files
    if (normalized.includes('/tmp/') || normalized.includes('/temp/')) return true;
    
    return false;
}

// Function to execute a command asynchronously returning a promise
function runCmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd: repoDir }, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, code: error.code, stdout, stderr });
            } else {
                resolve({ success: true, code: 0, stdout, stderr });
            }
        });
    });
}

// Core sync function
async function syncChanges() {
    log(`Bắt đầu đồng bộ tự động cho các thay đổi trong: ${Array.from(changedFiles).join(', ')}`);
    changedFiles.clear();

    // 1. Stage changes
    log('Đang thực hiện git add...');
    const addRes = await runCmd(`"${gitExe}" add .`);
    if (!addRes.success) {
        log(`[LỖI] git add thất bại: ${addRes.stderr || 'Không có chi tiết lỗi'}`);
        return;
    }

    // 2. Check if there are changes to commit
    const diffRes = await runCmd(`"${gitExe}" diff --cached --quiet`);
    if (diffRes.success) {
        log('Không có thay đổi nào thực sự cần commit.');
        return;
    }

    // 3. Commit
    const commitMsg = `Auto-sync: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;
    log(`Đang thực hiện commit: "${commitMsg}"...`);
    const commitRes = await runCmd(`"${gitExe}" commit -m "${commitMsg}"`);
    if (!commitRes.success) {
        log(`[LỖI] git commit thất bại: ${commitRes.stderr}`);
        return;
    }

    // 4. Push to origin master (Re-enabled for automatic deployment)
    log('Đang đẩy dữ liệu lên GitHub (push origin master)...');
    const pushRes = await runCmd(`"${gitExe}" push origin master`);
    if (pushRes.success) {
        log('ĐỒNG BỘ THÀNH CÔNG! Website online đang được Render tự động deploy.');
    } else {
        log(`[LỖI] Không thể push lên GitHub: ${pushRes.stderr}`);
    }
}

// Watch directory
log('Đang khởi động chương trình theo dõi thay đổi thư mục...');
log(`Thư mục đang theo dõi: ${repoDir}`);

try {
    fs.watch(repoDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        if (shouldIgnore(filename)) {
            return;
        }

        changedFiles.add(filename);

        // Reset timer (debounce)
        if (syncTimer) {
            clearTimeout(syncTimer);
        }

        syncTimer = setTimeout(() => {
            syncTimer = null;
            syncChanges().catch(err => {
                log(`[LỖI HỆ THỐNG] Lỗi không mong đợi trong quá trình đồng bộ: ${err.message}`);
            });
        }, debounceDelay);
    });

    log('Đã bắt đầu chạy File Watcher thành công! Hệ thống đang lắng nghe thay đổi...');
} catch (error) {
    log(`[LỖI HỆ THỐNG] Không thể khởi chạy File Watcher: ${error.message}`);
    cleanupPid();
    process.exit(1);
}
