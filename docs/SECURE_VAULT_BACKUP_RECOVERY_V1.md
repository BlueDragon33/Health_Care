# Secure Vault Backup & Recovery V1

## Mục tiêu

Cho phép người dùng chủ động sao lưu và khôi phục dữ liệu nằm trong Secure Health Vault mà không tạo bản plaintext và không gửi dữ liệu y tế sang Site Quản trị.

## Ranh giới

- Local-only trong trình duyệt.
- Không gọi Control Plane.
- Không tự upload cloud.
- Không đưa PIN, khóa dẫn xuất, nội dung bản ghi hoặc ciphertext vào Admin audit/heartbeat.
- Không merge/ghi đè Vault đã tồn tại trong V1.
- Không tuyên bố có thể khôi phục nếu người dùng quên PIN.

## Định dạng ngoài

`format = suc-khoe-y-te-secure-vault-backup-v1`

Gói JSON bên ngoài chỉ chứa:

- phiên bản định dạng;
- `sourceProfileId`;
- thời điểm xuất;
- thông số PBKDF2 cần thiết để dẫn xuất lại khóa từ PIN;
- IV AES-GCM;
- một ciphertext duy nhất;
- số bản ghi để hỗ trợ UX/kiểm tra giới hạn.

Danh sách bản ghi, domain, tiêu đề, nội dung và timestamp từng bản ghi nằm bên trong ciphertext.

## Quy trình xuất

1. Vault của active profile phải đang mở.
2. Kiểm tra khóa memory hiện tại thực sự thuộc profile.
3. Đọc các ciphertext trong IndexedDB.
4. Giải mã từng bản ghi trong memory để kiểm tra toàn vẹn/profile binding.
5. Đóng gói payload hợp lệ thành inner bundle.
6. Mã hóa toàn inner bundle bằng AES-GCM với khóa Vault hiện tại và AAD riêng cho backup.
7. Tạo JSON backup để người dùng tự lưu.

Không có plaintext nào được ghi ra file hoặc Web Storage trong quy trình này.

## Quy trình khôi phục

V1 chỉ cho phép khôi phục vào active profile chưa có Secure Vault và chưa có bản ghi Vault.

1. Parse/validate định dạng và giới hạn kích thước.
2. Dẫn xuất source key từ PIN + PBKDF2 metadata trong backup.
3. Giải mã outer ciphertext trong memory với backup AAD của source profile.
4. Validate toàn bộ payload trước khi ghi bất kỳ dữ liệu nào.
5. Tạo salt/key mới cho target profile bằng cùng PIN.
6. Đổi `profileId` của payload sang target profile.
7. Mã hóa lại từng payload bằng AES-GCM + AAD target profile.
8. Batch-write ciphertext mới vào IndexedDB.
9. Chỉ sau khi batch-write thành công mới persist cấu hình target Vault.
10. Nếu persist cấu hình thất bại, rollback ciphertext target.
11. Session provider nhận target key và chuyển trạng thái sang `unlocked`.

Nhờ re-encryption, backup có thể được khôi phục sang một profileId mới mà không phá vỡ AAD isolation.

## Giới hạn V1

- 10 MB mỗi file backup.
- tối đa 5.000 bản ghi.
- không merge vào Vault hiện hữu.
- không đổi PIN trong cùng thao tác restore; PIN của backup được dùng để tạo Vault đích với salt mới.
- không có recovery key/cửa hậu nếu quên PIN.
- không tự đồng bộ nhiều thiết bị.

## An toàn

Tệp backup được mã hóa nhưng vẫn có thể bị thử mật khẩu ngoại tuyến nếu rơi vào tay người khác. Người dùng nên dùng cụm mã dài, khó đoán và lưu bản sao ở nơi an toàn.

Mã hóa client-side làm giảm rủi ro đọc dữ liệu lưu trữ, nhưng không bảo vệ tuyệt đối khi ứng dụng đã mở khóa và môi trường trình duyệt bị xâm nhập/XSS.

## Gate

`validate-secure-vault-backup.mjs` bắt buộc kiểm tra:

- không plaintext record trong outer backup;
- sai PIN bị từ chối;
- backup AAD theo source profile;
- restore re-bind/re-encrypt theo target profile;
- không overwrite Vault hiện hữu;
- write ciphertext trước, config sau;
- rollback khi config persist lỗi;
- không network/Control Plane;
- session transition đúng;
- responsive/focus/3D/reduced-motion;
- full repository CI + lint + build trước merge.
