# Sơ Đồ Luồng Hoạt Động (Activity Flow Diagram)
# Hệ Thống Phân Loại Rác Thải Thông Minh (EcoScan)

> Mô tả chi tiết luồng hoạt động của từng tính năng chính theo góc nhìn người dùng.

---

## 1. Luồng Đăng Ký & Đăng Nhập

```mermaid
flowchart TD
    START([🟢 Bắt đầu]) --> CHON{Đã có tài khoản?}

    CHON -->|Chưa có| DK[Vào trang Đăng Ký]
    DK --> NHAP_DK[Nhập username, email, password]
    NHAP_DK --> VAL_DK{Hợp lệ?}
    VAL_DK -->|Không| ERR_DK[Hiển thị lỗi validation]
    ERR_DK --> NHAP_DK
    VAL_DK -->|Có| POST_REG[POST /api/auth/register]
    POST_REG --> CHECK_DUP{Username/email\ntrùng?}
    CHECK_DUP -->|Có| ERR_DUP[Báo lỗi: đã tồn tại]
    ERR_DUP --> NHAP_DK
    CHECK_DUP -->|Không| HASH_PW[Mã hóa mật khẩu bcrypt]
    HASH_PW --> SAVE_USER[Lưu user vào DB]
    SAVE_USER --> GEN_JWT[Tạo JWT Token]

    CHON -->|Đã có| DN[Vào trang Đăng Nhập]
    DN --> NHAP_DN[Nhập username/email + password]
    NHAP_DN --> POST_LOGIN[POST /api/auth/login]
    POST_LOGIN --> CHECK_USER{User tồn tại?}
    CHECK_USER -->|Không| ERR_USER[Báo lỗi: không tìm thấy]
    ERR_USER --> NHAP_DN
    CHECK_USER -->|Có| CHECK_PW{Mật khẩu\nkhớp?}
    CHECK_PW -->|Không| ERR_PW[Báo lỗi: sai mật khẩu]
    ERR_PW --> NHAP_DN
    CHECK_PW -->|Có| UPDATE_LOGIN[Cập nhật last_login]
    UPDATE_LOGIN --> GEN_JWT

    GEN_JWT --> SAVE_TOKEN[Lưu JWT vào localStorage]
    SAVE_TOKEN --> REDIRECT[Chuyển về trang chủ]
    REDIRECT --> END_AUTH([🔴 Kết thúc])

    style START fill:#C8E6C9
    style END_AUTH fill:#FFCDD2
    style ERR_DK fill:#FFCDD2
    style ERR_DUP fill:#FFCDD2
    style ERR_USER fill:#FFCDD2
    style ERR_PW fill:#FFCDD2
```

---

## 2. Luồng Phân Loại Rác Từ Ảnh

