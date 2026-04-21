/**
 * Cloudinary MCP Immune System
 * Cung cấp khả năng tự chữa lành (Self-healing) cho các tác vụ media.
 */
export interface ImmuneStatus {
    lastError: string | null;
    recoveredCount: number;
    quarantineCount: number;
    logs: string[];
}
/**
 * Lõi thực thi "Bất tử":
 * Lớp 1: Thử lại ngay lập tức (Retry)
 * Lớp 2: Nghỉ 2s rồi thử lại (Wait & Retry)
 * Lớp 3: Cách ly lỗi (Quarantine)
 */
export declare function resilientExec<T>(taskName: string, operation: () => Promise<T>, fallback: T): Promise<T>;
export declare function getImmuneStatus(): ImmuneStatus;
//# sourceMappingURL=immune-system.d.ts.map