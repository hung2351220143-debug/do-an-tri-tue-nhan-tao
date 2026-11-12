# DFD – Data Flow Diagram
# Hệ Thống Phân Loại Rác Thải Thông Minh (EcoScan)

> Biểu diễn dòng dữ liệu qua các tiến trình xử lý theo chuẩn Yourdon–DeMarco.
> Ký hiệu: `(n)` = Tiến trình, `=====` = Kho dữ liệu, `[ ]` = Tác nhân ngoài

---

## Mức 0 – Context Diagram (Tổng quan)

```mermaid
flowchart TD
    ND([👤 Người Dùng])
    ADM([🛡️ Admin])
    GEM([☁️ Gemini AI])

    SYS(["🔄 HỆ THỐNG\nPHÂN LOẠI RÁC THẢI\nEcoScan"])

    ND -->|"Ảnh rác, tin nhắn, thông tin đăng ký"| SYS
    SYS -->|"Kết quả phân loại, phản hồi chat, lịch sử"| ND

    ADM -->|"Yêu cầu thống kê, quản lý"| SYS
    SYS -->|"Báo cáo, danh sách user/ảnh"| ADM

    SYS -->|"Ảnh base64 + prompt"| GEM
    GEM -->|"JSON phân loại / Text chat"| SYS

    style SYS fill:#FFF9C4,stroke:#F57F17,stroke-width:3px
    style ND fill:#E3F2FD,stroke:#1565C0
    style ADM fill:#FCE4EC,stroke:#880E4F
    style GEM fill:#F3E5F5,stroke:#6A1B9A
```

---

## Mức 1 – DFD Tổng Thể

```mermaid
flowchart TD
    %% Tác nhân ngoài
    ND([👤 Người Dùng])
    ADM([🛡️ Admin])
    GEM([☁️ Google Gemini AI])

    %% Kho dữ liệu
    DS1[("D1\nusers")]
    DS2[("D2\nclassifications")]
    DS3[("D3\nchat_history")]
    DS4[("D4\napi_usage")]
    DS5[("D5\n/uploads/\nFile System")]

    %% Tiến trình
    P1(["1.0\nXác Thực\nNgười Dùng"])
    P2(["2.0\nPhân Loại\nRác Thải"])
    P3(["3.0\nChat\nvới AI"])
    P4(["4.0\nXem\nLịch Sử"])
    P5(["5.0\nQuản Trị\nHệ Thống"])

    %% ── P1: Xác thực ──
    ND -->|"username, password, email"| P1
    P1 <-->|"Truy vấn / Lưu user"| DS1
    P1 -->|"JWT token"| ND

    %% ── P2: Phân loại ──
    ND -->|"File ảnh"| P2
    P2 -->|"Lưu file ảnh"| DS5
    P2 -->|"Ảnh base64 + prompt"| GEM
    GEM -->|"JSON detections"| P2
    P2 <-->|"Cache / Lưu kết quả"| DS2
    P2 -->|"Ghi log"| DS4
    P2 -->|"Kết quả phân loại JSON"| ND

    %% ── P3: Chat ──
    ND -->|"Tin nhắn + lịch sử chat"| P3
    P3 -->|"Tin nhắn + context"| GEM
    GEM -->|"Phản hồi văn bản"| P3
    P3 -->|"Lưu lịch sử"| DS3
    P3 -->|"Ghi log"| DS4
    P3 -->|"Phản hồi AI"| ND

    %% ── P4: Lịch sử ──
    ND -->|"Yêu cầu xem lịch sử"| P4
    P4 <-->|"Truy vấn lịch sử"| DS2
    P4 -->|"Danh sách kết quả"| ND

    %% ── P5: Admin ──
    ADM -->|"Yêu cầu thống kê / quản lý"| P5
    P5 <-->|"Truy vấn tổng hợp"| DS1
    P5 <-->|"Truy vấn tổng hợp"| DS2
    P5 <-->|"Truy vấn tổng hợp"| DS3
    P5 <-->|"Truy vấn tổng hợp"| DS4
    P5 -->|"Báo cáo thống kê"| ADM

    style ND fill:#E3F2FD,stroke:#1565C0
    style ADM fill:#FCE4EC,stroke:#880E4F
    style GEM fill:#F3E5F5,stroke:#6A1B9A
    style DS1 fill:#FFFDE7,stroke:#F9A825
    style DS2 fill:#FFFDE7,stroke:#F9A825
    style DS3 fill:#FFFDE7,stroke:#F9A825
    style DS4 fill:#FFFDE7,stroke:#F9A825
    style DS5 fill:#FFFDE7,stroke:#F9A825
```

