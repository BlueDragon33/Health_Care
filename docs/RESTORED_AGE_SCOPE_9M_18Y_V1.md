# Restore phạm vi 9 tháng → 18 tuổi V1

## Lý do

Bản Web App hiện tại đã phát triển sâu ở 9–18 tuổi nhưng phần nội dung gốc 9 tháng–5 tuổi bị rơi khỏi shell chính trong quá trình mở rộng. V1 khôi phục phần này mà không loại bỏ các module 9–18 đã hoàn thiện.

## Phạm vi mới

Web App có phạm vi sản phẩm liên tục **9–227 tháng**:

1. 9–11 tháng
2. 12–23 tháng
3. 2–5 tuổi
4. 6–8 tuổi
5. 9–10 tuổi
6. 11–12 tuổi
7. 13–15 tuổi
8. 16–18 tuổi

`profileAgeScope()` dùng `HEALTH_LIFE_STAGES` để xác định phạm vi sản phẩm; `HEALTH_AGE_STAGES` cũ vẫn giữ cho các module đã kiểm định riêng ở 9–18 tuổi.

## Nội dung được khôi phục từ bản cẩm nang cũ

- ăn/uống và chống hóc;
- giấc ngủ;
- răng miệng;
- phát triển 9, 12, 18, 24, 36, 48, 60 tháng;
- ho/sổ mũi/sốt và dấu hiệu cần đánh giá;
- an toàn nước, thuốc-hóa chất, ngã-bỏng, đường bộ;
- chăm sóc riêng bé trai/bé gái.

Các nội dung đã được tổ chức lại thành `AgeContentCenter` và `EarlyChildhoodGuide` thay vì HTML rời.

## Active / button contract

Mọi nhóm lựa chọn mới dùng:

- `role=tablist` / `role=tab`;
- `aria-selected`;
- `aria-pressed`;
- class `is-active`;
- trạng thái active có hiệu ứng nút lõm 3D (`translateY(3px)` + giảm shadow);
- keyboard focus-visible;
- responsive;
- reduced-motion.

Việc chọn một giai đoạn trong Age Content Center chỉ để **xem nội dung**, không làm thay đổi ngày sinh hoặc tuổi hồ sơ.

## Ranh giới y khoa

- Không tự chẩn đoán.
- Không tự kê thuốc/tính liều.
- Không gọi control-plane hoặc gửi dữ liệu sức khỏe sang Site Quản trị.
- Dưới 5 tuổi không được áp WHO BMI-for-age 5–19 như một chuẩn đánh giá thay thế. Chuẩn tăng trưởng 0–5 phải dùng WHO Child Growth Standards khi module tính toán tương ứng được triển khai/kiểm định.

## Nguồn nền phần 9 tháng–5 tuổi

- WHO Child Growth Standards
- WHO IMCI
- CDC developmental milestones
- CDC choking/drowning prevention
- AAP / HealthyChildren
- AAPD
- AASM child sleep duration

## Regression gate

`scripts/validate-restored-9m-content.mjs` chặn regression nếu:

- mất bất kỳ giai đoạn 9 tháng–18 tuổi nào;
- mất nội dung khôi phục 9 tháng–5 tuổi;
- mất trạng thái active/pressed/accessibility;
- age content gọi thẳng network/control-plane;
- PWA/metadata quay lại phạm vi 9–10 hoặc 9–18 thuần túy.