```mermaid
flowchart TD
    START([🟢 Người dùng vào /classify]) --> CHON_ANH[Chọn / kéo thả ảnh]
    CHON_ANH --> CHECK_FILE{File hợp lệ?\nJPG/PNG/WEBP\n≤ 10MB}
    CHECK_FILE -->|Không| ERR_FILE[Thông báo lỗi định dạng]
    ERR_FILE --> CHON_ANH

    CHECK_FILE -->|Có| PREVIEW[Hiển thị preview ảnh]
    PREVIEW --> BTN_UPLOAD[Nhấn Phân Loại]
    BTN_UPLOAD --> LOADING[Hiển thị loading spinner]
    LOADING --> POST_IMG[POST /api/classify\nmultipart/form-data]

    POST_IMG --> MULTER[Multer lưu file\nvào /uploads/]
    MULTER --> HASH[Tính MD5 hash của ảnh]
    HASH --> CHECK_CACHE_MEM{Cache\nin-memory?}

    CHECK_CACHE_MEM -->|Hit| RETURN_MEM[Trả kết quả từ\nin-memory cache]
    CHECK_CACHE_MEM -->|Miss| CHECK_CACHE_DB{Cache\ntrong DB?}

    CHECK_CACHE_DB -->|Hit| SAVE_NEW[Lưu bản ghi mới\nvới kết quả cũ]
    SAVE_NEW --> LOG_CACHED[Ghi api_usage: cached]
    LOG_CACHED --> RETURN_DB[Trả kết quả cached ⚡]

    CHECK_CACHE_DB -->|Miss| CALL_GEMINI[Gọi Google Gemini AI\nbase64 ảnh + prompt]
    CALL_GEMINI --> GEMINI_OK{Gemini\nthành công?}

    GEMINI_OK -->|Không| ERR_GEMINI[Báo lỗi: không thể\nkết nối AI]
    ERR_GEMINI --> SAVE_FAIL[Lưu status=failed]

    GEMINI_OK -->|Có| PARSE_JSON[Parse JSON response\nxử lý markdown]
    PARSE_JSON --> ENRICH[Gắn thêm thông tin\nloại rác và màu sắc]
    ENRICH --> SAVE_RESULT[Lưu vào classifications DB]
    SAVE_RESULT --> LOG_SUCCESS[Ghi api_usage: success]
    LOG_SUCCESS --> RETURN_NEW[Trả kết quả mới 🤖]

    RETURN_MEM --> RENDER
    RETURN_DB --> RENDER
    RETURN_NEW --> RENDER

    RENDER[Hiển thị kết quả:\n- Bounding boxes\n- Thông tin từng vật phẩm\n- Hướng dẫn tái chế]
    RENDER --> END([🔴 Kết thúc])

    style START fill:#C8E6C9
    style END fill:#FFCDD2
    style ERR_FILE fill:#FFCDD2
    style ERR_GEMINI fill:#FFCDD2
    style RETURN_MEM fill:#E1F5FE
    style RETURN_DB fill:#E1F5FE
    style RETURN_NEW fill:#F3E5F5
```

---

## 3. Luồng Chat AI

```mermaid
flowchart TD
    START([🟢 Người dùng vào /chat]) --> LOAD_HISTORY[Tải lịch sử chat\ntừ localStorage/DB]
    LOAD_HISTORY --> WELCOME[Hiển thị tin nhắn\nchào mừng từ AI]
    WELCOME --> NHAP_MSG[Người dùng gõ tin nhắn]
    NHAP_MSG --> CHECK_EMPTY{Tin nhắn\nrỗng?}
    CHECK_EMPTY -->|Có| NHAP_MSG
    CHECK_EMPTY -->|Không| SEND_BTN[Nhấn Gửi / Enter]
    SEND_BTN --> SHOW_USER[Hiển thị tin nhắn\nphía người dùng]
    SHOW_USER --> SHOW_TYPING[Hiển thị trạng thái\nAI đang gõ...]
    SHOW_TYPING --> POST_CHAT[POST /api/chat\n{message, history}]
    POST_CHAT --> BUILD_HIST[Xây dựng lịch sử\ntheo định dạng Gemini]
    BUILD_HIST --> CALL_AI[Gọi Gemini AI\nstartChat + sendMessage]
    CALL_AI --> AI_OK{Thành công?}
    AI_OK -->|Không, rate limit| ERR_RATE[Báo lỗi: quá giới hạn\nvui lòng chờ]
    ERR_RATE --> NHAP_MSG
    AI_OK -->|Không, lỗi khác| ERR_AI[Báo lỗi kết nối AI]
    ERR_AI --> NHAP_MSG
    AI_OK -->|Có| SAVE_CHAT[Lưu vào chat_history DB]
    SAVE_CHAT --> RETURN_RESP[Trả về response + tokens]
    RETURN_RESP --> SHOW_AI[Hiển thị phản hồi AI\nvới emoji và định dạng]
    SHOW_AI --> UPDATE_HIST[Cập nhật lịch sử chat\nlocal]
    UPDATE_HIST --> TIEP_TUC{Tiếp tục\nchat?}
    TIEP_TUC -->|Có| NHAP_MSG
    TIEP_TUC -->|Không| END([🔴 Kết thúc])

    style START fill:#C8E6C9
    style END fill:#FFCDD2
    style ERR_RATE fill:#FFCDD2
    style ERR_AI fill:#FFCDD2
    style SHOW_AI fill:#F3E5F5
```

---

## 4. Luồng Xem Lịch Sử

