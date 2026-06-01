# Diễn đàn Hỏi Đáp Sinh viên (Q&A)

Nền tảng hỏi đáp học thuật kiểu StackOverflow dành cho **sinh viên/giảng viên** và trang **quản trị viên**.

## Công nghệ

- **Frontend**: React + TypeScript + Redux Toolkit + Ant Design + TinyMCE + Axios + LocalStorage
- **Backend**: Node.js (Express) + TypeScript + Prisma ORM (MySQL) + JWT + Nodemailer
- **Database**: MySQL

## Cấu trúc thư mục

- `backend/`: API + Prisma (MySQL)
- `frontend/`: React SPA

## Chạy dự án

### 1) Tạo database MySQL (chạy SQL)

Mở MySQL Workbench / phpMyAdmin và chạy file:

- `backend/sql/student_forum.sql`

Script sẽ tạo database `student_forum`, các bảng và **dữ liệu mẫu** (mật khẩu `123456` đã mã hóa bcrypt).

Tài khoản thử:

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@gmail.com | 123456 | ADMIN |
| student@gmail.com | 123456 | STUDENT |
| teacher@gmail.com | 123456 | LECTURER |

### 2) Backend

Tạo file `.env` từ `.env.example` (hoặc dùng mẫu có sẵn `DB_*` + `JWT_SECRET`):

```bash
cd backend
yarn
yarn prisma:generate
yarn dev
```

Backend chạy ở `http://localhost:3000/api`.

> **Lưu ý:** Dự án backend dùng **Express + Prisma**, không phải NestJS. Bảng câu hỏi trong MySQL tên `posts` (map với model `Question` trong Prisma).

### 3) Frontend

Tạo file `.env` từ `.env.example`:

- `frontend/.env`

Sau đó:

```bash
cd frontend
yarn
yarn dev
```

Frontend chạy ở `http://localhost:5173`.

## Chức năng đã scaffold

- **Sinh viên/giảng viên**: đăng ký/đăng nhập, đăng câu hỏi (TinyEditor), tag, bình luận, vote, tìm kiếm & lọc tag
- **Quản trị viên**: danh sách bài, xóa bài, danh sách user, thêm user, khóa user, reset mật khẩu (gửi email)
- **Email**: gửi mail khi có bài đăng mới / có bình luận mới (cấu hình SMTP)

