# Cloudinary MCP Server "Bất tử" (Immune System)

Một Máy chủ Giao thức Bối cảnh Mô hình (MCP) chuyên dụng cho Cloudinary, được trang bị **Hệ Miễn Dịch (Immune System)** tùy chỉnh để đảm bảo tính sẵn sàng cao và khả năng tự chữa lành lỗi.

## Tính năng
- **Upload Asset**: Tải hình ảnh/video lên nhanh chóng.
- **List Resources**: Lấy danh sách tài nguyên trong kho.
- **Transform**: Tạo URL ảnh đã qua xử lý (resize, crop, filter) bằng AI.
- **Immune System**:
  - **Auto-Retry**: Tự động thử lại khi gặp lỗi nhẹ.
  - **Wait & Recovery**: Tự nghỉ chân và phục hồi khi bị quá tải API.
  - **Quarantine**: Cách ly lỗi để bảo vệ ứng dụng chính không bị crash.

## Cài đặt (MCP Config)
```json
"cloudinary-mcp-server": {
  "command": "node",
  "args": ["path/to/build/index.js"],
  "env": {
    "CLOUDINARY_CLOUD_NAME": "YOUR_NAME",
    "CLOUDINARY_API_KEY": "YOUR_KEY",
    "CLOUDINARY_API_SECRET": "YOUR_SECRET"
  }
}
```

## Tác giả
Phát triển bởi **Antigravity AI** cho tài khoản **thtna**.
