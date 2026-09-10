# Health_Care · Cloudflare Preview

## Mục tiêu

`Health_Care` tiếp tục là repo/runtime độc lập. Cloudflare Preview chỉ thay lớp hosting; `Application-Management` vẫn quản trị từ xa qua Control API của Health_Care và không sở hữu database Health.

Giai đoạn preview tuyệt đối không dùng D1 production hiện tại. Workflow chỉ chạy thủ công và chưa tự deploy khi push `main`.

## Hạ tầng preview

Tạo trong cùng tài khoản Cloudflare:

- Worker preview: `health-care-preview`;
- D1 preview: `health-care-preview-db`;
- Images binding: `IMAGES`;
- Static Assets binding: `ASSETS` do Cloudflare Vite plugin đóng gói;
- `workers.dev` có thể dùng làm URL trong giai đoạn đầu, không cần tên miền riêng.

Không copy dữ liệu sức khỏe production vào preview. Chỉ dùng dữ liệu tổng hợp/synthetic khi test.

## GitHub Environment

Tạo GitHub Environment tên `health-preview`, sau đó khai báo secrets:

- `CLOUDFLARE_API_TOKEN`: token chỉ có quyền tối thiểu cần để deploy Worker, cập nhật secret và D1 preview;
- `CLOUDFLARE_ACCOUNT_ID`;
- `HEALTH_PREVIEW_D1_DATABASE_ID`: ID của `health-care-preview-db`, bắt buộc khác D1 production;
- `HEALTH_CONTROL_SERVICE_SECRET`: khóa app-scoped dùng chung với Application Management preview, tối thiểu 32 ký tự.

Variables tùy chọn:

- `APPLICATION_MANAGEMENT_PREVIEW_ORIGIN`: HTTPS origin của Application Management preview. Có thể để trống ở lần deploy Health đầu tiên;
- `HEALTH_PREVIEW_ORIGIN`: URL Worker Health preview. Sau lần deploy đầu, điền biến này để workflow smoke-test `/api/control/contract` ở các lần sau.

Không lưu các giá trị secret trong repo, issue, PR body hoặc file `.env` được commit.

## Quy trình bootstrap không vòng lặp

1. Tạo D1 `health-care-preview-db` và GitHub Environment/secrets.
2. Chạy workflow `Health Cloudflare Preview Deploy`, nhập chính xác `DEPLOY_PREVIEW`.
3. Ghi nhận URL `*.workers.dev` của Health preview và đặt thành GitHub variable `HEALTH_PREVIEW_ORIGIN`.
4. Dùng URL đó làm `HEALTH_CARE_BASE_URL` khi triển khai Application Management preview.
5. Sau khi Application Management preview có URL, đặt URL đó vào `APPLICATION_MANAGEMENT_PREVIEW_ORIGIN` của Health_Care.
6. Chạy lại workflow Health preview để cố định hai chiều origin/Control Plane.
7. Kiểm tra thiết bị `SK-`: đăng ký → pending → duyệt → session → khóa → session bị thu hồi.
8. Chỉ sau khi preview pass mới chuẩn bị production Cloudflare.

## Cơ chế workflow

Workflow `.github/workflows/deploy.yml`:

- manual-only;
- kiểm tra đầy đủ CI/contract/lint trước deploy;
- materialize `wrangler.cloudflare.preview.jsonc` từ template và GitHub secrets/variables;
- từ chối D1 production;
- apply migration chỉ vào `health-care-preview-db`;
- build bằng `CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH`;
- kiểm tra output `dist/wrangler.json` và `.wrangler/deploy/config.json`;
- deploy bằng Wrangler output config do Cloudflare Vite plugin tạo;
- cài/rotate `HEALTH_CONTROL_SERVICE_SECRET` sau deploy;
- smoke test contract nếu `HEALTH_PREVIEW_ORIGIN` đã được cấu hình.

## Scheduled automation

Preview config hiện không khai báo cron. Đây là chủ đích để tránh auto-block chạy ngoài ý muốn trong giai đoạn bootstrap. Scheduled handler vẫn nằm trong `worker/index.ts`.

Sau khi E2E preview với dữ liệu synthetic đạt, tạo config production riêng và bật cron hàng giờ ở production. Không dùng refresh của Application Management để kích hoạt automation.

## Gate trước production

Không chuyển production khi chưa chứng minh đủ:

- Worker preview chạy được bằng Cloudflare Vite output;
- D1 preview migration pass;
- contract `health-care` đúng capability;
- `HEALTH_CONTROL_SERVICE_SECRET` hai phía khớp;
- Application Management đọc được devices/policy/automation;
- duyệt/khóa thiết bị có read-back;
- web launch một lần hoạt động;
- không có dữ liệu sức khỏe cá nhân trong control-plane;
- scheduled auto-block được kiểm thử bằng dữ liệu synthetic trước khi bật production cron.
