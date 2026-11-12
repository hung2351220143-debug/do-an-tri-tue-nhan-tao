# Implementation Plan — EcoScan UI Upgrade

## Context nhanh

- **Framework**: Vue 3 + Tailwind CSS 3 + Vite
- **CSS globals**: `src/style.css` — chứa các class dùng lại: `btn-primary`, `btn-secondary`, `card`, `card-glass`, `input-field`, `glass`, `gradient-text`, `hover-lift`, `chat-bubble-user`, `chat-bubble-ai`, `skeleton`, `.blob`
- **Tailwind config**: `tailwind.config.js` — custom palette `primary.*` (sky), `eco.*`, animations đầy đủ (`animate-float`, `animate-shimmer`, `animate-gradient-shift`, `animate-morph-blob`, `animate-pulse-glow`, `animate-text-shimmer`, `animate-fade-in-up`, `animate-scale-in` v.v.)
- **Build command**: `npm run build` (Vite)
- **Dev command**: `npm run dev`
- **KHÔNG đụng** vào `<script setup>`, router, store, config. Chỉ sửa `<template>` và `<style scoped>` (nếu cần) của từng file.
- **KHÔNG đổi** màu trong `CATEGORY_INFO` / `CATEGORY_COLORS` và tên class `btn-primary`, `btn-secondary`, `card`, `input-field`.

---

## Thứ tự ưu tiên

1. `Home.vue` — trang ấn tượng nhất, showcase toàn bộ bộ nhận dạng thương hiệu mới
2. `Login.vue` + `Register.vue` — giao diện split-layout, xử lý cùng lúc vì pattern giống nhau
3. `Classify.vue` — nâng cấp drop-zone, kết quả animate
4. `Chat.vue` — nâng cấp bubble, input, container
5. `History.vue` — tabs pill, cards overlay, modal header gradient
6. `Profile.vue` — avatar ring, tabs gradient, stats cards
7. Admin files (`Dashboard.vue`, `Users.vue`, `Images.vue`, `Ratings.vue`, `Feedbacks.vue`, `AppConfig.vue`)

---

## Items

