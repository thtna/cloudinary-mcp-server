"use strict";
/**
 * Cloudinary MCP Immune System
 * Cung cấp khả năng tự chữa lành (Self-healing) cho các tác vụ media.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resilientExec = resilientExec;
exports.getImmuneStatus = getImmuneStatus;
const status = {
    lastError: null,
    recoveredCount: 0,
    quarantineCount: 0,
    logs: []
};
function log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}`;
    status.logs.push(entry);
    if (status.logs.length > 50)
        status.logs.shift();
    console.error(entry);
}
/**
 * Lõi thực thi "Bất tử":
 * Lớp 1: Thử lại ngay lập tức (Retry)
 * Lớp 2: Nghỉ 2s rồi thử lại (Wait & Retry)
 * Lớp 3: Cách ly lỗi (Quarantine)
 */
async function resilientExec(taskName, operation, fallback) {
    try {
        // Lớp 1: Tấn công trực diện
        return await operation();
    }
    catch (err) {
        status.lastError = err.message;
        log(`[Layer 1 Failure] ${taskName}: ${err.message}. Đang kích hoạt tự chữa lành...`);
        try {
            // Lớp 2: Hồi sức cấp cứu (Nghỉ 2 giây)
            await new Promise(resolve => setTimeout(resolve, 2000));
            const result = await operation();
            status.recoveredCount++;
            log(`[Success] ${taskName} đã tự chữa lành thành công ở Lớp 2.`);
            return result;
        }
        catch (err2) {
            // Lớp 3: Cách ly (Quarantine)
            status.quarantineCount++;
            log(`[Layer 3 - Quarantine] ${taskName} thất bại hoàn toàn. Đã cách ly lỗi để bảo vệ hệ thống.`);
            return fallback;
        }
    }
}
function getImmuneStatus() {
    return status;
}
//# sourceMappingURL=immune-system.js.map