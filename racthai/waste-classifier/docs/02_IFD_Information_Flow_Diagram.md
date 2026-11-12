# IFD – Information Flow Diagram
# Hệ Thống Phân Loại Rác Thải Thông Minh (EcoScan)

> Mô tả luồng thông tin (dữ liệu) di chuyển giữa các thành phần trong hệ thống.

---

## Sơ Đồ IFD

```mermaid
flowchart LR
    subgraph ACTOR["Tác nhân"]
        U1([👤 Người dùng\nchưa đăng nhập])
        U2([🔐 Người dùng\nđã đăng nhập])
        ADM([🛡️ Admin])
    end

    subgraph FE["Frontend – Vue.js"]
        FE1[Form đăng nhập\n/ đăng ký]
        FE2[Trang phân loại]
        FE3[Trang chat]
        FE4[Trang lịch sử]
        FE5[Admin Dashboard]
    end

    subgraph BE["Backend – Express API"]
        API1["/api/auth"]
        API2["/api/classify"]
        API3["/api/chat"]
        API4["/api/history"]
        API5["/api/admin"]
        MW1[JWT Middleware\nXác thực token]
        MW2[Upload Middleware\nMulter]
    end

    subgraph EXT["Dịch vụ ngoài"]
        GM[☁️ Google Gemini AI\ngoogle/generative-ai]
    end

    subgraph STORE["Lưu trữ"]
        DB[(🗄️ MySQL\nwaste_classifier)]
        FS[📁 File System\n/uploads/]
        MEM[⚡ In-Memory\nCache Map]
    end

    %% ── Đăng ký / Đăng nhập ──
    U1 -->|"username, email, password"| FE1
    U2 -->|"username, password"| FE1
    FE1 -->|"POST {username,email,password}"| API1
    API1 -->|"SELECT/INSERT users"| DB
    DB -->|"user record"| API1
    API1 -->|"JWT Token + user info"| FE1
    FE1 -->|"Lưu token vào localStorage"| FE1

    %% ── Phân loại ảnh ──
    U1 -->|"File ảnh"| FE2
    U2 -->|"File ảnh"| FE2
    FE2 -->|"multipart/form-data {image}"| MW2
    MW2 -->|"File lưu vào disk"| FS
    MW2 -->|"req.file (path, filename)"| API2
    API2 -->|"Tính MD5 hash"| MEM
    MEM -->|"Cache hit / miss"| API2
    API2 -->|"SELECT by image_hash"| DB
    DB -->|"Cached result_json"| API2
    API2 -->|"base64 ảnh + prompt"| GM
    GM -->|"JSON phân loại (detections[])"| API2
    API2 -->|"INSERT classifications"| DB
    API2 -->|"INSERT api_usage"| DB
    API2 -->|"{classificationId, imageUrl, result}"| FE2

    %% ── Chat AI ──
    U2 -->|"Tin nhắn văn bản"| FE3
    FE3 -->|"POST {message, history[]}"| API3
    API3 -->|"message + lịch sử"| GM
    GM -->|"Text phản hồi + tokenCount"| API3
    API3 -->|"INSERT chat_history"| DB
    API3 -->|"{response, tokens}"| FE3

    %% ── Lịch sử ──
    U2 -->|"Yêu cầu xem lịch sử"| FE4
    FE4 -->|"GET /api/history + JWT"| MW1
    MW1 -->|"Xác thực token"| API4
    API4 -->|"SELECT classifications WHERE user_id"| DB
    DB -->|"Danh sách kết quả phân loại"| API4
    API4 -->|"{items[], total}"| FE4

    %% ── Admin ──
    ADM -->|"Xem thống kê, quản lý"| FE5
    FE5 -->|"GET /api/admin/* + JWT Admin"| MW1
    MW1 -->|"Xác thực role=admin"| API5
    API5 -->|"SELECT aggregate queries"| DB
    DB -->|"Thống kê tổng hợp"| API5
    API5 -->|"{stats, users[], images[]}"| FE5

    style ACTOR fill:#E3F2FD,stroke:#1565C0
    style FE fill:#E8F5E9,stroke:#2E7D32
    style BE fill:#FFF3E0,stroke:#E65100
    style EXT fill:#F3E5F5,stroke:#6A1B9A
    style STORE fill:#FCE4EC,stroke:#880E4F
```

---

## Bảng Luồng Thông Tin Chi Tiết

| STT | Từ | Đến | Thông tin truyền | Định dạng | Ghi chú |
|---|---|---|---|---|---|
| 1 | Người dùng | Frontend | username, password | Form input | Mã hóa qua HTTPS |
| 2 | Frontend | `/api/auth` | Thông tin đăng nhập | JSON | POST request |
| 3 | `/api/auth` | MySQL | Truy vấn user | SQL | Bcrypt verify |
| 4 | `/api/auth` | Frontend | JWT Token | JSON | Lưu localStorage |
| 5 | Frontend | `/api/classify` | File ảnh | multipart/form-data | Max 10MB |
| 6 | Multer | File System | File ảnh | Binary | `/uploads/rac-*.jpg` |
| 7 | `/api/classify` | Gemini AI | ảnh base64 + prompt | JSON | Qua HTTPS |
| 8 | Gemini AI | `/api/classify` | Kết quả JSON phân loại | JSON | `detections[]` array |
| 9 | `/api/classify` | MySQL | Kết quả lưu trữ | SQL INSERT | `result_json` LONGTEXT |
| 10 | Frontend | `/api/chat` | Tin nhắn + lịch sử | JSON | POST + Bearer token |
| 11 | Gemini AI | `/api/chat` | Phản hồi text | String | UTF-8 tiếng Việt |
| 12 | Frontend | `/api/history` | JWT token | Header | Authorization: Bearer |
| 13 | MySQL | `/api/history` | Danh sách phân loại | JSON Array | Phân trang |
| 14 | Frontend | `/api/admin` | JWT Admin token | Header | Kiểm tra role=admin |

---

## Ghi Chú

- **Chiều dữ liệu**: Luôn theo mô hình Request–Response (Client → Server → Nguồn dữ liệu → Server → Client)
- **Bảo mật**: JWT được gửi qua header `Authorization: Bearer <token>` cho các route bảo vệ
- **Cache**: Thông tin hash MD5 ảnh lưu in-memory; kết quả phân loại cache trong DB theo `image_hash`
