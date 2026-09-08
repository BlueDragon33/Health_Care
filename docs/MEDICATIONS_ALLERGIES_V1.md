# Medications & Allergies V1

## Mục tiêu

Tạo module quản lý thuốc và dị ứng đầu tiên chạy hoàn toàn trên lớp bảo vệ:

`active profile → Profile Privacy → viewer permission → Secure Vault → encrypted backup`

Module chỉ là **sổ ghi chép thông tin đã biết**, không phải công cụ kê đơn hay ra quyết định điều trị.

## Domain

- `medications-allergies`
- privacy: `highly-sensitive`
- phải được người dùng cấu hình rõ visibility trong Profile Privacy trước khi sử dụng.

## Bản ghi thuốc

Lưu:

- tên thuốc/sản phẩm đúng theo nhãn hoặc thông tin người dùng có;
- trạng thái ghi chép: đang được ghi nhận là đang dùng / đã dùng trước đây;
- ngày bắt đầu/kết thúc nếu biết;
- hướng dẫn dùng dạng văn bản **chép lại nguyên thông tin đã được cung cấp**;
- nguồn/provenance;
- ghi chú nguồn;
- ghi chú thêm.

Không thực hiện:

- tính liều;
- suy ra liều từ tuổi/cân nặng;
- đề xuất thuốc;
- kiểm tra tương tác thuốc;
- tự đổi/ngừng thuốc;
- tự tạo đơn;
- suy luận chẩn đoán từ thuốc đang dùng.

## Bản ghi dị ứng / phản ứng

Lưu:

- chất/thuốc/thực phẩm được ghi nhận;
- mô tả phản ứng đã từng được ghi nhận hoặc quan sát;
- nguồn/provenance;
- ghi chú nguồn;
- ghi chú thêm.

V1 không tự phân loại mức độ, không tự kết luận nguyên nhân và không chẩn đoán dị ứng.

## Provenance

Nguồn được chọn từ:

- đơn thuốc / nhãn thuốc;
- bác sĩ / nhân viên y tế;
- người chăm sóc nhập lại thông tin đã biết;
- ghi lại từ thông tin đã được cung cấp;
- nguồn khác.

Provenance mô tả nguồn nhập, không chứng minh tính đúng y khoa của dữ liệu.

## Storage

- không lưu vào `HealthLocalState`;
- không lưu vào `DailyRecord`;
- không đưa vào Health Timeline baseline;
- không lưu plaintext trong localStorage/sessionStorage;
- không gửi Site Quản trị;
- không network call từ module;
- mọi record được `putVaultRecord` vào AES-GCM/IndexedDB;
- xóa cần Vault đang mở và xác nhận người dùng.

Do Secure Vault Backup V1 xuất toàn bộ payload Vault, thuốc/dị ứng được bao gồm tự động trong bản sao mã hóa mà không cần một luồng backup plaintext riêng.

## Reminder boundary

V1 **không tự tạo reminder từ tên thuốc, liều hoặc lịch dùng**. Reminder Engine hiện tại thuộc baseline storage và việc đưa tên thuốc/lịch dùng nhạy cảm vào đó sẽ phá ranh giới Vault.

Một reminder adapter cho dữ liệu rất nhạy cảm chỉ được mở sau khi có thiết kế riêng bảo đảm:

- schedule/metadata không làm lộ thông tin thuốc;
- notification title được redacted;
- không lưu health payload vào Control Plane;
- không làm mất khả năng nhắc khi Vault đang khóa.

## Shared access hook

`use-sensitive-vault-domain.ts` gom logic dùng chung cho các module `highly-sensitive`:

- đọc policy profile;
- đọc viewer role;
- phản ứng với thay đổi policy/role trong cùng tab;
- kiểm `canViewerAccessDomain`;
- yêu cầu Vault của active profile đang mở;
- không phụ thuộc Admin/Control Plane.

Private Sensitive Notes được chuyển sang hook này để tránh lặp logic bảo mật.

## Gate

`validate-medications-allergies.mjs` bắt buộc kiểm:

- domain vẫn `highly-sensitive`;
- explicit Profile Privacy + viewer + unlocked Vault;
- chỉ dùng Vault read/write/delete;
- không baseline/Web Storage/network/Admin;
- không reminder leakage;
- provenance fields;
- không logic tính liều/đề xuất/tương tác/đổi điều trị/chẩn đoán dị ứng;
- confirm trước destructive delete;
- UI selected state `aria-pressed`;
- 3D press/focus/responsive/reduced-motion;
- integration trong cùng SecureVaultSessionProvider;
- full CI/lint/build trước merge.
