# Private Sensitive Notes V1

## Mục tiêu

Đây là module proof-of-platform đầu tiên cho dữ liệu `highly-sensitive`. Nó không phải module chẩn đoán/tâm lý/thuốc. Mục tiêu là chứng minh dữ liệu nhạy cảm thật sự đi qua đồng thời:

1. active profile;
2. Profile Privacy đã cấu hình;
3. viewer role hiện tại được policy cho phép;
4. Secure Vault của đúng profile đang mở;
5. AES-GCM/IndexedDB storage, không có plaintext fallback.

## Domain

Module dùng domain có sẵn:

`records-appointments-documents`

Domain này phải tiếp tục là `highly-sensitive` trong `health-domain-catalog.ts`.

## Dữ liệu

Bản ghi Private Note dùng `VaultPayloadEnvelope`:

- `profileId`
- `recordId` ngẫu nhiên bằng `crypto.randomUUID()`
- `domainId = records-appointments-documents`
- `createdAt`
- `updatedAt`
- encrypted `data.kind = private-note-v1`
- encrypted `data.text`

Nội dung ghi chú không được đưa vào:

- `HealthLocalState`
- DailyRecord
- Health Timeline
- backup baseline JSON
- Site Quản trị
- Control Plane audit
- network API

## Privacy gate

Mặc định domain này là `unconfigured`, vì vậy Private Notes khóa.

Sau khi người dùng chủ động chọn visibility, module dùng `canViewerAccessDomain()` với viewer role hiện tại. Khi policy/role thay đổi trong cùng tab, privacy engine phát custom event local để module cập nhật ngay.

Viewer role V1 vẫn không phải xác thực danh tính. Vault PIN là lớp mật mã cho storage, không chứng minh người mở khóa là phụ huynh hay chính trẻ.

## Secure Vault Session V2

Khóa Vault không còn nằm riêng trong UI Vault Center. `SecureVaultSessionProvider` giữ một phiên mở khóa dùng chung cho đúng active profile:

- Profile switch làm mất tham chiếu key cũ;
- inactivity 10 phút khóa Vault;
- `pagehide` khóa Vault;
- khóa thủ công;
- key không persist;
- Sensitive Notes chỉ nhận key qua `useSecureVaultSession()`.

## UI và hành vi

Nếu policy chưa cấu hình:
- không decrypt;
- không hiện số lượng ghi chú;
- hướng người dùng về Profile Privacy.

Nếu viewer không được phép:
- không decrypt;
- không hiện nội dung/count.

Nếu Vault chưa mở:
- không decrypt;
- không có plaintext fallback.

Chỉ khi cả Privacy + Vault đều cho phép:
- tạo ghi chú;
- mã hóa và lưu;
- đọc/decrypt;
- xóa bằng thao tác xác nhận.

## Ranh giới y tế

Private Notes không:
- đánh giá triệu chứng;
- chấm điểm sức khỏe;
- chẩn đoán;
- khuyến nghị thuốc/liều;
- tự sinh cảnh báo lâm sàng;
- xuất hiện trên dashboard/timeline dùng chung.

## Release gate

Trước merge phải PASS:
- WHO growth reference validator;
- full framework validators;
- Profile Registry;
- Profile Privacy;
- Secure Vault/session;
- Private Sensitive Notes validator;
- Device classifier;
- repository separation;
- lint;
- production build.