- [ ] 1. **Home.vue — Toàn bộ template nâng cấp**

  **Mô tả**: Viết lại `<template>` của `Home.vue` — không thay đổi bất kỳ dòng nào trong `<script setup>`.

  **Chi tiết từng section**:

  **Hero section** (thay thế section hiện tại):
  - Nền: giữ `bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900`
  - Blob 1 (trái trên): `w-96 h-96 bg-cyan-400/20 animate-morph-blob` (hiện chỉ là `animate-float`)
  - Blob 2 (phải dưới): `w-80 h-80 bg-sky-400/15 animate-morph-blob` với `animation-delay: 3s`
  - Blob 3 (giữa): `w-[700px] h-[700px] bg-indigo-500/8 animate-float`
  - Badge "AI-Powered": đổi text thành "AI-Powered · Gemini", thêm `animate-pulse-glow` cho dot, icon `Zap`, border `border-sky-400/40`, chữ `text-sky-300`
  - `<h1>`: tách "PHÂN LOẠI RÁC THẢI" thành dòng riêng với class `gradient-text text-5xl lg:text-7xl font-black tracking-tight`, bọc thêm `animate-text-shimmer`; "Thông Minh" giữ trên dòng khác
  - Description: `text-sky-100/80` — không đổi
  - Button "Bắt đầu phân loại": thêm `group relative overflow-hidden` và `<span>` shine overlay (`absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700`)
  - Button "Hỏi AI về rác thải": thêm `hover:scale-[1.02]`
  - Thêm **Stats bar** mới ngay dưới 2 nút CTA: `flex flex-wrap gap-6 justify-center mt-8` với 3 item dạng `flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 px-4 py-2 rounded-full`: [`🗑️ 8 Loại rác`], [`⚡ AI Real-time`], [`💚 Miễn phí 100%`]

  **Waste Types section** (nền trắng, giữ nguyên):
  - Mỗi card: thêm `style="perspective: 1000px"` cho wrapper, thêm `@mouseenter="e => tiltCard(e)"` + `@mouseleave="resetTilt"` → viết 2 function inline trong `<script setup>` — **KHÔNG**, thay vào đó dùng CSS thuần: thêm `hover:rotate-1 hover:-translate-y-2 hover:shadow-sky-md` trên card div
  - Icon container: tăng từ `w-14 h-14` lên `w-16 h-16 text-4xl`, thêm `ring-2 ring-offset-2` với màu từ `type.color`
  - Border gradient: thêm `style="border: 1px solid {{ type.color }}30"` (inline style với opacity 30)
  - Section title: thêm `gradient-text-static` cho "8 loại rác" trong subtitle

  **Features section** (nền `from-gray-50 to-white`):
  - Mỗi feature card: đổi `colorMap` icon background sang gradient thực sự:
    - green → `bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-600` (giữ nguyên vì đang là sky-100)
    - blue → `bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600`
    - purple → `bg-gradient-to-br from-purple-100 to-violet-100 text-purple-600`
    - orange → `bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600`
  - Mỗi card thêm `group` class, icon container thêm `group-hover:scale-110 transition-transform duration-300`
  - Card hover: đã có `hover-lift` từ `.card` global, thêm `group-hover:shadow-sky-md`

  **How it works section** (nền trắng):
  - Layout: đổi sang `relative` wrapper với `::before` line kết nối — dùng inline Tailwind: thêm `<div class="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-sky-200 via-sky-400 to-sky-200" />` ở giữa 3 cards
  - Số step: xóa số 5xl opacity-20 hiện tại, thay bằng badge tròn `w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center mx-auto mb-3`
  - Icon box: thêm `animate-pulse-glow` khi hover (dùng `group-hover:animate-pulse-glow`)

  **Download section** (giữ nền `from-gray-900 to-gray-800`):
  - Card iOS: thêm `hover:border-white/40 hover:bg-white/15` transition
  - Card Android: đổi nền từ `bg-sky-600/80` sang `bg-gradient-to-br from-sky-500 to-blue-600 border-sky-400/50`, thêm shine effect trên button tải APK
  - Thêm icon `Smartphone`/`TabletSmartphone` có shadow trong background tròn

  **Ratings section** (nền trắng):
  - Review cards: thêm `border-2 border-transparent hover:border-sky-100` transition
  - Avatar circle: đổi `bg-sky-100` sang `bg-gradient-to-br from-sky-100 to-blue-100`
  - Star bars (phân bổ theo sao): thêm `rounded-full` cho track, height tăng lên `h-2.5`
  - "Phân loại & đánh giá ngay" CTA button: thêm shine hover effect giống btn-primary

  **CTA section** (cuối trang, giữ gradient animated):
  - Thêm `bg-size-200` class để gradientShift animation hoạt động đúng
  - Button lớn thêm `shadow-lift hover:shadow-xl`
  - Thêm 3 floating particles nhỏ `w-3 h-3 bg-white/20 rounded-full animate-float` ở góc

  **Files**: `src/pages/Home.vue`

  **Verify**: `npm run build` — không có lỗi build. Mở `npm run dev` và kiểm tra trang chủ trên browser.

---

