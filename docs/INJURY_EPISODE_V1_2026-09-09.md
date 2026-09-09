# Injury / Sports / Musculoskeletal Episode V1

Ngày: 2026-09-09

## Mục tiêu

Đưa miền `injury-sports-musculoskeletal` từ framework-only sang luồng vận hành thực tế nhưng vẫn giữ đúng ranh giới của Sức khỏe Y tế: dữ liệu thuộc hồ sơ Health_Care, lưu trong Secure Vault của thiết bị, không gửi sang Application Management và không biến Web App thành công cụ tự chẩn đoán hoặc tự cấp phép thể thao.

## Luồng dữ liệu

- Mỗi chấn thương là một `injury-episode-v1` độc lập.
- Có thời điểm xảy ra, hoạt động, vùng cơ thể, cơ chế, triệu chứng/hạn chế chức năng, mức đau người dùng tự ghi 0–10, hành động đã thực hiện và diễn biến/kết quả.
- Episode có trạng thái `open`, `monitoring`, `resolved`, `referred` để theo dõi từ khởi phát đến kết thúc.
- Có ngày theo dõi/tái khám, nguồn thông tin và ghi chú nguồn.
- Có cờ va đập đầu, dừng hoạt động, đã tìm trợ giúp y tế và xác nhận trở lại hoạt động của nhân viên y tế nếu thực sự có nguồn.
- Người dùng có thể tạo, cập nhật và xóa episode; cập nhật giữ nguyên `recordId` và `createdAt`.

## Privacy & security

- Domain dùng `useSensitiveVaultDomain("injury-sports-musculoskeletal")`.
- Plaintext episode không đi vào `localStorage`, `sessionStorage` hoặc baseline `HealthLocalState`.
- Persistence duy nhất là AES-GCM Secure Vault/IndexedDB hiện có của từng hồ sơ.
- Không gọi network để gửi dữ liệu chấn thương.
- Site Quản trị không nhận episode, triệu chứng, mức đau hoặc outcome.

## Clinical safety boundary

Module chỉ ghi nhận sự kiện và nội dung người dùng/nguồn y tế cung cấp. Không có:

- tự chẩn đoán chấn thương;
- tự kê thuốc hoặc tính liều;
- `riskScore`/`emergencyScore`;
- thuật toán tự kết luận gãy xương/chấn động;
- thuật toán tự cho phép quay lại thi đấu;
- suy diễn từ mức đau sang mức độ tổn thương.

### Va đập đầu / nghi chấn động

CDC HEADS UP nêu rằng vận động viên có dấu hiệu hoặc triệu chứng nghi chấn động sau va đập cần được đưa ra khỏi hoạt động ngay, không trở lại thể thao trong ngày chấn thương và chỉ trở lại khi được nhân viên y tế cho phép. CDC cũng liệt kê các dấu hiệu nguy hiểm sau va đập đầu cần cấp cứu ngay, gồm co giật, khó đánh thức, nôn lặp lại, lú lẫn tăng, nói khó/yếu/tê, đau đầu tăng không hết hoặc bất thường đồng tử/nhìn đôi.

Nguồn:
- https://www.cdc.gov/heads-up/response/index.html
- https://www.cdc.gov/heads-up/signs-symptoms/index.html
- https://www.cdc.gov/heads-up/guidelines/index.html

### Chấn thương chi / cơ xương khớp

NHS khuyến nghị tìm trợ giúp khẩn cấp khi chấn thương rất đau hoặc tăng đau, sưng/bầm nhiều hoặc tăng, khó chịu lực/đi lại hoặc khó vận động; cần cấp cứu khi phần cơ thể biến dạng, tê/châm chích, lạnh hoặc đổi màu. Hướng dẫn NHS cho trẻ cũng coi việc không thể sử dụng tay/chân sau chấn thương là lý do cần đánh giá khẩn cấp.

Nguồn:
- https://www.nhs.uk/conditions/sprains-and-strains/
- https://www.nhs.uk/baby/first-aid-and-safety/first-aid/what-to-do-if-your-child-has-an-accident/

## UI

- Form 4 cột trên màn hình lớn, giảm còn 2 và 1 cột theo breakpoint.
- Nút lưu có hiệu ứng nhấn/lõm 3D; nút chỉnh sửa/xóa có trạng thái rõ ràng.
- Có `:focus-visible` và `prefers-reduced-motion`.
- Safety cards luôn đứng trước form episode khi vault đã mở.
- Dữ liệu cũ/chưa có episode hiển thị empty state, không tạo bản ghi giả.

## Maturity

Sau V1, `injury-sports-musculoskeletal` được đánh dấu `operational` vì đã có luồng nhập → mã hóa/lưu → xem → cập nhật diễn biến/kết thúc → xóa, provenance và guardrail return-to-activity. Điều này không có nghĩa ứng dụng đã trở thành hệ thống đánh giá chấn thương lâm sàng.
