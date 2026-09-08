# Chronic Conditions & Care Plans V1

## Mục tiêu

Lưu an toàn các thông tin bệnh nền/tình trạng sức khỏe đã được xác định, tiền sử nhập viện/phẫu thuật/thủ thuật và kế hoạch chăm sóc đã được cung cấp cho hồ sơ 9–18 tuổi.

## Phạm vi

### Bệnh nền / tình trạng đã biết
- tên tình trạng theo thông tin đã có;
- trạng thái ghi nhận;
- ngày biết nếu có;
- chuyên khoa, bác sĩ/cơ sở theo dõi;
- nguồn/provenance;
- ghi chú.

### Tiền sử y tế
- nhập viện;
- phẫu thuật;
- cấp cứu;
- thủ thuật/can thiệp;
- sự kiện y tế khác;
- ngày, cơ sở, tóm tắt và nguồn.

### Kế hoạch chăm sóc
- tên và trạng thái kế hoạch;
- nội dung kế hoạch được chép từ nguồn;
- hướng dẫn xử trí cá nhân đã được cung cấp;
- hỗ trợ tại trường/sinh hoạt;
- lịch tái khám/theo dõi dưới dạng văn bản nguồn;
- provenance.

## Ranh giới y khoa

Ứng dụng không:
- tự chẩn đoán bệnh;
- tự thêm bệnh vào problem list;
- tự tạo kế hoạch điều trị;
- tự thay đổi kế hoạch đã được cung cấp;
- tự tạo hướng dẫn cấp cứu mới;
- tính risk score;
- tính liều thuốc;
- tự tạo reminder y khoa từ nội dung nhạy cảm.

Các nội dung về kế hoạch/hướng dẫn trong module chỉ là thông tin người dùng nhập lại từ hồ sơ hoặc chuyên gia.

## Privacy & storage

Domain `chronic-conditions-care-plans` là `highly-sensitive`.

Điều kiện truy cập:
1. Profile Privacy phải được cấu hình;
2. viewer role hiện tại phải được phép;
3. Secure Vault của đúng active profile phải đang mở.

Persistence:
- AES-GCM Secure Vault;
- không plaintext trong HealthLocalState/DailyRecord;
- không Health Timeline;
- không baseline JSON backup;
- tự đi cùng encrypted Vault backup;
- không Control Plane/Admin/network flow.

## UI

Ba chế độ:
- Bệnh nền / tình trạng;
- Tiền sử y tế;
- Kế hoạch chăm sóc.

Nút chuyển chế độ có selected state, `aria-pressed`, hiệu ứng nhấn 3D, focus-visible, responsive và reduced-motion.

## Gate

`scripts/validate-chronic-conditions-care-plans.mjs` khóa:
- domain highly-sensitive;
- shared Profile Privacy + Vault access;
- Vault-only persistence;
- provenance fields;
- không Web Storage/network/Admin/Timeline/Reminder fallback;
- không generated diagnosis/treatment/emergency instructions;
- runtime/CSS/CI integration.
