# Symptoms, Illness & Episode Tracking V1

## Mục tiêu

Chuyển việc ghi triệu chứng từ các check-in ngày rời rạc sang mô hình episode có vòng đời rõ ràng:

- bắt đầu;
- triệu chứng và bối cảnh;
- diễn biến theo từng mốc;
- chăm sóc/tư vấn đã nhận;
- kết thúc khi người dùng có thông tin.

## Ranh giới dữ liệu

Domain chuẩn: `symptoms-illness-first-aid`.

Episode V1 dùng:

- Profile Privacy;
- viewer role hiện hành;
- active-profile Secure Vault;
- Vault encrypted backup.

Không ghi episode vào:

- `HealthLocalState`;
- `DailyRecord`;
- baseline JSON backup;
- Health Timeline plaintext;
- Control Plane / Site Quản trị;
- network API khác.

Các chip `DailyRecord.symptoms` cũ được giữ nguyên để tương thích. Hệ thống **không tự ghép** chúng thành episode vì dữ liệu cũ không có đủ thông tin để xác định onset/end hay quan hệ giữa các triệu chứng.

## Episode

Mỗi episode lưu:

- tên ngắn;
- ngày/giờ bắt đầu nếu biết;
- trạng thái do người ghi mô tả;
- mức độ do người ghi mô tả;
- danh sách triệu chứng;
- bối cảnh;
- nhiệt độ nếu đã đo, giữ nguyên text + đơn vị;
- chăm sóc/tư vấn đã nhận;
- provenance/source note;
- ngày kết thúc nếu đã rõ;
- tóm tắt.

## Diễn biến

Một episode có thể có nhiều update độc lập:

- ngày/giờ;
- trạng thái;
- mức độ mô tả;
- triệu chứng tại mốc;
- ghi chú diễn biến;
- nhiệt độ nếu đã đo;
- chăm sóc/tư vấn đã nhận;
- provenance.

## Clinical guardrails

V1 không có:

- diagnosis engine;
- triage engine;
- red-flag engine;
- risk score;
- kê đơn;
- dose calculation;
- recommendation điều trị;
- tự suy tình trạng nguy hiểm từ dữ liệu người dùng nhập.

Các rule y khoa chỉ được bật trong phase sau khi có source, version, effective date, phạm vi tuổi, jurisdiction/context và test riêng.

## Xóa dữ liệu

Xóa một episode không tự cascade các update để tránh mất dữ liệu ngoài ý muốn. Nếu cần cascade trong tương lai phải có UI xác nhận rõ và test referential integrity.

## UI

- episode list có nút 3D, trạng thái selected và `aria-pressed`;
- focus-visible;
- responsive desktop/tablet/phone;
- `prefers-reduced-motion`;
- mọi dữ liệu episode chỉ hiện sau privacy + Vault gate.
