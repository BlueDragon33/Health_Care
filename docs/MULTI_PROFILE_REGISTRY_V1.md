# Multi-child Profile Registry V1 · Health_Care 9–18

## Mục tiêu

Một thiết bị có thể quản lý nhiều con mà không trộn timeline, tăng trưởng, reminder, nhật ký hoặc backup giữa các hồ sơ.

## Storage

Registry:

`Sức khỏe Y tế profiles v1` → `suc-khoe-y-te:profiles:v1`

Mỗi hồ sơ có state riêng:

`Sức khỏe Y tế profile state v1` → `suc-khoe-y-te:profile-state:v1:<profileId>`

Migration marker:

`Sức khỏe Y tế profiles migration v1` → `suc-khoe-y-te:profiles:migration:v1`

## Migration single-profile → multi-profile

Lần đầu bản V1 chạy:

1. đọc state 9–18 hiện có qua `loadHealthState()`;
2. tạo một `profileId` mới;
3. sao chép state hiện có sang profile-scoped key;
4. tạo registry và chọn hồ sơ đó làm active;
5. ghi migration envelope với `legacyStorageKeyPreserved: true`;
6. không xóa key 9–18 hoặc 9–10 cũ.

Như vậy có thể rollback và dữ liệu cũ không bị phá hủy.

## Active profile

`HealthFramework` không còn đọc/ghi global single-profile state trong hoạt động bình thường. Mọi save sau hydration đi qua:

`saveHealthProfileState(activeProfileId, state)`

Khi chuyển hồ sơ:

- state hiện tại được lưu vào key của hồ sơ hiện tại;
- registry đổi `activeProfileId`;
- state của hồ sơ mới được đọc từ key riêng;
- ngày đang xem được đưa về hôm nay để tránh nhầm ngữ cảnh giữa hai con.

## Tạo/xóa

- tối đa 12 hồ sơ local trong V1;
- tên mới có thể đổi tiếp trong Hồ sơ;
- không cho xóa hồ sơ cuối cùng;
- xóa yêu cầu `window.confirm` rõ ràng;
- chỉ xóa state key của đúng profile được chọn.

## Backup

Backup JSON hiện tại vẫn là backup **một HealthLocalState**. Trong Multi-profile V1:

- Export mặc định chỉ xuất hồ sơ đang chọn;
- filename có tên hồ sơ;
- Import chỉ thay state của hồ sơ đang chọn;
- không ghi đè registry và không ảnh hưởng hồ sơ khác;
- backup 9–10 legacy vẫn đọc được.

Bản backup toàn gia đình nếu được bổ sung sau phải là format/envelope khác và yêu cầu thao tác rõ ràng.

## Attention Queue / reminder

Attention Queue nhận `activeProfileId`; due item và data gap mang đúng profile ID hiện tại. Reminder nằm trong state riêng của hồ sơ, do đó chuyển con không trộn lịch nhắc.

## Ranh giới hiện tại

V1 đảm bảo isolation ở cấp **profile-scoped HealthLocalState/storage key**. Các record con bên trong `HealthLocalState` như GrowthEntry/Reminder/DailyRecord chưa nhúng `profileId` riêng vào từng object.

Đây là quyết định chuyển đổi có chủ đích để giữ tương thích backup và giảm rủi ro migration. Khi nâng sang record-level schema, phải:

- thêm `profileId` vào từng health record;
- migrate không phá hủy;
- giữ đọc backup cũ;
- test record ID/profile ID mismatch;
- không dựa duy nhất vào UI active-profile để quyết định ownership.

## Privacy

Profile Registry là dữ liệu Health local. Trung tâm Quản trị chỉ cấp quyền thiết bị/app và không nhận danh sách tên trẻ hoặc nội dung các profile.
