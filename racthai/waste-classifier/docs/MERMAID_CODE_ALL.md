# MERMAID CODE – TẤT CẢ SƠ ĐỒ
# Copy từng block bên dưới vào https://mermaid.live để render

---

## ① PFD – Process Flow Diagram

```
flowchart TD
    subgraph NGUOI_DUNG["Nguoi Dung (Client)"]
        A([Truy cap Website])
        B([Upload Anh Rac])
        C([Dat Cau Hoi Chat])
        D([Xem Lich Su])
    end

    subgraph FRONTEND["Frontend – Vue.js (Port 5173)"]
        F1[Trang Chu / Home]
        F2[Trang Phan Loai / Classify]
        F3[Trang Chat AI]
        F4[Trang Lich Su]
        F5[Trang Dang Nhap / Dang Ky]
        F6[Trang Admin Dashboard]
    end

    subgraph BACKEND["Backend – Node.js / Express (Port 5000)"]
        B1["/api/auth – Xac thuc JWT"]
        B2["/api/classify – Phan loai anh"]
        B3["/api/chat – Chat AI"]
        B4["/api/history – Lich su"]
        B5["/api/admin – Quan tri"]
    end

    subgraph AI["Google Gemini AI"]
        AI1[Gemini 1.5 Flash\nPhan tich anh]
        AI2[Gemini 1.5 Flash\nChat hoi dap]
    end

    subgraph DB["MySQL Database (XAMPP)"]
        DB1[(users)]
        DB2[(classifications)]
        DB3[(chat_history)]
        DB4[(api_usage)]
    end

    subgraph CACHE["Cache Layer"]
        CA1[In-Memory Cache\nMD5 Hash anh]
        CA2[DB Cache\nKet qua da phan tich]
    end

    A --> F1
    B --> F2
    C --> F3
    D --> F4

    F5 -->|POST /login, /register| B1
    F2 -->|POST /api/classify| B2
    F3 -->|POST /api/chat| B3
    F4 -->|GET /api/history| B4
    F6 -->|GET /api/admin/*| B5

    B2 -->|Anh base64 + Prompt| AI1
    B3 -->|Tin nhan + Lich su| AI2

    B1 -->|Luu / Truy van user| DB1
    B2 -->|Luu ket qua| DB2
    B3 -->|Luu lich su chat| DB3
    B2 -->|Ghi log API| DB4
    B3 -->|Ghi log API| DB4

    B2 <-->|Kiem tra cache| CA1
    B2 <-->|Kiem tra DB cache| CA2
    CA2 <-->|Truy van hash| DB2

    AI1 -->|JSON ket qua phan loai| B2
    AI2 -->|Text phan hoi| B3
    B2 -->|Tra ket qua| F2
    B3 -->|Tra phan hoi| F3

    style NGUOI_DUNG fill:#E3F2FD,stroke:#1565C0
    style FRONTEND fill:#E8F5E9,stroke:#2E7D32
    style BACKEND fill:#FFF3E0,stroke:#E65100
    style AI fill:#F3E5F5,stroke:#6A1B9A
    style DB fill:#FCE4EC,stroke:#880E4F
    style CACHE fill:#E0F7FA,stroke:#006064
```

---

## ② IFD – Information Flow Diagram

