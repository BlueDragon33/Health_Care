# Health Control Secret Migration

Sức khỏe Y tế dùng bí mật điều khiển riêng giữa `Health_Care` và Trung tâm Quản trị.

## Tên chuẩn

- `HEALTH_CONTROL_SERVICE_SECRET`: bí mật riêng của Control Plane Sức khỏe Y tế.
- `CONTROL_SERVICE_SECRET`: tên cũ, chỉ giữ làm fallback trong giai đoạn chuyển đổi.

## Trình tự chuyển đổi an toàn

1. Cấu hình cùng một giá trị `HEALTH_CONTROL_SERVICE_SECRET` trên Worker Health_Care và Worker Trung tâm Quản trị.
2. Xác nhận `/api/control/status` báo `controlAuth.secretScope = health` và Trung tâm báo kết nối sẵn sàng.
3. Chỉ sau khi xác nhận mới được gỡ phụ thuộc Health khỏi `CONTROL_SERVICE_SECRET` dùng chung.

Không ghi giá trị secret vào mã nguồn, log, audit hoặc dữ liệu sức khỏe.
