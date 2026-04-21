import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { v2 as cloudinary } from "cloudinary";
import { resilientExec, getImmuneStatus } from "./immune-system.js";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Thiếu biến môi trường Cloudinary. Vui lòng kiểm tra cấu hình.");
}

cloudinary.config({
  cloud_name: CLOUD_NAME as string,
  api_key: API_KEY as string,
  api_secret: API_SECRET as string,
  secure: true,
});

class CloudinaryServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "cloudinary-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error("[MCP Error]", error);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "cloudinary_upload": {
          const { path, folder, public_id } = args as any;
          return await resilientExec(
            "Upload Asset",
            async () => {
              const res = await cloudinary.uploader.upload(path, { folder, public_id });
              return {
                content: [{ type: "text", text: `Upload thành công! URL: ${res.secure_url}\nID: ${res.public_id}` }],
              };
            },
            { content: [{ type: "text", text: "Lỗi: Không thể upload ảnh sau các lần thử chữa lành." }] }
          );
        }

        case "cloudinary_list": {
          const { prefix, max_results } = args as any;
          return await resilientExec(
            "List Resources",
            async () => {
              const res = await cloudinary.api.resources({ type: "upload", prefix, max_results });
              return {
                content: [{ type: "text", text: JSON.stringify(res.resources, null, 2) }],
              };
            },
            { content: [{ type: "text", text: "Lỗi: Không thể lấy danh sách từ Cloudinary." }] }
          );
        }

        case "cloudinary_transform": {
          const { public_id, width, height, crop, format } = args as any;
          const url = cloudinary.url(public_id, {
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
          const { public_id } = args as any;
          return await resilientExec(
            "Delete Asset",
            async () => {
              const res = await cloudinary.uploader.destroy(public_id);
              return {
                content: [{ type: "text", text: `Kết quả xóa: ${res.result}` }],
              };
            },
            { content: [{ type: "text", text: "Lỗi: Không thể xóa tài nguyên." }] }
          );
        }

        case "cloudinary_get_immune_status": {
          const status = getImmuneStatus();
          return {
            content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Cloudinary MCP server running on stdio");
  }
}

const server = new CloudinaryServer();
server.run().catch(console.error);
