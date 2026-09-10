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

Application Management và Health_Care đang chuyển khỏi ChatGPT Sites sang mô hình repo độc lập + Cloudflare Workers. Contract quản trị vẫn giữ danh tính ổn định:

- issuer: `application-management`;
- audience: `health-care-control`;
- app: `health-care`;
- secret app-scoped: `HEALTH_CONTROL_SERVICE_SECRET`.

Trong giai đoạn chuyển tiếp, Health_Care vẫn chấp nhận vé legacy `quan-ly-hoc-tap / child-health-control / child-health` để không làm đứt phiên cũ; Application Management mới không còn phát loại vé legacy này.

`HEALTH_CONTROL_SERVICE_SECRET` không phải mật khẩu người dùng và không được commit. Khi chạy Cloudflare, secret này được đặt bằng Cloudflare/GitHub Environment và phải khớp với phía Application Management cùng môi trường.

## Cloudflare Preview

Cloudflare Preview là đường triển khai mới được ưu tiên trước khi lên production. Preview dùng:

- Worker `health-care-preview`;
- D1 `health-care-preview-db` riêng;
- `workers.dev` được phép dùng trong giai đoạn đầu, không cần tên miền riêng;
- workflow manual-only `.github/workflows/deploy.yml`;
- không dùng D1 production hiện tại;
- không tự chạy cron auto-block trong giai đoạn bootstrap preview.

Hướng dẫn chi tiết: `docs/CLOUDFLARE_PREVIEW.md`.

Workflow preview yêu cầu GitHub Environment `health-preview` với các secret `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `HEALTH_PREVIEW_D1_DATABASE_ID`, `HEALTH_CONTROL_SERVICE_SECRET`. URL preview được lưu dưới GitHub Variables, không hard-code vào source.

## Runtime Health

Health_Care tiếp tục sở hữu runtime, registry `SK-`, session, policy, automation, audit và D1 riêng. Các tên hạ tầng cũ (`suc-khoe-tre`, `suc-khoe-tre-db`) vẫn được giữ nguyên để tránh động vào dữ liệu production trong khi migration.

Preview Cloudflare không được phép trỏ vào D1 production. Script `scripts/prepare-cloudflare-preview.mjs` chặn trực tiếp production D1 ID và chặn fallback về `*.chatgpt.site`.

## Điều kiện kết nối Application Management

Phía Application Management cần:

- `HEALTH_CARE_BASE_URL`: HTTPS origin của Health_Care trong cùng môi trường;
- `HEALTH_CONTROL_SERVICE_SECRET`: cùng khóa app-scoped với Health_Care.

Phía Health_Care cần:

- `HEALTH_CONTROL_SERVICE_SECRET` cùng giá trị;
- `APPLICATION_MANAGEMENT_ORIGIN` trỏ về HTTPS origin của Trung tâm khi đã có;
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
npm run validate:cloudflare-preview
npm run lint
npm run build
```

Không merge `main` khi một gate chưa PASS.

## Cấu trúc chính

```text
app/        Web App, Device Gate, Control API, health engines/contracts
worker/     runtime entry hiện hành
public/     PWA assets
scripts/    build/validation/deployment gates
drizzle/    D1 migrations
docs/       architecture, audit, privacy, release checklist
```

## Nguồn migration

Repo này được tách từ `BlueDragon33/BOIECH_AI/suc-khoe-tre/`. Xem `MIGRATION_SOURCE.md`.

Repo canonical của Trung tâm hiện là `BlueDragon33/Application-Management`; `BOIECH_AI` không còn là nguồn quản trị Health_Care.
