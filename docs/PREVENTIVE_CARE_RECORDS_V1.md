# Preventive Care & Immunization Records V1

## Mục tiêu

Lưu lịch sử khám phòng ngừa và tiêm chủng đã thực hiện cho hồ sơ 9–18 tuổi mà không tự áp lịch khuyến nghị quốc gia hoặc suy trạng thái đủ/chưa đủ/quá hạn.

## Khám phòng ngừa
- chăm sóc ban đầu;
- nha khoa;
- mắt/thị lực;
- tai/thính lực;
- khám/sàng lọc học đường;
- khám phòng ngừa khác;
- ngày, cơ sở, nhân viên y tế, tóm tắt và provenance.

## Tiêm chủng đã thực hiện
- tên vaccine theo sổ/giấy xác nhận;
- ngày tiêm;
- mũi/liều ghi trên hồ sơ nếu có;
- sản phẩm/nhà sản xuất;
- số lô;
- cơ sở tiêm;
- nguồn/tài liệu;
- ghi chú.

## Guardrails

V1 không:
- tự tính lịch tiêm;
- tự suy mũi kế tiếp;
- tự đánh dấu quá hạn/catch-up;
- tự kết luận đủ/chưa đủ vaccine;
- đề xuất vaccine;
- dùng lịch một quốc gia làm mặc định cho Việt Nam;
- tự sinh lịch khám tiếp theo.

Nếu sau này bật guideline engine, phải có nguồn, phiên bản, quốc gia/cấu hình hồ sơ và test riêng.

## Privacy & storage

Domain `preventive-care` là `sensitive`. V1 chủ động lưu record trong Secure Vault:
- tôn trọng Profile Privacy/viewer role;
- cần active-profile Vault mở;
- AES-GCM encrypted record;
- encrypted Vault backup;
- không baseline HealthLocalState/DailyRecord/Timeline;
- không Site Quản trị/Control Plane/network.

## UI

Hai chế độ:
- Khám / chăm sóc phòng ngừa;
- Tiêm chủng đã thực hiện.

Nút chuyển chế độ có selected state, `aria-pressed`, hiệu ứng 3D, focus-visible, responsive và reduced-motion.
