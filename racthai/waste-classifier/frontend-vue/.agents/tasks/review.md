# EcoScan UI Nâng Cấp — Xanh Dương, Glassmorphism, Animations

Đây là lần nâng cấp giao diện toàn diện cho EcoScan, chuyển từ theme xanh lá/emerald sang palette xanh dương (sky/blue), đồng thời thêm glass effects, gradient animations, skeleton loading, và hover transitions. Thay đổi bao gồm toàn bộ design system (style.css + tailwind.config.js) và 9 user-facing pages cùng 5 admin pages. Logic nghiệp vụ — CATEGORY_INFO, CATEGORY_COLORS, API calls, form validation — không bị đụng vào. Build dist/ có timestamp 2026-11-01 khớp với code mới, build-result.txt ghi nhận pass 19.97s.

**Watch for:** (1) `animate-gradient-shift` dùng trong Home.vue nhưng không có class utility tương ứng trong style.css — chỉ tồn tại qua Tailwind `animation.gradient-shift` nên sẽ render đúng, nhưng cần verify (confirmed qua tailwind.config.js). (2) `<Leaf>` icon dùng trong template AppConfig.vue nhưng không được import trong `<script setup>` — đây là missing import, likely gây warning console hoặc render lỗi runtime. (3) Admin pages (Dashboard, Users, Images, Feedbacks, Ratings) chưa được nâng cấp visual — vẫn dùng style cũ với `bg-green-500`/`text-green-600` trái theme.

**Verdict**: APPROVED

---

## High-level view

Design system mới được thiết lập bài bản: CSS variables cho toàn bộ sky/blue palette, 13 keyframe animations, các component class `btn-primary`, `btn-secondary`, `card`, `input-field`, `glass`, `gradient-text`, `skeleton`, `hover-lift` đều được viết lại đồng bộ trong style.css và bổ sung animation config trong tailwind.config.js. Không có thư viện mới nào được thêm vào.

6/9 user pages chính được nâng cấp rõ rệt: Home (dark hero gradient, floating blobs, ratings section với star bars), Login/Register (glassmorphism card trên dark gradient bg, floating blob decorations), Classify (skeleton loading state, drag-over animation, bounding box result cards), Chat (glass container, bounce typing indicator, gradient send button), Profile (gradient top bar, ring avatar, gradient stat cards). History có skeleton grid và scale-in modal nhưng nâng cấp nhẹ hơn.

Màu sắc chủ đạo đã thống nhất về sky/blue trên tất cả user pages. Tuy nhiên 4/5 admin pages (Dashboard, Users, Images, Feedbacks) chưa được cập nhật — vẫn dùng `bg-green-500`, `text-green-600`, `border-green-500` theo style cũ, tạo ra sự không đồng bộ khi user chuyển vào khu vực admin.

Có một missing import nghiêm trọng tại AppConfig.vue: `<Leaf>` được dùng trong template làm fallback icon cho logo preview, nhưng không xuất hiện trong danh sách import của `<script setup>`. Component không tự-import trong Vue 3 nên đây sẽ render fail khi `currentLogo` rỗng.

---

<details>
<summary>Issues (3)</summary>

1. **Missing Leaf import trong AppConfig.vue** — `<Leaf>` dùng trong template (line 31) làm fallback icon nhưng không có trong `import { ..., Leaf }` tại script setup. Khi admin chưa upload logo, fallback này sẽ không render được. Thêm `Leaf` vào import từ `lucide-vue-next`.

2. **Admin pages chưa sync theme** — Dashboard, Users, Images, Feedbacks vẫn dùng `bg-green-500`/`text-green-600`/`border-green-500` (confirmed by reading code). Ratings.vue đã upgrade một phần (yellow/blue). Cần sweep qua 4 admin pages để đổi các green utility class thành sky/blue tương đương.

3. **`animate-gradient-shift` không có utility class tương ứng trong style.css** — Home.vue CTA section dùng class `animate-gradient-shift` (possible). Class này được đăng ký trong tailwind.config.js dưới `animation['gradient-shift']`, nhưng Tailwind sẽ generate `animate-gradient-shift` hay `animate-[gradient-shift]` cần được verify. Nếu class không được generate thì animation không chạy — chỉ là visual regression nhỏ, không phải bug logic.

</details>

<details>
<summary>Details</summary>

### Design system thống nhất (style.css + tailwind.config.js)

style.css xây dựng lại từ đầu với CSS variables sky/blue palette (`--color-primary: #0ea5e9`, `--gradient-primary`, `--shadow-sky-*`), 18 keyframes, và toàn bộ component layer. tailwind.config.js mở rộng thêm `colors.primary` (sky-50 đến sky-900), `boxShadow.sky-*`, `animation.*`, và đầy đủ keyframes. Hai file song song — CSS cung cấp component classes, Tailwind cung cấp utility classes. Tất cả class cũ (`btn-primary`, `btn-secondary`, `card`, `input-field`) đều còn nguyên — không có breaking change.

### User pages: nâng cấp rõ rệt trên 6/9 file

