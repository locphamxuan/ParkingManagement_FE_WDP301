
## Yêu cầu

- Node.js v18+ (hoặc tương đương)
- npm

## Cài đặt

Mở terminal tại thư mục `ParkingManagement_FE_WDP301` và chạy:

```bash
npm install
```

## Chạy ứng dụng trong môi trường phát triển

```bash
npm run dev
```

Sau đó mở trình duyệt tới URL mà Vite hiển thị (mặc định là `http://localhost:5173`).

## Build và preview

Build sản phẩm để deploy:

```bash
npm run build
```

Preview bản build:

```bash
npm run preview
```

## Cấu trúc thư mục chính

```text
ParkingManagement_FE_WDP301/
├─ public/ (nếu có)      # Tài nguyên tĩnh, favicon, file tĩnh
├─ src/
│  ├─ components/         # Các component UI dùng lại và layout
│  │  ├─ common/          # Component con dùng chung cho nhiều nơi
│  │  ├─ features/        # Component chức năng cụ thể trên trang
│  │  ├─ layout/          # Header, Footer, PageShell, SectionHeader
│  │  ├─ modules/         # Block module nghiệp vụ và giao diện chính
│  │  └─ ui/              # Button, Input, Card, Label, Badge,...
│  ├─ data/               # Dữ liệu demo, cấu hình module, fake flow
│  ├─ hooks/              # Custom hook tái sử dụng như useAuthSession
│  ├─ lib/                # Utility chung, axios config, helper
│  ├─ pages/              # Các trang chính của ứng dụng
│  ├─ services/           # API service, storage, config backend
│  ├─ styles/             # CSS toàn cục, Tailwind mở rộng
│  ├─ App.jsx             # Router và đóng gói layout chính
│  └─ main.jsx            # Entry point React
├─ index.html             # Template HTML chính
├─ package.json           # Thông tin package và lệnh npm
├─ tailwind.config.js     # Cấu hình Tailwind CSS
├─ postcss.config.js      # Cấu hình PostCSS
├─ jsconfig.json          # Alias và cấu hình editor/IDE
└─ README.md             # Tài liệu dự án
```

## Vai trò của từng thư mục trong `src/`

- `src/components/`
  - Chứa mọi component tái sử dụng của giao diện.
  - `layout/` chứa thanh điều hướng, footer, shell trang.
  - `ui/` chứa các component cơ bản như button, card, input, label.
  - `modules/` chứa các thẻ chức năng chính của hệ thống.

- `src/pages/`
  - Chứa các trang chính của ứng dụng.
  - `HomePage.jsx` là landing page khách hàng.
  - `DashboardPage.jsx` là trang quản lý sau khi đăng nhập.
  - `AuthPage.jsx` là trang đăng nhập / đăng ký.
  - `AboutPage.jsx` và `ContactPage.jsx` là trang thông tin.

- `src/services/`
  - Chứa logic gọi API và lưu trữ client.
  - `axios.js` cấu hình base URL và interceptors.
  - `storage.js` lưu token và thông tin user.
  - `authService.js` xử lý endpoint đăng nhập/đăng ký.

- `src/hooks/`
  - Chứa custom hook `useAuthSession` quản lý phiên người dùng và xác thực.

- `src/lib/`
  - Chứa helper chung dùng trong nhiều component.
  - `utils.js` chứa hàm `cn()` gộp className.

- `src/styles/`
  - Chứa CSS toàn cục và mở rộng Tailwind.
  - `global.css` định nghĩa palette, component style và hiệu ứng chung.

- `src/data/`
  - Chứa cấu hình và dữ liệu tĩnh dùng cho UI demo.

## API backend hiện đang sử dụng

Ứng dụng frontend hiện có kết nối đến backend theo các endpoint chính:

- `POST /api/users/auth/register`
- `POST /api/users/auth/login`
- `GET /api/users/auth/me`

## Ghi chú

- Đây là frontend SPA, sử dụng React Router DOM để điều hướng.
- Component `Header` hiện có dropdown hồ sơ người dùng và upload avatar.
- Nhiều tính năng đang được xây dựng theo flow module trong `src/data/mainFlow.js`.

Nếu cần, tôi có thể bổ sung thêm phần hướng dẫn deploy hoặc mô tả flow backend chi tiết hơn.