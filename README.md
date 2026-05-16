# PBMS Frontend

Frontend của **Parking Building Management System** được dựng bằng React + Vite, tách rõ cấu trúc `src/` theo từng phần:

```text
src/
	components/
	data/
	hooks/
	pages/
	services/
	styles/
```

## Chạy dự án

```bash
cd FE
npm install
npm run dev
```

## Luồng hiện có

- Trang chủ trước, có nút Đăng nhập, Đăng ký, Đăng xuất
- Đăng nhập và đăng ký bằng tài khoản user
- Xem hồ sơ sau khi đăng nhập
- Các thẻ nghiệp vụ theo main flow của hệ thống

## BE đang dùng

- `POST /api/users/auth/register`
- `POST /api/users/auth/login`
- `GET /api/users/auth/me`