```
flowchart LR
    subgraph ACTOR["Tac nhan"]
        U1([Nguoi dung chua dang nhap])
        U2([Nguoi dung da dang nhap])
        ADM([Admin])
    end

    subgraph FE["Frontend – Vue.js"]
        FE1[Form dang nhap / dang ky]
        FE2[Trang phan loai]
        FE3[Trang chat]
        FE4[Trang lich su]
        FE5[Admin Dashboard]
    end

    subgraph BE["Backend – Express API"]
        API1["/api/auth"]
        API2["/api/classify"]
        API3["/api/chat"]
        API4["/api/history"]
        API5["/api/admin"]
        MW1[JWT Middleware\nXac thuc token]
        MW2[Upload Middleware\nMulter]
    end

    subgraph EXT["Dich vu ngoai"]
        GM[Google Gemini AI\ngoogle/generative-ai]
    end

    subgraph STORE["Luu tru"]
        DB[(MySQL\nwaste_classifier)]
        FS[File System\n/uploads/]
        MEM[In-Memory\nCache Map]
    end

    U1 -->|"username, email, password"| FE1
    U2 -->|"username, password"| FE1
    FE1 -->|"POST {username,email,password}"| API1
    API1 -->|"SELECT/INSERT users"| DB
    DB -->|"user record"| API1
    API1 -->|"JWT Token + user info"| FE1
    FE1 -->|"Luu token vao localStorage"| FE1

    U1 -->|"File anh"| FE2
    U2 -->|"File anh"| FE2
    FE2 -->|"multipart/form-data"| MW2
    MW2 -->|"File luu vao disk"| FS
    MW2 -->|"req.file (path, filename)"| API2
    API2 -->|"Tinh MD5 hash"| MEM
    MEM -->|"Cache hit / miss"| API2
    API2 -->|"SELECT by image_hash"| DB
    DB -->|"Cached result_json"| API2
    API2 -->|"base64 anh + prompt"| GM
    GM -->|"JSON phan loai"| API2
    API2 -->|"INSERT classifications"| DB
    API2 -->|"INSERT api_usage"| DB
    API2 -->|"{classificationId, imageUrl, result}"| FE2

    U2 -->|"Tin nhan van ban"| FE3
    FE3 -->|"POST {message, history[]}"| API3
    API3 -->|"message + lich su"| GM
    GM -->|"Text phan hoi + tokenCount"| API3
    API3 -->|"INSERT chat_history"| DB
    API3 -->|"{response, tokens}"| FE3

    U2 -->|"Yeu cau xem lich su"| FE4
    FE4 -->|"GET /api/history + JWT"| MW1
    MW1 -->|"Xac thuc token"| API4
    API4 -->|"SELECT classifications WHERE user_id"| DB
    DB -->|"Danh sach ket qua phan loai"| API4
    API4 -->|"{items[], total}"| FE4

    ADM -->|"Xem thong ke, quan ly"| FE5
    FE5 -->|"GET /api/admin/* + JWT Admin"| MW1
    MW1 -->|"Xac thuc role=admin"| API5
    API5 -->|"SELECT aggregate queries"| DB
    DB -->|"Thong ke tong hop"| API5
    API5 -->|"{stats, users[], images[]}"| FE5

    style ACTOR fill:#E3F2FD,stroke:#1565C0
    style FE fill:#E8F5E9,stroke:#2E7D32
    style BE fill:#FFF3E0,stroke:#E65100
    style EXT fill:#F3E5F5,stroke:#6A1B9A
    style STORE fill:#FCE4EC,stroke:#880E4F
```

---

## ③ DFD Mức 0 – Context Diagram

```
flowchart TD
    ND([Nguoi Dung])
    ADM([Admin])
    GEM([Gemini AI])

    SYS(["HE THONG\nPHAN LOAI RAC THAI\nEcoScan"])

    ND -->|"Anh rac, tin nhan, thong tin dang ky"| SYS
    SYS -->|"Ket qua phan loai, phan hoi chat, lich su"| ND

    ADM -->|"Yeu cau thong ke, quan ly"| SYS
    SYS -->|"Bao cao, danh sach user/anh"| ADM

    SYS -->|"Anh base64 + prompt"| GEM
    GEM -->|"JSON phan loai / Text chat"| SYS

    style SYS fill:#FFF9C4,stroke:#F57F17,stroke-width:3px
    style ND fill:#E3F2FD,stroke:#1565C0
    style ADM fill:#FCE4EC,stroke:#880E4F
    style GEM fill:#F3E5F5,stroke:#6A1B9A
```

---

## ④ DFD Mức 1 – Tổng Thể

