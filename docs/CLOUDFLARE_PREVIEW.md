# Health_Care · Cloudflare Preview

## Mục tiêu

`Health_Care` tiếp tục là repo/runtime độc lập. Cloudflare Preview chỉ thay lớp hosting; `Application-Management` vẫn quản trị từ xa qua Control API của Health_Care và không sở hữu database Health.

Giai đoạn preview tuyệt đối không dùng D1 production hiện tại. Workflow chỉ chạy thủ công và chưa tự deploy khi push `main`.

## Ba identity D1 phải tách tuyệt đối

Health dùng ba identity khác nhau:

- local Miniflare: `health-care-local-db`, UUID local-only `00000000-0000-0000-0000-000000000004`;
- preview Cloudflare: `health-care-preview-db`, ID lấy từ `HEALTH_PREVIEW_D1_DATABASE_ID`;
- production: D1 production hiện hữu, ID chỉ được truyền vào workflow qua guard secret `HEALTH_PRODUCTION_D1_DATABASE_ID`.

Preview materializer và generated-artifact validator đều fail nếu preview trùng local hoặc trùng production. Không hard-code production D1 ID trong Vite, workflow hoặc preview materializer.

## Hạ tầng preview

Tạo trong cùng tài khoản Cloudflare:

- Worker preview: `health-care-preview`;
- D1 preview: `health-care-preview-db`;
- Images binding: `IMAGES`;
- Static Assets binding: `ASSETS` do Cloudflare Vite plugin đóng gói;
- `workers.dev` có thể dùng làm URL trong giai đoạn đầu, không cần tên miền riêng.

Không copy dữ liệu sức khỏe production vào preview. Chỉ dùng dữ liệu tổng hợp/synthetic khi test.

## GitHub Environment

Tạo GitHub Environment tên `health-preview`, sau đó khai báo secrets bắt buộc:

- `CLOUDFLARE_API_TOKEN`: token chỉ có quyền tối thiểu cần để deploy Worker, cập nhật secret và D1 preview;
- `CLOUDFLARE_ACCOUNT_ID`;
- `HEALTH_PREVIEW_D1_DATABASE_ID`: ID của `health-care-preview-db`, bắt buộc khác local và production;
- `HEALTH_CONTROL_SERVICE_SECRET`: khóa app-scoped dùng chung với Application Management preview, tối thiểu 32 ký tự.

Guard secret khuyến nghị mạnh:

- `HEALTH_PRODUCTION_D1_DATABASE_ID`: chỉ dùng để fail-closed nếu ai đó vô tình đưa ID production vào preview. Secret này không được materialize vào Worker.

Variables:

- `APPLICATION_MANAGEMENT_PREVIEW_ORIGIN`: HTTPS origin của Application Management preview. Có thể để trống ở pha bootstrap đầu tiên;
- `HEALTH_PREVIEW_ORIGIN`: URL Worker Health preview. Sau lần deploy đầu, điền biến này để workflow smoke-test `/api/control/contract` ở các lần sau.

Không lưu các giá trị secret trong repo, issue, PR body hoặc file `.env` được commit.

## Bootstrap hai pha, không tạo vòng phụ thuộc

Không cố cấu hình hai origin khi chưa bên nào tồn tại. Dùng thứ tự sau:

### Pha 1 · dựng endpoint

1. Tạo D1 `application-management-preview-db`, D1 `health-care-preview-db` và các GitHub Environment tương ứng.
2. Deploy Application Management preview lần đầu với `HEALTH_CARE_PREVIEW_ORIGIN` để trống. Control-plane phải tự đứng được và fail-closed cho Health bridge chưa cấu hình.
3. Ghi nhận `APPLICATION_MANAGEMENT_PREVIEW_ORIGIN` sau khi Cloudflare Access và `/__deployment` read-back đã pass.
4. Đặt origin đó vào Environment `health-preview`.
5. Deploy Health preview lần đầu; Health nhận đúng Application Management origin ngay từ lần đầu có kết nối Control Plane.
6. Ghi nhận `HEALTH_PREVIEW_ORIGIN` từ Worker vừa deploy và smoke-test contract.

### Pha 2 · đóng vòng kết nối

7. Đặt `HEALTH_CARE_PREVIEW_ORIGIN=HEALTH_PREVIEW_ORIGIN` vào Environment `application-management-preview` và bảo đảm `HEALTH_CONTROL_SERVICE_SECRET` hai phía là cùng secret app-scoped.
8. Redeploy Application Management preview bằng workflow manual-only.
9. Nếu origin Application Management thay đổi, cập nhật lại `APPLICATION_MANAGEMENT_PREVIEW_ORIGIN` ở Health và redeploy Health một lần nữa.
10. Live-probe từ Trung tâm: contract/status → registry SK- → approve/block idempotent command → read-back → session revoke.

Các client Bơi ếch, RU_LIFE và Bauman làm tương tự: dựng preview client độc lập, sau đó redeploy Application Management với các origin preview thật. Không dùng `*.chatgpt.site` làm fallback để khép vòng.

## Cơ chế workflow

Workflow `.github/workflows/deploy.yml`:

- manual-only và yêu cầu nhập chính xác `DEPLOY_PREVIEW`;
- kiểm tra đầy đủ CI/contract/lint trước deploy;
- materialize `wrangler.cloudflare.preview.jsonc` từ template và GitHub secrets/variables;
- từ chối D1 local và D1 production;
- apply migration chỉ vào `health-care-preview-db`;
- chỉ inject `CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH=wrangler.cloudflare.preview.jsonc` tại bước build, sau khi config đã được materialize;
- đọc `.wrangler/deploy/config.json` như redirect, follow `configPath` tới generated Wrangler config thật;
- kiểm Worker name, D1 ID/name, deployment channel, revision, ASSETS và IMAGES bindings trên generated config;
- deploy bằng Wrangler output config do Cloudflare Vite plugin tạo;
- cài/rotate `HEALTH_CONTROL_SERVICE_SECRET` sau deploy;
- smoke test contract nếu `HEALTH_PREVIEW_ORIGIN` đã được cấu hình.

## Scheduled automation

Preview config hiện không khai báo cron. Đây là chủ đích để tránh auto-block chạy ngoài ý muốn trong giai đoạn bootstrap. Scheduled handler vẫn nằm trong `worker/index.ts`.

Sau khi E2E preview với dữ liệu synthetic đạt, tạo config production riêng và bật cron hàng giờ ở production. Không dùng refresh của Application Management để kích hoạt automation.

## Gate trước production

Không chuyển production khi chưa chứng minh đủ:

- Worker preview chạy được bằng Cloudflare Vite output;
- D1 preview migration pass và không trùng local/production identity;
- generated artifact validator pass;
- contract `health-care` đúng capability;
- `HEALTH_CONTROL_SERVICE_SECRET` hai phía khớp;
- Application Management đọc được devices/policy/automation;
- duyệt/khóa thiết bị có idempotent command + read-back;
- web launch một lần hoạt động;
- không có dữ liệu sức khỏe cá nhân trong control-plane;
- scheduled auto-block được kiểm thử bằng dữ liệu synthetic trước khi bật production cron.