---

## Mức 2 – Chi Tiết Tiến Trình 2.0: Phân Loại Rác Thải

```mermaid
flowchart TD
    ND([👤 Người Dùng])
    GEM([☁️ Gemini AI])
    DS2[("D2\nclassifications")]
    DS4[("D4\napi_usage")]
    DS5[("D5\n/uploads/")]

    P21(["2.1\nNhận &\nXác nhận file"])
    P22(["2.2\nLưu file\nvào disk"])
    P23(["2.3\nTính MD5\nhash ảnh"])
    P24(["2.4\nKiểm tra\nCache DB"])
    P25(["2.5\nGọi\nGemini API"])
    P26(["2.6\nXử lý &\nChuẩn hóa kết quả"])
    P27(["2.7\nLưu kết quả\nvào DB"])
    P28(["2.8\nGhi log\nAPI Usage"])
    P29(["2.9\nTrả kết quả\nvề client"])

    ND -->|"multipart/form-data"| P21
    P21 -->|"Validated file"| P22
    P22 -->|"Đường dẫn file"| DS5
    P22 -->|"req.file"| P23
    P23 -->|"MD5 hash"| P24
    P24 <-->|"SELECT WHERE image_hash"| DS2
    P24 -->|"Cache miss → gọi AI"| P25
    P24 -->|"Cache hit → dùng kết quả cũ"| P27
    P25 -->|"base64 + prompt"| GEM
    GEM -->|"Raw JSON string"| P26
    P26 -->|"Parsed + enriched JSON"| P27
    P27 -->|"INSERT classifications"| DS2
    P27 -->|"Kết quả"| P28
    P28 -->|"INSERT api_usage"| DS4
    P27 -->|"classificationId + result"| P29
    P29 -->|"JSON response"| ND

    style ND fill:#E3F2FD,stroke:#1565C0
    style GEM fill:#F3E5F5,stroke:#6A1B9A
    style DS2 fill:#FFFDE7,stroke:#F9A825
    style DS4 fill:#FFFDE7,stroke:#F9A825
    style DS5 fill:#FFFDE7,stroke:#F9A825
```

---

## Mô Tả Các Kho Dữ Liệu (Data Stores)

| Ký hiệu | Tên | Bảng DB | Nội dung |
|---|---|---|---|
| D1 | users | `users` | Thông tin tài khoản, mật khẩu hash, role |
| D2 | classifications | `classifications` | Ảnh đã phân loại, kết quả JSON, hash |
| D3 | chat_history | `chat_history` | Lịch sử câu hỏi và phản hồi AI |
| D4 | api_usage | `api_usage` | Log sử dụng API, token consumed |
| D5 | File System | `/uploads/` | File ảnh gốc upload lên server |

---

## Mô Tả Các Tiến Trình (Processes)

| Tiến trình | Tên | Mô tả |
|---|---|---|
| 1.0 | Xác Thực Người Dùng | Đăng ký, đăng nhập, cấp JWT token |
| 2.0 | Phân Loại Rác Thải | Nhận ảnh → cache → Gemini AI → lưu → trả kết quả |
| 3.0 | Chat với AI | Nhận tin nhắn → Gemini → lưu lịch sử → trả phản hồi |
| 4.0 | Xem Lịch Sử | Lấy danh sách phân loại theo user_id |
| 5.0 | Quản Trị Hệ Thống | Thống kê, quản lý user, quản lý ảnh |