```
flowchart TD
    ND([Nguoi Dung])
    ADM([Admin])
    GEM([Google Gemini AI])

    DS1[("D1\nusers")]
    DS2[("D2\nclassifications")]
    DS3[("D3\nchat_history")]
    DS4[("D4\napi_usage")]
    DS5[("D5\n/uploads/\nFile System")]

    P1(["1.0\nXac Thuc\nNguoi Dung"])
    P2(["2.0\nPhan Loai\nRac Thai"])
    P3(["3.0\nChat\nvoi AI"])
    P4(["4.0\nXem\nLich Su"])
    P5(["5.0\nQuan Tri\nHe Thong"])

    ND -->|"username, password, email"| P1
    P1 <-->|"Truy van / Luu user"| DS1
    P1 -->|"JWT token"| ND

    ND -->|"File anh"| P2
    P2 -->|"Luu file anh"| DS5
    P2 -->|"Anh base64 + prompt"| GEM
    GEM -->|"JSON detections"| P2
    P2 <-->|"Cache / Luu ket qua"| DS2
    P2 -->|"Ghi log"| DS4
    P2 -->|"Ket qua phan loai JSON"| ND

    ND -->|"Tin nhan + lich su chat"| P3
    P3 -->|"Tin nhan + context"| GEM
    GEM -->|"Phan hoi van ban"| P3
    P3 -->|"Luu lich su"| DS3
    P3 -->|"Ghi log"| DS4
    P3 -->|"Phan hoi AI"| ND

    ND -->|"Yeu cau xem lich su"| P4
    P4 <-->|"Truy van lich su"| DS2
    P4 -->|"Danh sach ket qua"| ND

    ADM -->|"Yeu cau thong ke / quan ly"| P5
    P5 <-->|"Truy van tong hop"| DS1
    P5 <-->|"Truy van tong hop"| DS2
    P5 <-->|"Truy van tong hop"| DS3
    P5 <-->|"Truy van tong hop"| DS4
    P5 -->|"Bao cao thong ke"| ADM

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

## ⑤ DFD Mức 2 – Chi Tiết Phân Loại Rác

```
flowchart TD
    ND([Nguoi Dung])
    GEM([Gemini AI])
    DS2[("D2\nclassifications")]
    DS4[("D4\napi_usage")]
    DS5[("D5\n/uploads/")]

    P21(["2.1\nNhan &\nXac nhan file"])
    P22(["2.2\nLuu file\nvao disk"])
    P23(["2.3\nTinh MD5\nhash anh"])
    P24(["2.4\nKiem tra\nCache DB"])
    P25(["2.5\nGoi\nGemini API"])
    P26(["2.6\nXu ly &\nChuan hoa ket qua"])
    P27(["2.7\nLuu ket qua\nvao DB"])
    P28(["2.8\nGhi log\nAPI Usage"])
    P29(["2.9\nTra ket qua\nve client"])

    ND -->|"multipart/form-data"| P21
    P21 -->|"Validated file"| P22
    P22 -->|"Duong dan file"| DS5
    P22 -->|"req.file"| P23
    P23 -->|"MD5 hash"| P24
    P24 <-->|"SELECT WHERE image_hash"| DS2
    P24 -->|"Cache miss – goi AI"| P25
    P24 -->|"Cache hit – dung ket qua cu"| P27
    P25 -->|"base64 + prompt"| GEM
    GEM -->|"Raw JSON string"| P26
    P26 -->|"Parsed + enriched JSON"| P27
    P27 -->|"INSERT classifications"| DS2
    P27 -->|"Ket qua"| P28
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

## ⑥ ERD – Entity Relationship Diagram

```
erDiagram
    USERS {
        int id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        enum role
        tinyint is_active
        varchar avatar
        timestamp created_at
        timestamp last_login
        timestamp updated_at
    }

    CLASSIFICATIONS {
        int id PK
        int user_id FK
        varchar image_path
        varchar image_hash
        varchar original_filename
        longtext result_json
        enum status
        timestamp created_at
    }

    CHAT_HISTORY {
        int id PK
        int user_id FK
        varchar session_id
        text message
        longtext response
        int tokens_used
        timestamp created_at
    }

    API_USAGE {
        int id PK
        varchar endpoint
        int user_id FK
        int tokens_used
        enum status
        varchar ip_address
        timestamp created_at
    }

    USERS ||--o{ CLASSIFICATIONS : "co the co nhieu"
    USERS ||--o{ CHAT_HISTORY : "co the co nhieu"
    USERS ||--o{ API_USAGE : "co the co nhieu"
```

---

## ⑦ Activity Flow – Đăng Ký & Đăng Nhập

