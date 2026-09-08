# Dòng thời gian sức khỏe 9–18 tuổi

## Mục tiêu

Dòng thời gian gom các dữ liệu đã được ghi trên thiết bị thành một luồng lịch sử chung để người dùng nhìn lại diễn biến theo thời gian mà không phải mở từng module riêng lẻ.

Dòng thời gian nằm trong khu vực **Nhật ký**, không tạo thêm top-level navigation và không thay đổi kiến trúc 7 khu vực chính của Web App.

## Loại sự kiện

- Tăng trưởng: chiều cao và cân nặng đã lưu.
- Triệu chứng: các triệu chứng người dùng đã đánh dấu.
- Nhật ký: cảm nhận và ghi chú tự do.
- Chăm sóc: giờ ngủ/thức, đánh răng, nghỉ mắt và vệ sinh/tự chăm sóc.
- Vận động: số phút và loại hoạt động đã ghi.
- Dinh dưỡng: nhóm thực phẩm, bữa ăn và nước đã ghi.

## Bộ lọc

- loại sự kiện: tất cả hoặc từng nhóm;
- khoảng thời gian: 30 ngày, 90 ngày, toàn bộ;
- mốc kết thúc là ngày đang được chọn trong Nhật ký;
- tối đa 120 sự kiện mới nhất được render cùng lúc để giữ giao diện nhẹ.

## Ranh giới an toàn

Dòng thời gian là bản tổng hợp dữ liệu đã nhập, không phải hệ thống chẩn đoán.

- Không tạo điểm sức khỏe tổng.
- Ngày không có dữ liệu không được hiểu là sức khỏe xấu hoặc không tuân thủ.
- Triệu chứng không được tự chuyển thành tên bệnh hay nguyên nhân.
- Vận động không được quy đổi thành calo hay điểm thể lực.
- Dinh dưỡng không tính calo/chấm điểm món ăn.
- Không tự áp ngưỡng lâm sàng mới trong timeline.

Các đánh giá tăng trưởng chuyên môn vẫn thuộc engine WHO BMI-for-age đã được kiểm định riêng; timeline chỉ hiển thị số đo thô để tránh nhân đôi logic phân loại.

## Quyền riêng tư

Timeline được dựng từ `HealthLocalState` trong Web App. Nội dung timeline không gửi sang Trung tâm Quản trị. Control Plane vẫn chỉ nhận metadata vận hành theo contract đã khóa.

## Truy cập và giao diện

- Bộ lọc dùng `aria-pressed`.
- Nút có trạng thái selected giữ rõ ràng, hiệu ứng nổi/lõm và focus-visible.
- Có breakpoint mobile.
- Tôn trọng `prefers-reduced-motion`.