- [ ] 2. **Login.vue + Register.vue — Split layout & enhanced form**

  **Mô tả**: Đổi layout từ centered card → split 2 cột (50/50 trên desktop, stacked trên mobile). Không thay đổi `<script setup>`.

  **Login.vue — Template changes**:

  Đổi outer div thành `min-h-[calc(100vh-64px)] grid lg:grid-cols-2`:

  - **Cột trái** (hero visual, ẩn trên mobile `hidden lg:flex`):
    ```
    bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900
    flex flex-col items-center justify-center p-12 relative overflow-hidden
    ```
    Nội dung: 3 blobs `animate-morph-blob`, icon Leaf to `w-24 h-24` trên nền gradient tròn `animate-pulse-glow`, text "Chào mừng trở lại" `text-4xl font-black text-white`, mô tả ngắn `text-sky-200/80`, 3 bullet points với icon check (✓ Miễn phí, ✓ AI thông minh, ✓ Bảo mật)

  - **Cột phải** (form):
    ```
    bg-gradient-to-br from-slate-50 to-sky-50/30
    flex items-center justify-center p-6 lg:p-12
    ```
    Form card: `bg-white rounded-3xl shadow-lift border border-sky-100/50 p-8 w-full max-w-md animate-fade-in-up`

  - Input fields: thêm icon trái cho mỗi field:
    - Email: `<Mail :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />` + `pl-9` trên input
    - Password: icon đã có eye toggle, thêm `<Lock :size="16">` bên trái tương tự + `pl-9 pr-10`
  - Import thêm `Mail, Lock` từ `lucide-vue-next` — **KHÔNG đổi script**, thêm icons trực tiếp trong template bằng inline SVG hoặc dùng lucide components đã được import sẵn. Kiểm tra: `Mail` và `Lock` chưa được import trong Login.vue → **cần thêm vào import** trong `<script setup>`. Đây là thay đổi import duy nhất được phép (không thay đổi logic).
  - Button submit: đã dùng `btn-primary`, thêm `relative overflow-hidden group` và shine span bên trong
  - Demo admin hint: đổi `code` tag sang card glassmorphism nhỏ đẹp hơn

  - Mobile fallback: khi ở mobile, cột trái ẩn, outer div đổi thành `min-h-[calc(100vh-64px)] bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900 flex items-center justify-center`

  **Register.vue — Template changes** (pattern tương tự):
  - Cột trái: thay đổi text thành "Tạo tài khoản mới", mô tả, bullets
  - Password strength indicator: thêm icon emoji/label phù hợp hơn, bar tăng chiều cao lên `h-2.5`, thêm label bên phải (ký tự hiện tại / 8+)
  - Confirm password: khi khớp, animation `CheckCircle` có `animate-scale-in text-sky-500`
  - Import thêm `Mail, Lock, User` (icon người dùng) cho các input fields
  - Form structure: giống Login

  **Files**: `src/pages/Login.vue`, `src/pages/Register.vue`

  **Verify**: `npm run build` — không lỗi. Kiểm tra `/login` và `/register` trên browser desktop + mobile.

---

