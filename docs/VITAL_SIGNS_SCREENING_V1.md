# Vital Signs & Screening Results V1

## Mục tiêu

Bổ sung kho ghi chép mã hóa cho dấu hiệu sinh tồn, mắt/tai và kết quả sàng lọc/xét nghiệm trong phạm vi hồ sơ Sức khỏe Y tế 9–18 tuổi.

Module này là **record keeper**, không phải clinical decision support.

## Ranh giới dữ liệu

Domain:

- `vital-signs-screening-results`
- privacy: `highly-sensitive`

Điều kiện đọc/ghi:

1. đúng active profile;
2. Profile Privacy của domain đã được cấu hình;
3. viewer role hiện tại được policy cho phép;
4. Secure Vault của profile đang `unlocked`.

Persistence:

- ciphertext trong Secure Vault/IndexedDB;
- key chỉ nằm trong memory của phiên Vault;
- không plaintext fallback sang `HealthLocalState`, `DailyRecord`, Timeline hay Web Storage;
- không network;
- không Control Plane/Admin;
- tự nằm trong Secure Vault encrypted backup;
- không nằm trong baseline JSON backup.

## Loại bản ghi

### 1. Dấu hiệu sinh tồn

V1 hỗ trợ ghi lại:

- huyết áp;
- nhịp tim;
- nhiệt độ cơ thể;
- SpO₂;
- nhịp thở;
- chỉ số khác do người dùng đặt tên và ghi đơn vị.

Các đơn vị mặc định chỉ nhằm giữ cấu trúc dữ liệu:

- huyết áp: `mmHg`;
- nhịp tim: `bpm`;
- nhiệt độ: `°C`;
- SpO₂: `%`;
- nhịp thở: `lần/phút`.

Ứng dụng không tự đặt ngưỡng, không tô màu cảnh báo và không gắn nhãn bình thường/bất thường.

### 2. Mắt / tai

Ghi lại kết quả bên trái/phải đúng như nguồn đã có, kèm:

- ngày kiểm tra;
- phương pháp/dụng cụ nếu biết;
- bối cảnh khi đo;
- nguồn/provenance;
- ghi chú.

Không tự chuyển chuỗi kết quả thành chẩn đoán hoặc kết luận pass/fail mới.

### 3. Sàng lọc / xét nghiệm

Ghi lại:

- tên xét nghiệm/kiểm tra;
- ngày;
- kết quả;
- đơn vị;
- khoảng tham chiếu được chép từ nguồn nếu có;
- phương pháp/loại mẫu nếu biết;
- nguồn/provenance;
- ghi chú.

`referenceText` chỉ là văn bản nguồn. V1 không parse hoặc so sánh range.

## Clinical guardrails

Không triển khai trong V1:

- phân loại bình thường/bất thường;
- percentile/z-score cho dấu hiệu sinh tồn;
- suy diễn theo tuổi/giới;
- chẩn đoán;
- đề xuất điều trị;
- tự tạo cảnh báo y khoa từ số đo;
- tự đưa kết quả vào Reminder Engine;
- gửi dữ liệu sang Site Quản trị.

Rule chuyên môn trong tương lai chỉ được bật sau khi có nguồn chuẩn, đơn vị, phạm vi tuổi/giới và test riêng.

## UX

Ba chế độ:

- Dấu hiệu sinh tồn;
- Mắt / tai;
- Sàng lọc / xét nghiệm.

Nút chọn dùng trạng thái 3D:

- raised mặc định;
- hover lift;
- pressed/inset;
- selected giữ trạng thái;
- `aria-pressed`;
- `:focus-visible`;
- responsive;
- `prefers-reduced-motion`.

## Validation gate

`scripts/validate-vital-signs-screening.mjs` kiểm:

- domain vẫn `highly-sensitive`;
- shared sensitive-domain hook vẫn yêu cầu privacy/viewer/Vault;
- chỉ dùng Vault CRUD;
- không baseline/Web Storage/network/Admin/Reminder/Timeline;
- có provenance;
- có 3 loại record;
- không dùng BMI/z-score/percentile hoặc clinical classification engine;
- runtime composition + CSS + CI gate tồn tại.