```
flowchart TD
    START([Bat dau]) --> CHON{Da co tai khoan?}

    CHON -->|Chua co| DK[Vao trang Dang Ky]
    DK --> NHAP_DK[Nhap username, email, password]
    NHAP_DK --> VAL_DK{Hop le?}
    VAL_DK -->|Khong| ERR_DK[Hien thi loi validation]
    ERR_DK --> NHAP_DK
    VAL_DK -->|Co| POST_REG[POST /api/auth/register]
    POST_REG --> CHECK_DUP{Username/email trung?}
    CHECK_DUP -->|Co| ERR_DUP[Bao loi: da ton tai]
    ERR_DUP --> NHAP_DK
    CHECK_DUP -->|Khong| HASH_PW[Ma hoa mat khau bcrypt]
    HASH_PW --> SAVE_USER[Luu user vao DB]
    SAVE_USER --> GEN_JWT[Tao JWT Token]

    CHON -->|Da co| DN[Vao trang Dang Nhap]
    DN --> NHAP_DN[Nhap username/email + password]
    NHAP_DN --> POST_LOGIN[POST /api/auth/login]
    POST_LOGIN --> CHECK_USER{User ton tai?}
    CHECK_USER -->|Khong| ERR_USER[Bao loi: khong tim thay]
    ERR_USER --> NHAP_DN
    CHECK_USER -->|Co| CHECK_PW{Mat khau khop?}
    CHECK_PW -->|Khong| ERR_PW[Bao loi: sai mat khau]
    ERR_PW --> NHAP_DN
    CHECK_PW -->|Co| UPDATE_LOGIN[Cap nhat last_login]
    UPDATE_LOGIN --> GEN_JWT

    GEN_JWT --> SAVE_TOKEN[Luu JWT vao localStorage]
    SAVE_TOKEN --> REDIRECT[Chuyen ve trang chu]
    REDIRECT --> END_AUTH([Ket thuc])

    style START fill:#C8E6C9
    style END_AUTH fill:#FFCDD2
    style ERR_DK fill:#FFCDD2
    style ERR_DUP fill:#FFCDD2
    style ERR_USER fill:#FFCDD2
    style ERR_PW fill:#FFCDD2
```

---

## ⑧ Activity Flow – Phân Loại Rác Từ Ảnh

```
flowchart TD
    START([Nguoi dung vao /classify]) --> CHON_ANH[Chon / keo tha anh]
    CHON_ANH --> CHECK_FILE{File hop le?\nJPG/PNG/WEBP <= 10MB}
    CHECK_FILE -->|Khong| ERR_FILE[Thong bao loi dinh dang]
    ERR_FILE --> CHON_ANH

    CHECK_FILE -->|Co| PREVIEW[Hien thi preview anh]
    PREVIEW --> BTN_UPLOAD[Nhan Phan Loai]
    BTN_UPLOAD --> LOADING[Hien thi loading spinner]
    LOADING --> POST_IMG[POST /api/classify\nmultipart/form-data]

    POST_IMG --> MULTER[Multer luu file\nvao /uploads/]
    MULTER --> HASH[Tinh MD5 hash]
    HASH --> CHECK_CACHE_MEM{Cache in-memory?}

    CHECK_CACHE_MEM -->|Hit| RETURN_MEM[Tra ket qua tu\nin-memory cache]
    CHECK_CACHE_MEM -->|Miss| CHECK_CACHE_DB{Cache trong DB?}

    CHECK_CACHE_DB -->|Hit| SAVE_NEW[Luu ban ghi moi\nvoi ket qua cu]
    SAVE_NEW --> LOG_CACHED[Ghi api_usage: cached]
    LOG_CACHED --> RETURN_DB[Tra ket qua cached]

    CHECK_CACHE_DB -->|Miss| CALL_GEMINI[Goi Google Gemini AI\nbase64 anh + prompt]
    CALL_GEMINI --> GEMINI_OK{Gemini thanh cong?}

    GEMINI_OK -->|Khong| ERR_GEMINI[Bao loi: khong the ket noi AI]
    ERR_GEMINI --> SAVE_FAIL[Luu status=failed]

    GEMINI_OK -->|Co| PARSE_JSON[Parse JSON response]
    PARSE_JSON --> ENRICH[Gan them thong tin\nloai rac va mau sac]
    ENRICH --> SAVE_RESULT[Luu vao classifications DB]
    SAVE_RESULT --> LOG_SUCCESS[Ghi api_usage: success]
    LOG_SUCCESS --> RETURN_NEW[Tra ket qua moi]

    RETURN_MEM --> RENDER
    RETURN_DB --> RENDER
    RETURN_NEW --> RENDER

    RENDER[Hien thi ket qua:\n- Bounding boxes\n- Thong tin tung vat pham\n- Huong dan tai che]
    RENDER --> END([Ket thuc])

    style START fill:#C8E6C9
    style END fill:#FFCDD2
    style ERR_FILE fill:#FFCDD2
    style ERR_GEMINI fill:#FFCDD2
    style RETURN_MEM fill:#E1F5FE
    style RETURN_DB fill:#E1F5FE
    style RETURN_NEW fill:#F3E5F5
```

---

