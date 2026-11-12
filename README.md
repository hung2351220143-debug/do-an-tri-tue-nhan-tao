# EcoScan - Phân Loại Rác Thải Thông Minh 🌿

Ứng dụng phân loại rác thải sử dụng Google Gemini AI, xây dựng với Vue 3 + Express.js.

---

## Cấu trúc dự án

```
waste-classifier/
├── backend/          ← Express.js API server
├── frontend-vue/     ← Vue 3 + Vite frontend
└── package.json      ← Script chạy toàn bộ
```

---

## Cài đặt lần đầu

### 1. Cấu hình môi trường
Chỉnh file `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=waste_classifier
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_secret
PORT=5000
```

### 2. Cài dependencies + build frontend
```bash
cd waste-classifier

# Cài tất cả
cd frontend-vue && npm install
cd ../backend && npm install

# Build Vue frontend
cd ../frontend-vue && npm run build
```

---

## Chạy ứng dụng (1 lệnh)

```bash
cd backend
npm start
```

Truy cập: **http://localhost:5000**

> Backend tự serve luôn frontend Vue đã build — chỉ cần 1 server duy nhất.

---

## Chế độ Development (hot-reload)

Mở 2 terminal:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend (hot-reload):**
```bash
cd frontend-vue
npm run dev
```

Truy cập: **http://localhost:5173** (proxy tự động đến backend :5000)

---

## Tài khoản Admin mặc định
```
Email:    admin@waste.com
Password: Admin@123
```

Hoặc tạo admin mới:
```bash
cd backend
npm run create-admin
```
