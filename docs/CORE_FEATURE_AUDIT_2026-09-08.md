# Core Feature Audit — 2026-09-08

Phạm vi: 6 yêu cầu chức năng đã chốt cho Sức khỏe Y tế 9–18 tuổi.

## Kết quả

1. **Nút 3D / trạng thái chọn** — được bảo vệ bởi validator UI/reminder hiện có; không thay đổi trong lượt này.
2. **Dinh dưỡng theo nhóm tuổi + checklist + nhật ký** — nâng từ khung chung thành 4 chế độ 9–10, 11–12, 13–15, 16–18 tuổi. Checklist mới phản ánh dữ liệu đã ghi, không tự kết luận đủ/thiếu dinh dưỡng. Nhật ký bữa ăn và nhật ký sức khỏe tiếp tục local-first.
3. **Nhắc dinh dưỡng/chăm sóc sức khỏe** — đã có category `nutrition`, `water`, `care`, cùng các nhóm sức khỏe khác.
4. **Nhắc lặp + thông báo trình duyệt** — hỗ trợ một lần, hằng ngày, thứ 2–6, hằng tuần, ngày tự chọn và hằng tháng. Notification API chỉ chạy khi Web App còn hoạt động; UI phải nói rõ giới hạn này.
5. **Lịch `.ics`** — xuất từng nhắc hoặc toàn bộ lịch đang bật, có RRULE cho các kiểu lặp.
6. **Google Calendar theo quyền thiết bị** — client chỉ mở khi `calendarEnabled=true`; quyền này do Control API cập nhật cho thiết bị đã `approved`, và chỉ role `publisher/owner` được thay đổi.

## Ranh giới dinh dưỡng

Module theo tuổi không đặt mục tiêu giảm cân, calorie hoặc hình thể người lớn cho trẻ/vị thành niên. Các dấu hoàn thành trong checklist chỉ cho biết người dùng đã ghi dữ liệu tương ứng trong ngày.

Nền tảng nội dung dùng nguyên tắc của WHO Healthy diet, cập nhật ngày 26/01/2026: adequacy, balance, moderation, diversity và food safety; đồng thời WHO lưu ý tuổi vị thành niên là giai đoạn tăng trưởng quan trọng và thói quen ăn uống hình thành trong giai đoạn này có ảnh hưởng lâu dài.

Nguồn tham chiếu:
- WHO — Healthy diet, 26 January 2026: https://www.who.int/news-room/fact-sheets/detail/healthy-diet
- WHO — Adolescent health: https://www.who.int/health-topics/adolescent-health
- WHO — AA-HA! adolescent nutrition section: https://www.who.int/initiatives/global-accelerated-action-for-the-health-of-adolescent/aa-ha%21-guidance-2d-edition/chapter-3/section-3-12

## Regression gate

`scripts/validate-age-nutrition-reminder-audit.mjs` bắt buộc đồng thời các contract:
- 4 nhóm tuổi dinh dưỡng;
- checklist + nhật ký;
- reminder nutrition/care;
- daily/weekly recurrence + Notification API;
- `.ics` + RRULE;
- Calendar client gate + server-side control gate.

Gate này được nối vào `npm run validate:framework`, vì vậy CI/build sẽ chặn nếu một trong 6 nhóm chức năng bị gỡ hoặc quay lại thiết kế không đúng.
