# Biểu đồ xu hướng tăng trưởng 9–18 tuổi

## Mục tiêu

Phần Tăng trưởng hiển thị xu hướng theo thời gian từ dữ liệu lưu cục bộ của từng trẻ. Biểu đồ giúp người dùng nhìn chuỗi mốc thay vì diễn giải quá mức một số đo đơn lẻ.

## Ba chế độ chỉ số

1. **Chiều cao**: biểu đồ số đo thô theo cm.
2. **Cân nặng**: biểu đồ số đo thô theo kg.
3. **BMI-for-age WHO**: biểu đồ z-score được tính từ BMI, tháng tuổi tại ngày đo và giới tính bằng WHO Reference 2007 đã khóa trong repo.

Chiều cao/cân nặng hiện **không gắn percentile hay phân loại lâm sàng** vì repo chưa có bộ tham chiếu chiều cao-for-age/weight-for-age đã được kiểm chứng cho phạm vi sản phẩm. Không được suy diễn percentile từ số đo thô.

## Khoảng thời gian

Người dùng có thể chọn:

- 3 tháng
- 6 tháng
- 1 năm
- toàn bộ lịch sử

Khoảng thời gian được neo tại mốc đo mới nhất, không phụ thuộc ngày mở ứng dụng. Điều này giúp xem lịch sử cũ ổn định và không làm biến mất dữ liệu chỉ vì lâu ngày chưa đo lại.

## BMI-for-age

Biểu đồ z-score dùng cùng engine `who-bmi-reference.ts`. Các đường tham chiếu hiển thị:

- −3 SD: gầy nghiêm trọng
- −2 SD: gầy
- +1 SD: thừa cân
- +2 SD: béo phì

Các đường này là **ngưỡng tham chiếu tăng trưởng WHO**, không phải chẩn đoán bệnh. Ứng dụng không chuyển sang BMI người lớn trong phạm vi 9–18 tuổi.

Nếu thiếu ngày sinh, giới tính hoặc mốc đo nằm ngoài 9 tuổi 0 tháng đến hết 18 tuổi 11 tháng, biểu đồ BMI-for-age không đoán. Người dùng vẫn có thể xem biểu đồ chiều cao/cân nặng thô.

## An toàn giao diện

- đường nối chỉ nối các mốc đã ghi nhận, không dự đoán tương lai;
- SVG có nhãn truy cập và danh sách mốc văn bản đi kèm;
- nút chỉ số/khoảng thời gian có `aria-pressed` và trạng thái selected giữ nguyên;
- nút có raised/hover/pressed/selected/focus và hỗ trợ `prefers-reduced-motion`;
- biểu đồ không gửi dữ liệu sang Trung tâm Quản trị.
