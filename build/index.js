"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const cloudinary_1 = require("cloudinary");
const immune_system_js_1 = require("./immune-system.js");
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error("Thiếu biến môi trường Cloudinary. Vui lòng kiểm tra cấu hình.");
}
cloudinary_1.v2.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});
class CloudinaryServer {
    server;
    constructor() {
        this.server = new index_js_1.Server({
            name: "cloudinary-mcp-server",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error("[MCP Error]", error);
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "cloudinary_upload",
                    description: "Tải ảnh hoặc video lên Cloudinary (từ đường dẫn máy tính hoặc URL)",
                    inputSchema: {
                        type: "object",
                        properties: {
                            path: { type: "string", description: "Đường dẫn file local hoặc URL ảnh" },
                            folder: { type: "string", description: "Thư mục lưu trữ trên Cloudinary" },
                            public_id: { type: "string", description: "Tên định danh cho ảnh" },
                        },
                        required: ["path"],
                    },
                },
                {
                    name: "cloudinary_list",
                    description: "Liệt kê danh sách tài nguyên trên Cloudinary",
                    inputSchema: {
                        type: "object",
                        properties: {
                            prefix: { type: "string", description: "Tìm kiếm theo tiền tố/thư mục" },
                            max_results: { type: "number", default: 10 },
                        },
                    },
                },
                {
                    name: "cloudinary_transform",
                    description: "Tạo URL ảnh với các hiệu ứng biến đổi (resize, crop, filter)",
                    inputSchema: {
                        type: "object",
                        properties: {
                            public_id: { type: "string", description: "ID của ảnh" },
                            width: { type: "number" },
                            height: { type: "number" },
                            crop: { type: "string", default: "scale" },
                            format: { type: "string", default: "webp" },
                        },
                        required: ["public_id"],
                    },
                },
                {
                    name: "cloudinary_delete",
                    description: "Xóa tài nguyên khỏi Cloudinary",
                    inputSchema: {
                        type: "object",
                        properties: {
                            public_id: { type: "string", description: "ID của tài nguyên cần xóa" },
                        },
                        required: ["public_id"],
                    },
                },
                {
                    name: "cloudinary_get_immune_status",
                    description: "Kiểm tra tình trạng sức khỏe và nhật ký tự chữa lành của hệ thống",
                    inputSchema: { type: "object", properties: {} },
                },
            ],
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case "cloudinary_upload": {
                    const { path, folder, public_id } = args;
                    return await (0, immune_system_js_1.resilientExec)("Upload Asset", async () => {
                        const res = await cloudinary_1.v2.uploader.upload(path, { folder, public_id });
                        return {
                            content: [{ type: "text", text: `Upload thành công! URL: ${res.secure_url}\nID: ${res.public_id}` }],
                        };
                    }, { content: [{ type: "text", text: "Lỗi: Không thể upload ảnh sau các lần thử chữa lành." }] });
                }
                case "cloudinary_list": {
                    const { prefix, max_results } = args;
                    return await (0, immune_system_js_1.resilientExec)("List Resources", async () => {
                        const res = await cloudinary_1.v2.api.resources({ type: "upload", prefix, max_results });
                        return {
                            content: [{ type: "text", text: JSON.stringify(res.resources, null, 2) }],
                        };
                    }, { content: [{ type: "text", text: "Lỗi: Không thể lấy danh sách từ Cloudinary." }] });
                }
                case "cloudinary_transform": {
                    const { public_id, width, height, crop, format } = args;
                    const url = cloudinary_1.v2.url(public_id, {
                        width,
                        height,
                        crop,
                        format,
                        secure: true,
                    });
                    return {
                        content: [{ type: "text", text: `URL đã biến đổi: ${url}` }],
                    };
                }
                case "cloudinary_delete": {
                    const { public_id } = args;
                    return await (0, immune_system_js_1.resilientExec)("Delete Asset", async () => {
                        const res = await cloudinary_1.v2.uploader.destroy(public_id);
                        return {
                            content: [{ type: "text", text: `Kết quả xóa: ${res.result}` }],
                        };
                    }, { content: [{ type: "text", text: "Lỗi: Không thể xóa tài nguyên." }] });
                }
                case "cloudinary_get_immune_status": {
                    const status = (0, immune_system_js_1.getImmuneStatus)();
                    return {
                        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
                    };
                }
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool not found: ${name}`);
            }
        });
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error("Cloudinary MCP server running on stdio");
    }
}
const server = new CloudinaryServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map