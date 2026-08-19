# Kế hoạch tuyến bài Glinteco — deploy lên Vercel

Trang kế hoạch có bảng sửa trực tiếp. Sau khi deploy, **mọi người mở cùng một link, ai sửa thì tất cả cùng thấy**, thay đổi tự lưu lên server.

---

## Cấu trúc

```
.
├── index.html        trang kế hoạch (toàn bộ giao diện nằm trong 1 file)
├── api/state.js      API đọc/ghi trạng thái
├── package.json
└── README.md
```

---

## Deploy trong 5 bước

### 1. Đưa code lên GitHub

```bash
cd glinteco-plan
git init
git add .
git commit -m "Ke hoach tuyen bai"
git remote add origin https://github.com/<tài-khoản>/glinteco-plan.git
git push -u origin main
```

### 2. Tạo project trên Vercel

Vào [vercel.com/new](https://vercel.com/new) → chọn repo vừa push → **Deploy**.
Không cần cấu hình build, Vercel tự nhận `index.html` và thư mục `api/`.

### 3. Thêm database

Trong project vừa tạo → tab **Storage** → **Create Database** → chọn **Upstash Redis** (gói free đủ dùng) → **Connect**.

Vercel sẽ tự thêm các biến môi trường `KV_REST_API_URL` và `KV_REST_API_TOKEN` vào project.

### 4. Deploy lại

Tab **Deployments** → dấu ba chấm ở bản mới nhất → **Redeploy**.
Bước này cần thiết để hàm API nhận được biến môi trường vừa thêm.

### 5. Xong

Mở link Vercel cấp. Góc dưới phải hiện **"Đồng bộ chung"** là đã chạy đúng.

---

## Đặt mật khẩu chỉnh sửa (tuỳ chọn)

Mặc định ai có link cũng sửa được. Muốn giới hạn:

**Settings → Environment Variables** → thêm

| Name | Value |
|---|---|
| `EDIT_PASSWORD` | mật khẩu bạn chọn |

Rồi Redeploy. Từ đó ai muốn lưu sẽ được hỏi mật khẩu một lần, trình duyệt nhớ cho các lần sau. Người không có mật khẩu vẫn xem được bình thường.

---

## Cách hoạt động

| Việc | Cơ chế |
|---|---|
| Tự lưu | Ngừng gõ 1,5 giây là tự gửi lên server |
| Lưu thủ công | Nút **✓ Lưu thay đổi** |
| Nhận thay đổi của người khác | Tự kiểm tra mỗi 20 giây, có bản mới thì cập nhật ngay |
| Hai người sửa cùng lúc | Người lưu sau được hỏi: lấy bản của người kia, hay ghi đè bằng bản của mình |
| Nút ↺ | Xoá hết thay đổi, quay về bản gốc |
| Xuất Google Sheets | Copy toàn bộ 15 bài dạng bảng, dán thẳng vào Sheets |

Trạng thái luôn hiện ở góc dưới phải kèm số hiệu bản (`#3`, `#4`…) để biết đang xem bản nào.

**Mở file `index.html` trực tiếp từ máy** (không qua server) thì trang vẫn chạy, nhưng chuyển sang chế độ lưu trong trình duyệt của máy đó, không dùng chung được. Chip trạng thái sẽ báo rõ.

---

## Sửa nội dung gốc

Nội dung mặc định nằm ngay trong `index.html`. Nếu muốn đổi bản gốc (thứ nút ↺ khôi phục về), sửa file rồi push lại.

Lưu ý: bản đang lưu trên server sẽ **đè lên** nội dung trong file mỗi khi ai đó mở trang. Muốn nội dung mới trong file có hiệu lực, sau khi deploy hãy bấm nút ↺ một lần để ghi bản gốc mới lên server.

---

## Xoá dữ liệu, làm lại từ đầu

Vào Upstash console (mở từ tab Storage của Vercel) → xoá khoá `glinteco:plan`.
Muốn đổi tên khoá thì thêm biến môi trường `STATE_KEY`.

---

## Chi phí

Vercel Hobby và Upstash free tier là đủ cho việc này — trang tĩnh, dữ liệu vài trăm KB, vài chục lượt đọc ghi mỗi ngày.
