# PFD – Process Flow Diagram
# Hệ Thống Phân Loại Rác Thải Thông Minh (EcoScan)

> Mô tả luồng xử lý tổng quát của toàn bộ hệ thống theo từng tiến trình chính.

---

## Sơ Đồ PFD

```mermaid
flowchart TD
    subgraph NGUOI_DUNG["👤 Người Dùng (Client)"]
        A([Truy cập Website])
        B([Upload Ảnh Rác])
        C([Đặt Câu Hỏi Chat])
        D([Xem Lịch Sử])
    end

    subgraph FRONTEND["🖥️ Frontend – Vue.js (Port 5173)"]
        F1[Trang Chủ / Home]
        F2[Trang Phân Loại / Classify]
        F3[Trang Chat AI]
        F4[Trang Lịch Sử]
        F5[Trang Đăng Nhập / Đăng Ký]
        F6[Trang Admin Dashboard]
    end

    subgraph BACKEND["⚙️ Backend – Node.js / Express (Port 5000)"]
        B1["/api/auth – Xác thực JWT"]
        B2["/api/classify – Phân loại ảnh"]
        B3["/api/chat – Chat AI"]
        B4["/api/history – Lịch sử"]
        B5["/api/admin – Quản trị"]
    end

    subgraph AI["🤖 Google Gemini AI"]
        AI1[Gemini 1.5 Flash\nPhân tích ảnh]
        AI2[Gemini 1.5 Flash\nChat hỏi đáp]
    end

    subgraph DB["🗄️ MySQL Database (XAMPP)"]
        DB1[(users)]
        DB2[(classifications)]
        DB3[(chat_history)]
        DB4[(api_usage)]
    end

    subgraph CACHE["⚡ Cache Layer"]
        CA1[In-Memory Cache\nMD5 Hash ảnh]
        CA2[DB Cache\nKết quả đã phân tích]
    end

    %% Luồng người dùng → frontend
    A --> F1
    B --> F2
    C --> F3
    D --> F4

    %% Frontend → Backend
    F5 -->|POST /login, /register| B1
    F2 -->|POST /api/classify| B2
    F3 -->|POST /api/chat| B3
    F4 -->|GET /api/history| B4
    F6 -->|GET /api/admin/*| B5

    %% Backend → AI
    B2 -->|Ảnh base64 + Prompt| AI1
    B3 -->|Tin nhắn + Lịch sử| AI2

    %% Backend → Database
    B1 -->|Lưu / Truy vấn user| DB1
    B2 -->|Lưu kết quả| DB2
    B3 -->|Lưu lịch sử chat| DB3
    B2 -->|Ghi log API| DB4
    B3 -->|Ghi log API| DB4

    %% Cache
    B2 <-->|Kiểm tra cache| CA1
    B2 <-->|Kiểm tra DB cache| CA2
    CA2 <-->|Truy vấn hash| DB2

    %% AI → Backend → Frontend
    AI1 -->|JSON kết quả phân loại| B2
    AI2 -->|Text phản hồi| B3
    B2 -->|Trả kết quả| F2
    B3 -->|Trả phản hồi| F3

    style NGUOI_DUNG fill:#E3F2FD,stroke:#1565C0
    style FRONTEND fill:#E8F5E9,stroke:#2E7D32
    style BACKEND fill:#FFF3E0,stroke:#E65100
    style AI fill:#F3E5F5,stroke:#6A1B9A
    style DB fill:#FCE4EC,stroke:#880E4F
    style CACHE fill:#E0F7FA,stroke:#006064
```

---

## Mô Tả Các Tiến Trình Chính

| Tiến trình | Đầu vào | Xử lý | Đầu ra |
|---|---|---|---|
| **P1 – Xác thực** | Username/Password | Kiểm tra DB, tạo JWT | JWT Token |
| **P2 – Phân loại ảnh** | File ảnh | Hash → Cache → Gemini AI | JSON kết quả phân loại |
| **P3 – Chat AI** | Tin nhắn văn bản | Lịch sử chat → Gemini | Phản hồi văn bản |
| **P4 – Lưu lịch sử** | Kết quả phân loại | INSERT vào DB | Record trong DB |
| **P5 – Thống kê admin** | Query tổng hợp | SELECT aggregate từ DB | Báo cáo thống kê |

---

## Chú Thích

- **Cache 2 lớp**: In-memory (MD5) + DB cache theo `image_hash` để tránh gọi API trùng lặp
- **JWT Middleware**: Bảo vệ các route cần xác thực, route `/classify` hỗ trợ cả khách (guest)
- **Gemini 1.5 Flash**: Model duy nhất dùng cho cả phân loại ảnh lẫn chat