- [ ] 3. **Classify.vue — Drop zone, camera, kết quả nâng cấp**

  **Mô tả**: Nâng cấp template của trang phân loại. Không đụng script.

  **Drop zone**:
  - Hiện tại: `border-2 border-dashed rounded-2xl p-12`
  - Thêm khi idle: animated gradient border bằng CSS trick — bọc div drop-zone trong `relative` wrapper, thêm pseudo-element via scoped style hoặc dùng Tailwind: `ring-2 ring-dashed ring-sky-200 hover:ring-sky-400 transition-all`
  - Thay `border-gray-200` khi bình thường thành `border-sky-200/60`
  - Khi drag over (`dragOver = true`): đã có `border-sky-400 bg-gradient-to-br from-sky-50 to-blue-50 shadow-sky-sm`, thêm `ring-4 ring-sky-300/30`
  - Icon Upload: thêm `group-hover:animate-bounce` (đổi `group-hover:scale-110` thành bounce)
  - Thêm đường kẻ animated border: `<div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"><div class="absolute inset-0 rounded-2xl animate-shimmer" style="background: linear-gradient(90deg, transparent, rgba(14,165,233,0.08), transparent); background-size: 200% 100%" /></div>` bọc ngoài drop zone

  **Camera button**:
  - Đổi `btn-secondary` → thêm `bg-gradient-to-r from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20` inline hoặc class bổ sung

  **Summary card** (kết quả, `border-l-4 border-sky-500`):
  - Đổi từ `from-sky-50/50 to-transparent` sang `from-sky-50 to-blue-50/30`
  - Thêm `shadow-sm` và `rounded-2xl overflow-hidden`
  - Số "phát hiện X vật phẩm": badge `bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-bold`

  **Detection items** (chi tiết từng vật phẩm):
  - Mỗi item card: thêm `hover:shadow-md` và `border border-gray-100` rõ hơn
  - Confidence bar: thêm animated fill — khi `selectedItem === i` hiển thị, thêm `<div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div class="h-full rounded-full transition-all duration-1000" :style="{ width: (item.confidence*100)+'%', backgroundColor: catInfo(item.category).color }" /></div>`
  - `recyclingMethod` box: đổi `bg-sky-50` sang `bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-200/60`

  **Rating widget**:
  - Stars hover: thêm `drop-shadow-md` khi filled
  - Button gửi đánh giá: thêm shine effect khi enabled

  **Files**: `src/pages/Classify.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 4. **Chat.vue — Container, bubbles, input nâng cấp**

  **Mô tả**: Nâng cấp visual của trang chat. Không đụng script.

  **Outer page wrapper** (`max-w-4xl`):
  - Giữ nguyên layout, thêm nhẹ background: đổi body area thành relative, thêm `<div class="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-sky-50/20 to-blue-50/10 pointer-events-none" />`

  **Chat container** (`glass rounded-2xl border border-gray-100/80`):
  - Đổi border từ `border-gray-100/80` sang `border-sky-100/60`
  - Thêm `shadow-[0_4px_30px_rgba(14,165,233,0.08)]`

  **Empty state suggestions**:
  - Suggestion chips: đổi `from-sky-50 to-blue-50` sang `from-sky-50/80 to-blue-50/80 hover:from-sky-100 hover:to-blue-100`, thêm `hover:shadow-sm`

  **Bubbles user** (`chat-bubble-user` class — defined in style.css):
  - Đây là global class, **không sửa** style.css trực tiếp nếu có thể tránh
  - Thay vào đó, override bằng `<style scoped>` trong Chat.vue: `.chat-bubble-user { box-shadow: 0 4px 15px rgba(14,165,233,0.35), 0 1px 3px rgba(14,165,233,0.2); }`

  **Bubble AI** (`chat-bubble-ai`):
  - Override trong scoped style: `backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(14,165,233,0.08); border-color: rgba(14,165,233,0.12);`

  **Typing indicator dots**: tăng từ `w-2 h-2` lên `w-2.5 h-2.5`, đổi màu từ `bg-sky-400` sang gradient (dùng inline style: `background: linear-gradient(135deg, #38bdf8, #0ea5e9)`)

  **Input area** (bottom):
  - Wrapper `p-4 border-t border-gray-100 bg-gray-50/50`: đổi thành `bg-white/60 backdrop-blur-sm border-sky-100/50`
  - Textarea: đã dùng `input-field`, thêm `rounded-2xl` (input-field đã có `rounded-xl`, override nhẹ)
  - Send button: đổi từ `style="background: linear-gradient(135deg, #22c55e, #16a34a)"` → `background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%)` (đồng bộ màu sky thay vì xanh lá)
  - Thêm wrapper `rounded-2xl border border-sky-100/40` quanh input+button khi focus (dùng CSS `focus-within`)

  **Files**: `src/pages/Chat.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 5. **History.vue — Tabs pill, cards overlay, modal gradient**

  **Mô tả**: Nâng cấp tabs, cards, và modal header. Không đụng script.

  **Tabs**:
  - Wrapper: đổi `bg-gray-50/80` sang `bg-white border border-sky-100/50 shadow-sm`
  - Active tab: thêm gradient `bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-sky-sm` thay vì `bg-white shadow-sm text-sky-700`
  - Inactive tab: `text-gray-500 hover:text-sky-600 hover:bg-sky-50/50`

  **Classification cards grid**:
  - Badge "Hoàn thành": đổi từ `bg-sky-500` sang `bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm`, thêm `font-semibold text-xs px-2.5 py-1`
  - Overlay hover: thêm gradient overlay từ `bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100`
  - "Xem chi tiết" chip: thêm gradient `bg-gradient-to-r from-sky-500/90 to-blue-500/90`
  - Card border hover: đã có `hover:border-sky-200`, thêm `hover:shadow-sky-sm`

  **Chat sessions list** (cột trái):
  - Active session: đổi từ `border-sky-500 bg-gradient-to-r from-sky-50/80 to-blue-50/50` sang thêm `shadow-sky-sm`
  - User "U" avatar: đổi sang gradient `bg-gradient-to-br from-sky-400 to-blue-600`

  **Modal** (detail item):
  - Header modal: thêm gradient top strip `<div class="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 rounded-t-2xl" />` ngay dưới div `sticky`
  - Summary box: đổi `bg-sky-50 border-sky-200` sang `bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-200/60`
  - Detection items trong modal: thêm `hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200`

  **Files**: `src/pages/History.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 6. **Profile.vue — Avatar ring, tabs gradient, stats cards**

  **Mô tả**: Nâng cấp visual profile. Không đụng script.

  **Avatar section card**:
  - Gradient top bar: đổi `h-1 bg-gradient-to-r from-sky-500 to-blue-500` thành `h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500`
  - Avatar ring: đổi `ring-4 ring-sky-100 ring-offset-2` sang `ring-4 ring-gradient` — Tailwind không hỗ trợ ring gradient natively, dùng workaround: bọc avatar trong `p-0.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600`, bên trong có `rounded-full overflow-hidden bg-white p-0.5`
  - Camera button: thêm `animate-pulse-glow` trên hover

  **Tabs**:
  - Active tab: đổi từ `bg-gradient-to-r from-white to-green-50/50` sang `bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-sm` (nhất quán với History tabs)
  - Inactive: `text-gray-500 hover:bg-sky-50/50 hover:text-sky-600`
  - Xóa class `to-green-50/50` (đây là màu xanh lá không đồng bộ)

  **Stats cards** (trong tab "Thông tin"):
  - Card "Lần phân loại": đổi `from-sky-50 to-blue-50 border-sky-100` → thêm `shadow-sm`, icon Camera nhỏ
  - Card "Câu hỏi AI": đổi `from-blue-50 to-sky-50` → thêm `shadow-sm`, icon MessageCircle nhỏ
  - Card "Tham gia từ": đổi `bg-purple-50` → `bg-gradient-to-br from-purple-50 to-violet-50/50 border border-purple-100`, thêm icon Calendar nhỏ
  - Số liệu: tăng font size từ `text-2xl` lên `text-3xl font-extrabold`

  **Security tab** (đổi mật khẩu):
  - Mỗi password input: thêm icon Lock bên trái (tương tự Login.vue) + `pl-9`
  - Import `Lock` — nó đã có trong imports của Profile.vue ✓

  **Feedback tab**:
  - Form card gradient top strip: giữ nguyên
  - Status badge trong lịch sử: đẹp hơn với `px-3 py-1.5 rounded-full text-xs font-semibold`

  **Files**: `src/pages/Profile.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 7. **Admin — Dashboard.vue: Stats cards colorful gradient**

  **Mô tả**: Nâng cấp Dashboard admin. Không đụng script.

  **Stat cards** (4 cards grid):
  - Đổi từ `bg-white rounded-2xl border border-gray-100` sang từng màu riêng:
    - Users (blue): `bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]`
    - Phân loại (green): `bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sky-md`
    - Chat AI (purple): `bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.3)]`
    - API hôm nay (orange): `bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-[0_4px_20px_rgba(251,146,60,0.3)]`
  - Text màu: label `text-white/70`, value `text-white text-4xl`, sub `text-white/60`
  - Icon background: `bg-white/20 rounded-xl` (thay vì các bg-*-50)
  - Icon color: `text-white` cho tất cả (thay vì text-*-600)
  - Hover: `hover:scale-[1.02] hover:shadow-lg transition-all duration-200`

  **Daily stats chart** (bar chart 7 ngày):
  - Bars: đổi `bg-green-500` sang `bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg`
  - Wrapper card: thêm `border border-sky-100/50 shadow-sm`
  - Header icon: đổi `text-green-600` sang `text-sky-600`

  **Category distribution**:
  - Giữ nguyên màu theo category (nghiệp vụ, không đổi)
  - Bars: thêm `rounded-full` và transition
  - Header icon: đổi `text-blue-600` sang `text-sky-600`
  - Số phần trăm: badge `bg-gray-100 px-2 py-0.5 rounded-full text-xs`

  **Loading spinner**: đổi `border-green-500` → `border-sky-500`

  **Files**: `src/pages/admin/Dashboard.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 8. **Admin — Users.vue: Table đẹp hơn, badge role có màu**

  **Mô tả**: Nâng cấp bảng Users. Không đụng script.

  **Search bar**:
  - Wrapper: đổi `bg-white rounded-2xl border border-gray-100` → thêm `shadow-sm`
  - Input focus ring: đổi `focus:ring-green-500` → `focus:ring-sky-400`

  **Table header**:
  - `bg-gray-50` → `bg-gradient-to-r from-sky-50/50 to-blue-50/30`
  - `border-b border-gray-100` → `border-b border-sky-100/50`

  **Table rows**:
  - `hover:bg-gray-50` → `hover:bg-sky-50/30`
  - Row hiện tại (user đang login): `bg-green-50/30` → `bg-sky-50/50`
  - Avatar circle: admin `bg-purple-600`, user đang là `bg-green-600` → đổi thành `bg-gradient-to-br from-sky-400 to-blue-600`

  **Role badge** (`badge` class):
  - Class `badge` chưa được định nghĩa trong style.css — kiểm tra: **không có `.badge` global** → inline class hiện tại là `text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1`
  - Admin badge: đổi `bg-purple-100 text-purple-700` → thêm `border border-purple-200` + `font-semibold`
  - User badge: `bg-blue-100 text-blue-700` → `bg-sky-100 text-sky-700 border border-sky-200`

  **Status badge**:
  - Active: `bg-green-100 text-green-700` → thêm `border border-green-200`
  - Locked: `bg-red-100 text-red-700` → thêm `border border-red-200`

  **Action buttons**: thêm `rounded-lg hover:bg-gray-100` base, các màu giữ nguyên

  **Pagination**: đổi `btn-secondary` actions → đẹp hơn với explicit `px-3 py-1.5` gradient subtle

  **Files**: `src/pages/admin/Users.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 9. **Admin — Images.vue: Grid ảnh, overlay info**

  **Mô tả**: Nâng cấp grid ảnh admin. Không đụng script.

  **Image cards**:
  - `bg-white rounded-2xl border border-gray-100 shadow-sm` → thêm `group overflow-hidden`
  - Thumbnail area: thêm `group-hover:scale-105 transition-transform duration-500` trên `<img>`
  - Overlay trên ảnh khi hover: thêm `<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"><p class="text-white text-xs font-medium truncate">{{ img.original_filename }}</p></div>`
  - Status badge: thêm `shadow-sm` và `font-semibold`

  **Modal preview**:
  - Modal header: thêm gradient strip `<div class="h-1 bg-gradient-to-r from-sky-400 to-blue-500 rounded-t-2xl" />`
  - Info section: `text-sm text-gray-600` → dạng key-value grid đẹp hơn `grid grid-cols-2 gap-2`

  **Loading**: đổi `text-green-500` → `text-sky-500`

  **Files**: `src/pages/admin/Images.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 10. **Admin — Ratings.vue: Star display, conversation style**

  **Mô tả**: Nâng cấp Ratings admin. Không đụng script.

  **Header stats nhanh**:
  - Sao TB box: thêm gradient `bg-gradient-to-br from-yellow-50 to-amber-50`
  - Tổng box: thêm `bg-gradient-to-br from-blue-50 to-sky-50`

  **Star filter buttons**:
  - Active: đổi `bg-yellow-500` → `bg-gradient-to-r from-yellow-400 to-amber-500 shadow-sm`
  - Hover inactive: đổi `hover:border-yellow-300` → `hover:border-yellow-300 hover:bg-yellow-50/50`

  **Danh sách trái**:
  - Selected item: `border-yellow-400 bg-yellow-50` → `border-sky-400 bg-gradient-to-r from-sky-50/80 to-blue-50/30 shadow-sky-sm`
  - Avatar initials: đổi `text-gray-600` → gradient bg nhỏ

  **Chi tiết phải**:
  - Header: thêm gradient top strip `h-1 bg-gradient-to-r from-sky-400 to-blue-500`
  - User bubble (đánh giá gốc): đổi `bg-blue-50` → `bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-100/50`
  - Admin reply bubble: đổi `bg-green-50 border-green-200` → `bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200`
  - Nút "Lưu chỉnh sửa": `bg-yellow-500 hover:bg-yellow-600` → giữ nguyên (màu vàng OK cho chỉnh sửa)
  - Nút "Gửi phản hồi": đổi `bg-green-600 hover:bg-green-700` → `bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-sm`

  **Files**: `src/pages/admin/Ratings.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 11. **Admin — Feedbacks.vue: Chat-style, filter tabs đẹp hơn**

  **Mô tả**: Nâng cấp Feedbacks admin. Không đụng script.

  **Filter tabs** (hiện là underline border-b):
  - Đổi thành pill style: bọc trong `flex gap-1 bg-gray-50 p-1 rounded-2xl border border-gray-100 w-fit mb-5`
  - Active: `bg-white shadow-sm text-sky-700 font-semibold rounded-xl px-4 py-2`
  - Inactive: `text-gray-500 hover:bg-white/50 hover:text-gray-700 px-4 py-2 rounded-xl`
  - Badge "chưa đọc" trong tab: `bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full ml-1`
  - Xóa `border-b border-gray-200` wrapper cũ

  **Danh sách trái**:
  - Selected: `border-green-500 bg-green-50` → `border-sky-500 bg-gradient-to-r from-sky-50/80 to-blue-50/30 shadow-sky-sm`
  - Status badge pending: `bg-red-100 text-red-600` → thêm `border border-red-200`
  - Status badge replied: `bg-green-100 text-green-700` → `bg-sky-100 text-sky-700 border border-sky-200`

  **Chi tiết phải**:
  - Header: thêm gradient top strip `h-1 bg-gradient-to-r from-sky-400 to-blue-500`
  - User message bubble: đổi `bg-blue-50` → `bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-100/50`
  - Admin reply bubble: đổi `bg-green-50 border-green-200` → `bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200`
  - Admin reply header "Admin trả lời": đổi `text-green-700` → `text-sky-700`
  - Reply button: `bg-green-600` → `bg-gradient-to-r from-sky-500 to-blue-600`

  **"Chưa đọc" badge header**: `bg-red-500 animate-pulse` → giữ nguyên (cần nổi bật)

  **Files**: `src/pages/admin/Feedbacks.vue`

  **Verify**: `npm run build` — không lỗi.