```mermaid
flowchart TD
    START([🟢 Người dùng vào /history]) --> CHECK_AUTH{Đã đăng nhập?}
    CHECK_AUTH -->|Không| REDIRECT_LOGIN[Chuyển hướng\nđến /login]
    REDIRECT_LOGIN --> END_REDIR([🔴 Kết thúc])
    CHECK_AUTH -->|Có| GET_HIST[GET /api/history\n+ Bearer JWT]
    GET_HIST --> VERIFY_JWT{JWT hợp lệ?}
    VERIFY_JWT -->|Không| ERR_401[Lỗi 401\nHết phiên đăng nhập]
    ERR_401 --> REDIRECT_LOGIN
    VERIFY_JWT -->|Có| QUERY_DB[SELECT classifications\nWHERE user_id]
    QUERY_DB --> EMPTY{Có dữ liệu?}
    EMPTY -->|Không| SHOW_EMPTY[Hiển thị thông báo\nChưa có lịch sử nào]
    SHOW_EMPTY --> END([🔴 Kết thúc])
    EMPTY -->|Có| SHOW_LIST[Hiển thị danh sách\nảnh + kết quả]
    SHOW_LIST --> CLICK_ITEM{Nhấn vào\nmột mục?}
    CLICK_ITEM -->|Không| END
    CLICK_ITEM -->|Có| SHOW_DETAIL[Hiển thị chi tiết\nkết quả phân loại]
    SHOW_DETAIL --> END

    style START fill:#C8E6C9
    style END fill:#FFCDD2
    style END_REDIR fill:#FFCDD2
    style ERR_401 fill:#FFCDD2
    style SHOW_EMPTY fill:#FFF9C4
```

---

## 5. Luồng Quản Trị Admin

```mermaid
flowchart TD
    START([🟢 Admin truy cập /admin]) --> CHECK_JWT{JWT tồn tại?}
    CHECK_JWT -->|Không| REDIR_LOGIN[Chuyển hướng /login]
    REDIR_LOGIN --> END_REDIR([🔴 Kết thúc])
    CHECK_JWT -->|Có| CHECK_ROLE{role = admin?}
    CHECK_ROLE -->|Không| ERR_PERM[Lỗi 403\nKhông có quyền]
    ERR_PERM --> REDIR_HOME[Chuyển hướng /]
    REDIR_HOME --> END_PERM([🔴 Kết thúc])
    CHECK_ROLE -->|Có| LOAD_DASHBOARD[Tải Admin Dashboard]

    LOAD_DASHBOARD --> TAB{Chọn tab}

    TAB -->|Dashboard| GET_STATS[GET /api/admin/stats]
    GET_STATS --> SHOW_STATS[Hiển thị:\n- Tổng users\n- Tổng phân loại\n- Tổng chat\n- Hôm nay]

    TAB -->|Users| GET_USERS[GET /api/admin/users]
    GET_USERS --> SHOW_USERS[Danh sách users\nvới phân trang]
    SHOW_USERS --> USER_ACTION{Hành động?}
    USER_ACTION -->|Xem| VIEW_USER[Chi tiết user]
    USER_ACTION -->|Khoá/Mở| TOGGLE_USER[PATCH /api/admin/users/:id]

    TAB -->|Ảnh| GET_IMAGES[GET /api/admin/images]
    GET_IMAGES --> SHOW_IMAGES[Danh sách ảnh\n+ kết quả phân loại]
    SHOW_IMAGES --> IMG_ACTION{Hành động?}
    IMG_ACTION -->|Xem| VIEW_IMG[Chi tiết phân loại]
    IMG_ACTION -->|Xóa| DEL_IMG[DELETE /api/admin/images/:id]

    TAB -->|AI Stats| GET_AI[GET /api/admin/ai-stats]
    GET_AI --> SHOW_AI[Thống kê:\n- Phân loại theo loại rác\n- Token tiêu thụ\n- Cache hit rate]

    SHOW_STATS --> END([🔴 Kết thúc])
    TOGGLE_USER --> END
    VIEW_USER --> END
    VIEW_IMG --> END
    DEL_IMG --> END
    SHOW_AI --> END

    style START fill:#C8E6C9
    style END fill:#FFCDD2
    style END_REDIR fill:#FFCDD2
    style END_PERM fill:#FFCDD2
    style ERR_PERM fill:#FFCDD2
```
