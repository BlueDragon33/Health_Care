# Health Control Secret Isolation

Sức khỏe Y tế sử dụng bí mật điều khiển riêng giữa `Health_Care` và Trung tâm Quản trị. Việc dùng secret chung đã kết thúc; Health_Care phải fail closed nếu secret riêng chưa được cấu hình.

## Tên bắt buộc

- `HEALTH_CONTROL_SERVICE_SECRET`: secret duy nhất được phép dùng cho Control Plane Sức khỏe Y tế.
- `CONTROL_SERVICE_SECRET`: không được phép làm fallback cho Health_Care.

## Ranh giới hệ thống

1. `Health_Care` là site/Worker độc lập và sở hữu runtime, D1, registry thiết bị, session và dữ liệu sức khỏe của chính nó.
2. `Application-Management` chỉ cấp quyền, phát vé bridge ngắn hạn và gọi Control API của Health_Care.
3. Trung tâm Quản trị không được nhập runtime/business code của Health_Care và không được lưu dữ liệu sức khỏe người dùng.
4. Health_Care không được phụ thuộc runtime, repository hoặc database của BOIECH_AI/Application-Management.

## Cấu hình triển khai

1. Tạo một giá trị đủ mạnh, tối thiểu 32 ký tự, dành riêng cho Health_Care.
2. Cấu hình cùng giá trị đó dưới tên `HEALTH_CONTROL_SERVICE_SECRET` trên Worker Health_Care và Worker Trung tâm Quản trị.
3. Xác nhận bridge của Trung tâm kết nối được tới `/api/control/status` và phản hồi `controlAuth.secretScope = health`.
4. Nếu Health Worker còn secret cũ `CONTROL_SERVICE_SECRET`, có thể xóa khỏi môi trường Health sau khi xác nhận bước 3; mã Health_Care không còn đọc secret cũ.
5. Không ghi giá trị secret vào source code, log, audit, database, ticket payload hoặc dữ liệu sức khỏe.

## Hành vi khi sai cấu hình

Nếu `HEALTH_CONTROL_SERVICE_SECRET` thiếu hoặc ngắn hơn yêu cầu, Control API phải từ chối kết nối với mã `HEALTH_CONTROL_SECRET_UNCONFIGURED`; tuyệt đối không tự chuyển sang secret chung.