---

- [ ] 12. **Admin — AppConfig.vue: Form sạch hơn, icon sections**

  **Mô tả**: Nâng cấp AppConfig. Không đụng script.

  **Logo section**:
  - Card wrapper: thêm `shadow-sm border-sky-100/50`
  - Logo icon header (`from-sky-400 to-sky-500` gradient): giữ nguyên đã đẹp
  - Logo preview box: đổi `border-2 border-sky-200 bg-sky-50` → `ring-4 ring-sky-200/50 ring-offset-2 border-2 border-sky-200`
  - "Chọn logo mới" button: đã dùng `btn-primary` ✓
  - "Lưu logo" button: đổi `from-sky-500 to-blue-600` (đồng bộ)

  **iOS section**:
  - Header icon bg `bg-gray-900` → `bg-gradient-to-br from-gray-800 to-gray-900`
  - Section card: `border border-gray-200` → `border border-sky-100/50 shadow-sm`
  - Preview link box: `bg-gray-50 border-gray-200` → `bg-sky-50/50 border-sky-200/60`

  **Android section**:
  - Header icon `bg-green-600` → `bg-gradient-to-br from-sky-500 to-blue-600` (đồng bộ màu, không dùng xanh lá nữa)
  - Section card: `border-sky-100/50 shadow-sm`

  **Cài đặt chung**:
  - Đổi `text-green-600` (icon Settings) → `text-sky-600`
  - Input select: focus ring `focus:ring-sky-400`

  **Hướng dẫn box** (amber):
  - Giữ nguyên amber (là cảnh báo/info, OK)
  - Link "pwabuilder.com": `text-blue-600` → `text-sky-600`

  **Nút Lưu** (cuối trang):
  - Đổi `bg-green-600 hover:bg-green-700` → `bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-sm`

  **Loading spinner**: `text-green-500` → `text-sky-500`

  **Files**: `src/pages/admin/AppConfig.vue`

  **Verify**: `npm run build` — không lỗi.

