# Reminder Engine V2 · Sức khỏe Y tế 9–18 tuổi

## Mục tiêu

Reminder Engine V2 là lớp nhắc việc local-first dùng chung cho hành trình 9–18 tuổi. Nó không thay thế lịch hệ điều hành và không giả định trình duyệt có thể đánh thức Web App khi đã đóng.

## Kiểu lặp được hỗ trợ

- Một lần (`once`)
- Hằng ngày (`daily`)
- Thứ 2–6 (`weekdays`) — giữ tương thích reminder cũ
- Hằng tuần theo thứ của ngày bắt đầu (`weekly`)
- Theo các thứ người dùng chọn (`selected-weekdays`)
- Hằng tháng theo ngày trong tháng của ngày bắt đầu (`monthly`)

Với lịch hằng tháng, nếu một tháng không có ngày tương ứng (ví dụ ngày 31), lần đó được bỏ qua thay vì tự dời sang ngày cuối tháng. Điều này khớp với RRULE `BYMONTHDAY` được xuất ra `.ics`.

## Dữ liệu

`Reminder` vẫn nằm trong `HealthLocalState` và backup JSON hiện tại. Trường mới `weekdays?: number[]` chỉ dùng cho `selected-weekdays`; dữ liệu reminder cũ tiếp tục được normalize mà không cần migration phá hủy.

## Giao diện tập trung

`ReminderManager` thay phần form/list reminder cũ và cung cấp:

- tổng số lịch đang bật/tắt/còn lần sắp tới;
- tìm kiếm;
- lọc đang bật/đang tắt;
- tạo lịch theo ngày chọn hoặc theo tháng;
- bật/tắt/xóa từng reminder;
- xuất `.ics` từng reminder;
- xuất một tệp `.ics` chứa toàn bộ reminder đang bật;
- mở Google Calendar cho từng reminder khi thiết bị được cấp quyền.

Các nút chọn ngày và bộ lọc giữ trạng thái 3D, có `aria-pressed`, focus-visible, touch-friendly và `prefers-reduced-motion`.

## Ranh giới Google Calendar

`calendarEnabled` vẫn do Device Gate nhận từ Control Plane. Reminder Manager không có cơ chế tự mở khóa. Khi chưa được cấp quyền:

- nút Google Calendar bị disabled;
- `.ics` vẫn dùng được;
- dữ liệu reminder không được gửi về Trung tâm Quản trị.

Nếu sau này tích hợp OAuth Google thật, quyền thiết bị này vẫn phải tồn tại độc lập với consent/OAuth của tài khoản Google.

## Thông báo trình duyệt

Browser Notification chỉ được kiểm tra khi Web App còn hoạt động. Không mô tả nó như một scheduler nền đáng tin cậy. Để nhắc khi app đóng, người dùng cần `.ics` hoặc hệ thống Calendar của thiết bị/tài khoản.

## Metadata đã sửa

Các tệp `.ics` và Google Calendar đều dùng nhãn **Sức khỏe Y tế 9–18 tuổi**, không còn metadata 9–10 cũ.

## Gate

`validate:framework` chạy thêm `scripts/validate-reminder-engine.mjs` để khóa:

- schema recurrence;
- normalize reminder cũ/mới;
- selected weekdays + monthly RRULE;
- bulk `.ics`;
- Google Calendar device gate;
- không tồn tại Reminder UI cũ song song;
- CSS 3D/accessibility/responsive;
- không còn metadata 9–10 trong calendar engine.
