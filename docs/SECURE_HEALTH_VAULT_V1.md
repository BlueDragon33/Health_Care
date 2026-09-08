# Secure Health Vault V1

## Mục tiêu

Secure Health Vault V1 là lớp local-only dành cho dữ liệu `highly-sensitive` trong Health_Care. Nó không thay thế Device Access hay Profile Privacy; ba lớp độc lập:

1. Site Quản trị quyết định thiết bị có được mở Health_Care hay không.
2. Profile Privacy quyết định phạm vi xem trong từng hồ sơ.
3. Secure Vault bảo vệ payload rất nhạy cảm khi lưu cục bộ.

## Phạm vi V1

- mỗi hồ sơ có cấu hình Vault riêng theo `profileId`;
- PIN/cụm mã không persist;
- khóa AES được dẫn xuất bằng PBKDF2 + SHA-256 và chỉ giữ trong memory khi Vault mở;
- payload được AES-GCM 256-bit mã hóa trước khi ghi IndexedDB;
- random salt cho cấu hình và random IV cho từng ciphertext;
- AES-GCM additional authenticated data gắn với `profileId`;
- khóa của hồ sơ A không được dùng để đọc/ghi hợp lệ cho hồ sơ B;
- tự khóa sau 10 phút không hoạt động;
- có khóa ngay thủ công;
- destructive record operation yêu cầu khóa Vault đang mở;
- notification helper che tiêu đề của nội dung `highly-sensitive`;
- không có network call từ Vault engine/UI;
- PIN, derived key, ciphertext và health payload không gửi sang Site Quản trị.

## Những gì V1 cố ý chưa làm

- chưa tự di trú Growth/Daily/Timeline hiện hữu vào Vault;
- chưa có recovery key;
- chưa có reset PIN an toàn cho Vault đã có dữ liệu;
- chưa có đồng bộ ciphertext server-side;
- chưa có module tâm lý/dậy thì/chu kỳ/thuốc sâu sử dụng Vault;
- chưa tuyên bố chống được XSS/malware khi Vault đang mở;
- chưa tuyên bố tuân thủ HIPAA/GDPR hay chuẩn pháp lý cụ thể.

## Storage

Metadata cấu hình không chứa health payload:

`localStorage: suc-khoe-y-te:vault-config:v1:<profileId>`

Payload mã hóa:

- IndexedDB: `suc-khoe-y-te-vault-v1`
- object store: `records`

`recordId` cần là định danh kỹ thuật không mang nội dung y tế có nghĩa.

## KDF và mã hóa

V1 dùng:

- PBKDF2
- SHA-256
- 250,000 iterations
- AES-GCM 256-bit
- IV 96-bit ngẫu nhiên cho mỗi lần mã hóa
- AAD: `suc-khoe-y-te:vault:v1:<profileId>`

Thông số này là contract V1, không được mô tả là chuẩn pháp lý hoặc bảo đảm an toàn tuyệt đối.

## PIN

- tối thiểu 8 ký tự;
- tối đa 128 ký tự;
- khuyến nghị dùng cụm mã khó đoán;
- không dùng ngày sinh, mã thiết bị hoặc thông tin dễ đoán;
- quên PIN trong V1 có thể làm dữ liệu Vault không thể giải mã.

## Release gates

Trước merge phải PASS:

- Secure Vault validator;
- crypto round-trip;
- wrong-PIN rejection;
- cross-profile AAD rejection;
- Profile Registry validator;
- Profile Privacy validator;
- Device classifier;
- repository separation;
- lint;
- production build.

Không merge nếu bất kỳ gate nào FAIL.