---

## Quy tắc xuyên suốt cho Coder

1. **Chỉ sửa `<template>` và nếu cần thiết thêm `<style scoped>`.** Không sửa `<script setup>` ngoại trừ thêm `import` icon Lucide còn thiếu.
2. **CATEGORY_INFO và CATEGORY_COLORS: không thay đổi.** Màu loại rác là màu nghiệp vụ.
3. **Class names `btn-primary`, `btn-secondary`, `card`, `input-field`, `glass`, `gradient-text`, `hover-lift`, `chat-bubble-user`, `chat-bubble-ai`, `skeleton`, `blob`** không đổi ý nghĩa trong `style.css`.
4. Tất cả màu xanh lá (`green-*`) trong admin phải được đổi thành màu sky-blue tương đương (`sky-*` hoặc `blue-*`). Trừ màu category rác `organic` (#4CAF50) — giữ nguyên.
5. Animations đã có sẵn trong `tailwind.config.js`: `animate-float`, `animate-shimmer`, `animate-gradient-shift`, `animate-morph-blob`, `animate-pulse-glow`, `animate-text-shimmer`, `animate-fade-in-up`, `animate-scale-in`, `animate-rotate-in`, `animate-count-up`, `animate-bounce-dot`, `animate-slide-left`, `animate-slide-right` — dùng trực tiếp.
6. Sau mỗi file, chạy `npm run build` và xác nhận không có compile errors trước khi sang file tiếp theo.
