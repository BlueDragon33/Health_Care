# Attention Queue V1 · Sức khỏe Y tế 9–18 tuổi

## Mục tiêu

Trang **Hôm nay** cần giúp người dùng biết việc gì đáng chú ý mà không biến ứng dụng thành một bảng cảnh báo y khoa. V1 chỉ dùng hai nguồn an toàn đã có trong runtime:

1. reminder do chính người dùng tạo và sắp đến hạn trong 24 giờ;
2. dữ liệu nền còn thiếu để các chức năng hiện tại hoạt động đầy đủ.

## Không làm trong V1

- không tự chẩn đoán;
- không sinh cảnh báo `urgent`;
- không suy diễn nguy cơ từ triệu chứng;
- không tạo overall health score;
- không coi ngày trống/ít dữ liệu là sức khỏe xấu;
- không áp guideline khám/tiêm chủng khi chưa có jurisdiction + evidence version + rule test;
- không đưa nội dung sức khỏe sang Site Quản trị.

## Data Completeness

V1 kiểm tra 4 dữ liệu nền:

- tên hồ sơ;
- ngày sinh;
- giới tính dùng cho biểu đồ WHO;
- ít nhất một mốc tăng trưởng.

Hiển thị `x/4` chỉ là **mức hoàn thiện dữ liệu**, không phải điểm sức khỏe.

## Due Engine

Reminder đang bật được xét bằng recurrence engine hiện tại. Chỉ reminder có lần tiếp theo trong 24 giờ được đưa vào `due`.

`HealthDueItem.source = user-plan` và `HealthAttentionItem.source = user-reminder` để không nhầm với guideline hay clinician-directed task.

## Giới hạn chống alert fatigue

Attention Queue chỉ hiển thị tối đa 5 mục chính trên Hôm nay (`maxPrimaryItemsOnToday = 5`). Due items đứng trước data gaps. Không sử dụng màu/copy khẩn cấp cho dữ liệu vận hành.

## Điều hướng

- gap liên quan tăng trưởng → Tăng trưởng;
- hồ sơ/reminder → Hồ sơ;
- không mở trực tiếp dữ liệu nhạy cảm khác trong V1.

## Mở rộng sau

Các nguồn `trend`, `episode`, `care-plan`, `guideline`, `urgent` chỉ được nối vào khi engine tương ứng đã có:

- profile isolation/multi-child runtime;
- evidence + rule version;
- jurisdiction khi cần;
- privacy filtering;
- unit/integration test;
- hành động follow-up rõ ràng.
