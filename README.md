# Health_Care — Sức khỏe Y tế 9–18 tuổi

Repo **độc lập** cho Web App Sức khỏe Y tế theo dõi và hỗ trợ hình thành năng lực tự chăm sóc sức khỏe từ 9 tuổi đến hết 18 tuổi 11 tháng.

## Ranh giới kiến trúc

`Health_Care` sở hữu toàn bộ runtime và nghiệp vụ Sức khỏe Y tế:

- Web App / PWA;
- Device Gate phía ứng dụng;
- Control API dành cho Trung tâm Quản trị;
- dữ liệu và migration riêng của Health;
- tăng trưởng WHO 9–18;
- checklist, journal, reminder, calendar;
- framework theo dõi 22 miền sức khỏe;
- privacy/profile contracts và các lớp theo dõi dài hạn.

**Trung tâm Quản trị không nằm trong repo này.** Trung tâm chỉ quản lý thiết bị, quyền truy cập, phiên, policy, Calendar permission, audit vận hành và quy trình duyệt nội dung thông qua Control API.

Không nhúng `/admin`, iframe hay shared router quản trị vào Health_Care. Hồ sơ sức khỏe cá nhân không mặc định được gửi sang Trung tâm Quản trị.

## Hạ tầng hiện hành

- Worker production: `suc-khoe-tre`
- D1 production: `suc-khoe-tre-db`
- Control audience: `child-health-control`
- Worker URL hiện hành được Trung tâm Quản trị sử dụng: `https://suc-khoe-tre.boiech-ai.workers.dev`

Tên Worker/URL được giữ ổn định trong giai đoạn tách repo để không làm đứt kết nối Control Plane. Repo và runtime nghiệp vụ đã tách biệt; đổi domain/worker name là một migration độc lập sau này nếu cần.

## Điều kiện deploy production

Workflow deploy **fail closed** nếu thiếu Cloudflare credentials; trạng thái `success` không được phép xuất hiện khi Worker thực tế chưa được cập nhật.

Trước khi deploy production cần cấu hình:

- GitHub Actions secret `CLOUDFLARE_API_TOKEN` cho repo `Health_Care`;
- GitHub Actions secret `CLOUDFLARE_ACCOUNT_ID` cho repo `Health_Care`;
- Cloudflare Worker secret `HEALTH_CONTROL_SERVICE_SECRET` cho Worker Health;
- cùng secret Health-scoped tương ứng ở Trung tâm Quản trị để phát/kiểm tra vé Control Plane.

Không khôi phục fallback `CONTROL_SERVICE_SECRET`. Nếu secret Health riêng chưa đồng bộ, Control Plane phải báo chưa sẵn sàng thay vì âm thầm dùng secret chung.

Sau deploy, `/api/control/status` phải công bố canonical app `suc-khoe-y-te`, capability `device-review-v1`, `app-scoped-secret-v1`, build revision mới và ranh giới `healthDataInControlPlane=false` trước khi coi kết nối production là hoàn tất.

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
worker/     Cloudflare Worker entry
public/     PWA assets
scripts/    build/validation gates
drizzle/    D1 migrations
docs/       architecture, audit, privacy, release checklist
```

## Nguồn migration

Repo này được tách từ `BlueDragon33/BOIECH_AI/suc-khoe-tre/`. Xem `MIGRATION_SOURCE.md`.

Sau khi migration được xác minh, `BOIECH_AI` chỉ còn giữ **Trung tâm Quản trị/bridge** cần thiết để điều khiển Health_Care từ xa; mã nguồn nghiệp vụ Health không còn được duy trì ở repo đó.