## ⑨ Activity Flow – Chat AI

```
flowchart TD
    START([Nguoi dung vao /chat]) --> LOAD_HISTORY[Tai lich su chat]
    LOAD_HISTORY --> WELCOME[Hien thi tin nhan chao mung]
    WELCOME --> NHAP_MSG[Nguoi dung go tin nhan]
    NHAP_MSG --> CHECK_EMPTY{Tin nhan rong?}
    CHECK_EMPTY -->|Co| NHAP_MSG
    CHECK_EMPTY -->|Khong| SEND_BTN[Nhan Gui / Enter]
    SEND_BTN --> SHOW_USER[Hien thi tin nhan nguoi dung]
    SHOW_USER --> SHOW_TYPING[Hien thi trang thai AI dang go...]
    SHOW_TYPING --> POST_CHAT[POST /api/chat\n{message, history}]
    POST_CHAT --> BUILD_HIST[Xay dung lich su\ntheo dinh dang Gemini]
    BUILD_HIST --> CALL_AI[Goi Gemini AI\nstartChat + sendMessage]
    CALL_AI --> AI_OK{Thanh cong?}
    AI_OK -->|Khong, rate limit| ERR_RATE[Bao loi: qua gioi han, vui long cho]
    ERR_RATE --> NHAP_MSG
    AI_OK -->|Khong, loi khac| ERR_AI[Bao loi ket noi AI]
    ERR_AI --> NHAP_MSG
    AI_OK -->|Co| SAVE_CHAT[Luu vao chat_history DB]
    SAVE_CHAT --> RETURN_RESP[Tra ve response + tokens]
    RETURN_RESP --> SHOW_AI[Hien thi phan hoi AI]
    SHOW_AI --> UPDATE_HIST[Cap nhat lich su chat local]
    UPDATE_HIST --> TIEP_TUC{Tiep tuc chat?}
    TIEP_TUC -->|Co| NHAP_MSG
    TIEP_TUC -->|Khong| END([Ket thuc])

    style START fill:#C8E6C9
    style END fill:#FFCDD2
    style ERR_RATE fill:#FFCDD2
    style ERR_AI fill:#FFCDD2
    style SHOW_AI fill:#F3E5F5
```

---

## ⑩ Activity Flow – Admin Dashboard

```
flowchart TD
    START([Admin truy cap /admin]) --> CHECK_JWT{JWT ton tai?}
    CHECK_JWT -->|Khong| REDIR_LOGIN[Chuyen huong /login]
    REDIR_LOGIN --> END_REDIR([Ket thuc])
    CHECK_JWT -->|Co| CHECK_ROLE{role = admin?}
    CHECK_ROLE -->|Khong| ERR_PERM[Loi 403 Khong co quyen]
    ERR_PERM --> REDIR_HOME[Chuyen huong /]
    REDIR_HOME --> END_PERM([Ket thuc])
    CHECK_ROLE -->|Co| LOAD_DASHBOARD[Tai Admin Dashboard]

    LOAD_DASHBOARD --> TAB{Chon tab}

    TAB -->|Dashboard| GET_STATS[GET /api/admin/stats]
    GET_STATS --> SHOW_STATS[Hien thi:\n- Tong users\n- Tong phan loai\n- Tong chat\n- Hom nay]

    TAB -->|Users| GET_USERS[GET /api/admin/users]
    GET_USERS --> SHOW_USERS[Danh sach users voi phan trang]
    SHOW_USERS --> USER_ACTION{Hanh dong?}
    USER_ACTION -->|Xem| VIEW_USER[Chi tiet user]
    USER_ACTION -->|Khoa/Mo| TOGGLE_USER[PATCH /api/admin/users/:id]

    TAB -->|Anh| GET_IMAGES[GET /api/admin/images]
    GET_IMAGES --> SHOW_IMAGES[Danh sach anh + ket qua phan loai]
    SHOW_IMAGES --> IMG_ACTION{Hanh dong?}
    IMG_ACTION -->|Xem| VIEW_IMG[Chi tiet phan loai]
    IMG_ACTION -->|Xoa| DEL_IMG[DELETE /api/admin/images/:id]

    TAB -->|AI Stats| GET_AI[GET /api/admin/ai-stats]
    GET_AI --> SHOW_AI[Thong ke:\n- Phan loai theo loai rac\n- Token tieu thu\n- Cache hit rate]

    SHOW_STATS --> END([Ket thuc])
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
