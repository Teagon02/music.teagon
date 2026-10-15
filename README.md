# Music player

## Cấu hình lưu ảnh lên Sanity

Ứng dụng tải ảnh bài hát qua API serverless `api/upload-image.js`, vì vậy token ghi của Sanity không bị đưa xuống trình duyệt.

1. Trong Sanity Manage, tạo API token có quyền ghi (Editor hoặc quyền tối thiểu cho phép tạo image asset).
2. Deploy dự án lên Vercel.
3. Thêm `SANITY_PROJECT_ID`, `SANITY_DATASET` (thường là `production`) và `SANITY_API_TOKEN` vào Environment Variables của Vercel.
4. Redeploy ứng dụng.

Có thể sao chép `.env.example` thành `.env.local` khi chạy local bằng Vercel CLI. Không đưa token thật vào mã nguồn hoặc commit lên Git.
