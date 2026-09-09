# Health_Care — Sức khỏe Y tế 9–18 tuổi

Repo **độc lập** cho Web App Sức khỏe Y tế theo dõi và hỗ trợ hình thành năng lực tự chăm sóc sức khỏe từ 9 tuổi đến hết 18 tuổi 11 tháng.

## Ranh giới kiến trúc

`Health_Care` sở hữu toàn bộ runtime và nghiệp vụ Sức khỏe Y tế:

- Web App / PWA;
- Device Gate phía ứng dụng;
- Control API dành cho Application Management;
- dữ liệu và migration riêng của Health;
- tăng trưởng WHO 9–18;
- checklist, journal, reminder, calendar;
- framework theo dõi 22 miền sức khỏe;
- privacy/profile contracts và các lớp theo dõi dài hạn.

**Application Management không nằm trong repo này.** Trung tâm chỉ quản lý thiết bị, quyền truy cập, phiên, policy, Calendar permission, audit vận hành và quy trình duyệt nội dung thông qua Control API.

Không nhúng `/admin`, iframe hay shared router quản trị vào Health_Care. Hồ sơ sức khỏe cá nhân không mặc định được gửi sang Application Management.

## Control Plane hiện hành

Application Management hiện chạy trong **ChatGPT Sites**. Health_Care không còn khóa Control API vào URL `learning-management.boiech-ai.workers.dev`.

Vé quản trị chuẩn 5 phút dùng danh tính:

- issuer: `application-management`;
- audience: `health-care-control`;
- app: `health-care`.

Trong giai đoạn chuyển tiếp, Health_Care vẫn chấp nhận vé legacy `quan-ly-hoc-tap / child-health-control / child-health` để không làm đứt phiên cũ; Application Management mới không còn phát loại vé legacy này.

CORS của Control API chấp nhận origin ChatGPT Sites qua HTTPS (`*.chatgpt.site`) và localhost khi phát triển. Mọi request vẫn phải có vé HMAC hợp lệ hoặc service credential hợp lệ; CORS không thay thế xác thực.

`HEALTH_CONTROL_SERVICE_SECRET` là khóa app-scoped giữa hai Site. Đây là lớp xác thực ứng dụng, **không phải phụ thuộc Cloudflare** và không phải mật khẩu người dùng. Khi chạy bằng ChatGPT Sites, giá trị này phải được cấu hình bằng hosted secret của từng Site, không commit vào repo hay `.openai/hosting.json`.

## Runtime Health

Health_Care vẫn sở hữu runtime và D1 riêng. Các tên hạ tầng legacy hiện có (`suc-khoe-tre`, `suc-khoe-tre-db`) được giữ để không phá dữ liệu trong lúc chuyển hosting. Workflow Cloudflare hiện có chỉ thuộc đường deploy runtime legacy của Health_Care; **Application Management không còn cần một Worker Cloudflare riêng để quản trị Health**.

Khi Health_Care được phát hành hoàn toàn bằng ChatGPT Sites, endpoint production dùng cho `HEALTH_CARE_BASE_URL` phải là URL Site Health_Care đang được phê duyệt. Không hard-code URL `workers.dev` trở lại adapter quản trị.

## Điều kiện kết nối Application Management

Phía Application Management cần:

- `HEALTH_CARE_BASE_URL`: URL production của Site Health_Care;
- `HEALTH_CONTROL_SERVICE_SECRET`: cùng khóa app-scoped với Health_Care.

Phía Health_Care cần:

- `HEALTH_CONTROL_SERVICE_SECRET` cùng giá trị;
- Control API giữ ranh giới `healthDataInControlPlane=false`;
- registry thiết bị `SK-`, session, policy và audit tiếp tục thuộc Health_Care.

Không khôi phục fallback `CONTROL_SERVICE_SECRET`. Nếu khóa Health riêng chưa đồng bộ, Control Plane phải fail closed thay vì dùng secret chung.

## Chạy cục bộ

```bash
npm ci
npm run dev
```

## Gate bắt buộc

```bash
npm run validate:growth
npm run validate:framework
npm run validate:device
npm run validate:control
npm run lint
npm run build
```

Không merge `main` khi một gate chưa PASS.

## Cấu trúc chính

```text
app/        Web App, Device Gate, Control API, health engines/contracts
worker/     runtime entry hiện hành
public/     PWA assets
scripts/    build/validation gates
drizzle/    D1 migrations
docs/       architecture, audit, privacy, release checklist
```

## Nguồn migration

Repo này được tách từ `BlueDragon33/BOIECH_AI/suc-khoe-tre/`. Xem `MIGRATION_SOURCE.md`.

Repo canonical của Trung tâm hiện là `BlueDragon33/Application-Management`; `BOIECH_AI` không còn là nguồn quản trị Health_Care.
