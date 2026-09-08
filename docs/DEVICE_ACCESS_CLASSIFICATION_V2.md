# Device Access Classification V2

## Mục tiêu

Sức khỏe Y tế tự nhận diện môi trường thiết bị khi truy cập lần đầu và gửi **metadata vận hành tối thiểu** sang Control API để Trung tâm Quản trị tự phân loại thiết bị. Bơi ếch chỉ là mẫu cách quản trị; Health_Care không phụ thuộc runtime, database hay business code của Bơi ếch.

## Luồng

`Health_Care -> enrollment -> server classifier -> site_access_devices -> Control API -> Trung tâm Quản trị`

Mỗi cài đặt có:

- khóa P-256 riêng dùng làm danh tính/xác thực thiết bị;
- `installationId` ngẫu nhiên lưu trong IndexedDB;
- loại tự động: `desktop | phone | tablet`;
- độ tin cậy: `high | medium | low`;
- lý do phân loại để quản trị có thể kiểm tra;
- metadata vận hành: OS, browser/version, kích thước màn hình/viewport, touch, PWA, ngôn ngữ, timezone.

Không sử dụng MAC address, serial phần cứng, IMEI hoặc fingerprint xâm lấn.

## Phân loại

Server là nguồn quyết định cuối cùng. Client chỉ gửi tín hiệu môi trường. Bộ phân loại kết hợp:

1. User-Agent / Client Hints mobile;
2. platform/OS;
3. touch points;
4. kích thước màn hình;
5. tín hiệu iPad/iPhone/Android/tablet.

Quyền truy cập **không** được quyết định bởi loại thiết bị. Sau phân loại, thiết bị vẫn ở `pending` cho đến khi Trung tâm Quản trị cấp quyền.

## Ranh giới dữ liệu

Control Plane chỉ nhận metadata thiết bị và trạng thái vận hành. Không gửi chiều cao, cân nặng, BMI, nhật ký, dinh dưỡng, triệu chứng hoặc hồ sơ sức khỏe cá nhân sang Trung tâm Quản trị.