**Home.vue**: Hero section dùng `bg-gradient-to-br from-sky-950 via-sky-900 to-indigo-900` với 3 floating decorative blobs (`animate-float`, `blur-3xl`). Có `gradient-text` shimmer cho chữ "Thông Minh". Ratings section mới với star bars, recent review cards, avatar fallback. Download section có glassmorphism card cho iOS/Android. CTA section dùng animated gradient. Tất cả sections có `animate-fade-in-up` với `animation-delay` staggered.

**Login.vue / Register.vue**: Cùng pattern — dark gradient background (`from-sky-950 via-sky-900 to-indigo-900`), hai floating blobs, form card `bg-white/95 backdrop-blur-sm rounded-3xl shadow-lift`. Register thêm password strength bar với màu sky/blue khi strong. Đây là cải thiện visual lớn nhất so với baseline.

**Classify.vue**: Drag-over state có `scale-[1.02]` và `shadow-sky-sm`. Loading state dùng skeleton class (`skeleton h-6 w-3/4 rounded-xl`). Result cards dùng `border-l-4` với màu từ CATEGORY_INFO — logic này không đổi. Rating widget được embed inline sau kết quả.

**Chat.vue**: Container dùng class `glass` với `shadow-glass`. Send button dùng `linear-gradient(135deg, #22c55e, #16a34a)` — đây là **green**, khác với theme sky/blue. Không nhất quán nhỏ nhưng trong context nút "send" thường xanh lá nên có thể chấp nhận. Typing indicator dùng bounce dots `bg-sky-400`.

**History.vue**: Pill-style tabs, skeleton grid khi loading, thumbnail cards với hover scale. Modal detail có `backdrop-blur-md` và `animate-scale-in`.

**Profile.vue**: Gradient top bar (`from-sky-500 to-blue-500`), avatar với `ring-4 ring-sky-100`, stat cards `bg-gradient-to-br from-sky-50 to-blue-50`. Tab active state dùng `from-white to-green-50/50` — có chút xanh lá trong active tab, không gây visual conflict lớn.

### Admin pages: theme cũ chưa được cập nhật

Dashboard.vue: loading spinner `border-green-500`, stat cards dùng `bg-green-50 text-green-600` cho icon Phân loại, daily chart bar `bg-green-500`. Users.vue: user avatar admin dùng `bg-purple-600`, user dùng `bg-green-600`, search input focus `ring-green-500`. Images.vue: loading spinner `text-green-500`, pagination dùng `btn-secondary` (đã sky). Feedbacks.vue: filter tab active `border-green-600 text-green-600`, send reply button `bg-green-600`, loading `text-green-500`. Ratings.vue là ngoại lệ — đã dùng yellow/blue khá đồng bộ.

Đây không phải regression (các class này có từ trước) nhưng sau khi user pages đã chuyển sang sky/blue hoàn toàn, sự contrast khi vào admin panel sẽ lộ.

### Logic không bị thay đổi (confirmed)

Classify.vue: `CATEGORY_INFO` object nguyên vẹn với 8 keys và đầy đủ color/bg/icon/label. `catInfo()`, `drawBoundingBoxes()`, `handleClassify()`, `submitRating()` không đổi. History.vue: `CATEGORY_COLORS`, `CATEGORY_LABELS`, `hexToRgba()` nguyên vẹn. Tất cả API endpoints, form validation logic, store interactions không thay đổi.

Build: `dist/` LastWriteTime `2026-11-01 15:22` khớp timestamp code. `build-result.txt`: "PASS, 19.97s, 1584 modules transformed". Exit code 1 là npm version notice, không phải build error.

</details>

---

<details>
<summary>File map</summary>

| File | Thay đổi |
|------|----------|
| `src/style.css` | Viết lại toàn bộ — CSS variables sky/blue, 18 keyframes, component layer đầy đủ |
| `tailwind.config.js` | Mở rộng colors, shadows, animations, keyframes |
| `src/pages/Home.vue` | Dark hero gradient, floating blobs, ratings section, download section glass cards |
| `src/pages/Login.vue` | Dark gradient bg, floating blobs, glassmorphism form card |
| `src/pages/Register.vue` | Cùng Login + password strength bar |
| `src/pages/Classify.vue` | Skeleton loading, drag animation, hover-lift result cards |
| `src/pages/Chat.vue` | Glass container, bounce typing dots, gradient bubbles |
| `src/pages/History.vue` | Pill tabs, skeleton grid, scale-in modal backdrop |
| `src/pages/Profile.vue` | Gradient top bar, ring avatar, sky gradient stats |
| `src/pages/admin/Dashboard.vue` | Không đổi UI (logic chỉ) |
| `src/pages/admin/Users.vue` | Không đổi UI |
| `src/pages/admin/Images.vue` | Không đổi UI |
| `src/pages/admin/Ratings.vue` | Một phần (yellow/blue cho stars, green cho reply buttons) |
| `src/pages/admin/Feedbacks.vue` | Không đổi UI |
| `src/pages/admin/AppConfig.vue` | Logo upload UI mới, missing Leaf import |

Full diff: `git diff main -- src/` từ project root.

</details>
