# UI Upgrade Plan – EcoScan Frontend

**Mục tiêu:** Nâng cấp giao diện Vue.js lên chuẩn hiện đại (glassmorphism, gradient, animation mượt) mà **không thay đổi** bất kỳ file nào trong `src/pages/admin/` và không sửa logic Vue (computed, methods, API calls).

**Thứ tự thực hiện:** style.css → tailwind.config.js → Navbar.vue → Home.vue → Classify.vue → Chat.vue → Login.vue → Register.vue → History.vue → Profile.vue → Download.vue

---

## Implementation Plan

- [ ] 1. **Nâng cấp `src/style.css`** – Nền tảng design system
  
  **Việc cần làm:**
  Thay toàn bộ nội dung file với phiên bản nâng cấp. Giữ nguyên tên class `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`, `.input-field`, `.badge`, `.chat-bubble-user`, `.chat-bubble-ai`, `.fade-in-up`, `.loading-dots`. Thêm:
  - CSS custom properties (variables) cho màu, shadow, gradient ở `:root`
  - `@keyframes`: `fadeInUp`, `slideInLeft`, `slideInRight`, `scaleIn`, `shimmer`, `floatUp`, `pulse-glow`, `gradient-shift`
  - Utility classes: `.glass` (glassmorphism), `.glass-dark`, `.gradient-text`, `.btn-shine` (shine sweep trên hover), `.skeleton` (loading skeleton), `.hover-lift` (translateY -4px + shadow tăng), `.input-glow` (focus glow xanh)
  - Cải thiện `.btn-primary`: gradient `from-green-500 to-emerald-600`, `box-shadow` xanh nhạt, thêm pseudo-element `::after` cho shine effect khi hover
  - Cải thiện `.input-field`: focus glow `0 0 0 3px rgba(22,163,74,0.15)`, smooth transition 200ms
  - Cải thiện `.card`: thêm `transition: transform 0.2s, box-shadow 0.2s`
  - Scrollbar: đổi thumb sang gradient xanh
  - Smooth scroll toàn cục: `html { scroll-behavior: smooth }`

  **Files:** `src/style.css`
  
  **Verify:** `npm run build` – không có lỗi build. Mở browser dev mode (`npm run dev`) và kiểm tra class `.btn-primary` hiển thị gradient.

---

- [ ] 2. **Nâng cấp `tailwind.config.js`** – Mở rộng theme

  **Việc cần làm:**
  Mở rộng `theme.extend` với:
  ```js
  colors: {
    primary: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0',
      300: '#86efac', 400: '#4ade80', 500: '#22c55e',
      600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d'
    },
    eco: { green:'#4CAF50', blue:'#2196F3', red:'#F44336', yellow:'#FFC107', purple:'#9C27B0' }
  }
  fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] }
  animation: {
    'fade-in-up': 'fadeInUp 0.4s ease-out',
    'slide-in-left': 'slideInLeft 0.4s ease-out',
    'slide-in-right': 'slideInRight 0.4s ease-out',
    'scale-in': 'scaleIn 0.3s ease-out',
    'float': 'floatUp 3s ease-in-out infinite',
    'shimmer': 'shimmer 2s linear infinite',
    'gradient-shift': 'gradientShift 4s ease infinite',
    'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
  }
  keyframes: { /* tương ứng với animation trên */ }
  boxShadow: {
    'green-sm': '0 2px 8px rgba(22,163,74,0.15)',
    'green-md': '0 4px 20px rgba(22,163,74,0.25)',
    'green-lg': '0 8px 40px rgba(22,163,74,0.35)',
    'glass': '0 8px 32px rgba(0,0,0,0.1)',
    'lift': '0 20px 40px rgba(0,0,0,0.12)',
  }
  backdropBlur: { xs: '2px' }
  ```

  **Files:** `tailwind.config.js`
  
  **Verify:** `npm run build` – không lỗi. Các class `shadow-green-md`, `animate-fade-in-up` được generate trong CSS output.

---

- [ ] 3. **Nâng cấp `src/components/Navbar.vue`** – Backdrop blur, scroll effect, active indicator

  **Việc cần làm:**
  Chỉ sửa phần `<template>` và thêm logic scroll vào `<script setup>`. **Không sửa** các function `isActive`, `handleLogout`, data `navLinks`, `initials`.

  **Template changes:**
  - `<nav>`: đổi class sang `bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 transition-all duration-300` + bind `:class="{ 'shadow-glass bg-white/95': scrolled, 'bg-white/80': !scrolled }"`
  - Logo `<div>`: đổi icon wrapper sang `bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-green-sm`; text: `bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent font-extrabold`
  - Desktop nav links active state: đổi từ `bg-green-50` sang `bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold`; thêm bottom border indicator `border-b-2 border-green-500` trên active link
  - Desktop nav links hover: `hover:bg-gray-50/80 hover:text-green-700 transition-all duration-200`
  - `.btn-primary` trên Register button: tự nhiên sẽ pick up style mới từ step 1
  - Dropdown menu: đổi `class` sang `bg-white/95 backdrop-blur-sm rounded-2xl shadow-lift border border-gray-100/50`; dropdown items thêm `rounded-lg mx-1` và smooth hover transition
  - Mobile menu: thêm `animate-slide-in-right` khi mở; background `bg-white/95 backdrop-blur-sm`
  - Avatar button: thêm `hover:ring-2 hover:ring-green-200 transition-all`

  **Script changes (thêm vào, không xóa gì):**
  ```js
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  const scrolled = ref(false)
  function onScroll() { scrolled.value = window.scrollY > 10 }
  onMounted(() => window.addEventListener('scroll', onScroll))
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
  ```

  **Files:** `src/components/Navbar.vue`
  
  **Verify:** `npm run dev` – Navbar hiển thị backdrop blur khi cuộn trang. Active link có indicator màu xanh. Không có lỗi console.

---

- [ ] 4. **Nâng cấp `src/pages/Home.vue`** – Hero animated, section transitions, card hover

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>` (toàn bộ constants, computed, API calls giữ nguyên).

  **Hero section** (`bg-gradient-to-br from-green-50...`):
  - Đổi background thành animated gradient: `class="relative overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 py-24 px-4"`
  - Thêm floating decorative elements (absolute positioned circles với `animate-float` và opacity thấp):
    ```html
    <div class="absolute top-10 left-10 w-72 h-72 bg-green-400/10 rounded-full blur-3xl animate-float" />
    <div class="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl animate-float" style="animation-delay:1.5s" />
    ```
  - Badge pill: `bg-white/10 backdrop-blur border border-white/20 text-green-300`
  - H1: `text-white` + `<span class="gradient-text">Thông Minh</span>` (dùng `.gradient-text` utility từ step 1)
  - Paragraph: `text-green-100/80`
  - `btn-primary` button: tự nhiên đẹp hơn từ step 1; thêm `shadow-green-md hover:shadow-green-lg`
  - `btn-secondary`: đổi sang `bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20`
  - Bullet text: `text-green-200/70`

  **Waste Types section** (`bg-white`):
  - Thêm `class="animate-fade-in-up"` cho section heading wrapper
  - Mỗi waste type card: thêm `.hover-lift` class; icon circle tăng size `w-14 h-14`; thêm gradient border effect: `hover:border-[${type.color}]/30`

  **Features section** (`bg-gray-50`):
  - Section background: `bg-gradient-to-br from-gray-50 to-white`
  - Feature cards: thêm `.hover-lift glass` classes; icon wrapper: thêm `shadow-sm`
  - Dùng `v-for` với index để add `animation-delay` staggered: `:style="{ animationDelay: i * 0.1 + 's' }"`

  **How it works section:**
  - Step icon circles: đổi sang gradient `bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-md`
  - Step number text: đổi từ `text-green-100` sang `text-green-500/20 text-6xl`
  - Thêm connector line giữa các steps (::after pseudo trên CSS, hoặc dùng div border-dashed)

  **Download section** (`bg-gradient-to-br from-gray-900...`):
  - iOS card: giữ nguyên style `bg-white/10 backdrop-blur`, thêm `hover-lift` + `transition-all duration-300`
  - Android card: giữ nguyên `bg-green-600/80`, thêm `hover-lift`

  **Ratings section:**
  - Rating cards: thêm `.hover-lift` và `transition-all duration-300`
  - Star average card: thêm glassmorphism light: `bg-gradient-to-br from-yellow-50 to-amber-50`

  **CTA section:**
  - Thêm `animate-gradient-shift` trên gradient background
  - Button: `bg-white text-green-700 shadow-lift hover:shadow-xl hover:-translate-y-0.5 transition-all`

  **Files:** `src/pages/Home.vue`
  
  **Verify:** `npm run build` – build thành công. `npm run dev` – trang chủ có hero dark gradient, floating elements, cards có hover lift effect.

---

- [ ] 5. **Nâng cấp `src/pages/Classify.vue`** – Upload zone drag animation, kết quả slide-in

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>`.

  **Upload dropzone:**
  - Thêm class khi `dragOver`: `scale-[1.02] border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-sm` (transition-all duration-200 đã có)
  - Khi không drag: `border-gray-200 hover:border-green-300 hover:bg-gray-50/80`
  - Icon upload: đổi wrapper sang `bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm`; thêm `group-hover:scale-110 transition-transform` trên icon (cần thêm `group` vào parent div)
  - Text "Kéo thả": đổi `text-gray-700` → `font-bold text-gray-800`
  - Camera button: thêm `.hover-lift`

  **Image preview:**
  - Container `rounded-2xl overflow-hidden bg-gray-900`: thêm `shadow-xl ring-1 ring-white/10`
  - X button (reset): thêm `hover:scale-110 transition-transform`

  **Loading state (kết quả đang tải):**
  - Thay thế spinner đơn giản `border-4 border-green-500 border-t-transparent rounded-full animate-spin` bằng skeleton loading:
    ```html
    <div class="card h-full p-6 space-y-4">
      <div class="skeleton h-6 w-3/4 rounded-xl" />
      <div class="skeleton h-4 w-full rounded-xl" />
      <div class="skeleton h-4 w-5/6 rounded-xl" />
      <div class="skeleton h-32 w-full rounded-xl mt-4" />
      <div class="skeleton h-6 w-1/2 rounded-xl" />
    </div>
    ```

  **Kết quả (result section):**
  - Wrapper `div.space-y-4.fade-in-up`: thêm class `animate-fade-in-up`
  - Summary card: border-left green → dùng `border-l-4 border-green-500` (đã có) + thêm `bg-gradient-to-r from-green-50/50 to-transparent`
  - Detection items: thêm `.hover-lift` + staggered animation delay: `:style="{ animationDelay: i * 0.05 + 's' }"`; đổi detail expand sang `class="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in-up"`
  - Rating widget: thêm `animate-scale-in` khi xuất hiện
  - Star buttons hover: đã có `hover:scale-125`, giữ nguyên

  **Files:** `src/pages/Classify.vue`
  
  **Verify:** `npm run dev` – drag ảnh vào dropzone có animation scale + color change. Kết quả xuất hiện với fade animation. Skeleton hiển thị khi đang loading.

---

- [ ] 6. **Nâng cấp `src/pages/Chat.vue`** – Chat bubble đẹp hơn, typing indicator

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>`.

  **Page header:**
  - H1: thêm `bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent`
  - "Xóa chat" button: thêm `.hover-lift`

  **Chat container:**
  - `bg-white rounded-2xl border border-gray-200 shadow-sm` → `glass rounded-2xl border border-gray-100/80 shadow-glass`

  **Empty state:**
  - Bot icon wrapper: đổi `bg-green-100` → `bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm`
  - Suggestion chips: đổi `bg-green-50 hover:bg-green-100` → `bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200/60`; thêm `transition-all duration-200 hover:-translate-y-0.5`

  **Message list:**
  - Mỗi message `div.flex.items-start`: thêm `animate-fade-in-up` và stagger: `:style="{ animationDelay: '0.05s' }"`
  - User avatar `bg-green-600`: đổi sang `bg-gradient-to-br from-green-500 to-emerald-600`
  - `.chat-bubble-user` (đã định nghĩa trong style.css step 1): cải thiện thêm `shadow-green-sm`
  - `.chat-bubble-ai`: cải thiện thêm `shadow-sm`

  **Typing indicator** (loading dots):
  - Thay thế `.loading-dots` đơn giản bằng:
    ```html
    <div class="chat-bubble-ai flex items-center gap-1 px-5 py-3">
      <span class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay:0ms" />
      <span class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay:150ms" />
      <span class="w-2 h-2 bg-green-400 rounded-full animate-bounce" style="animation-delay:300ms" />
    </div>
    ```

  **Input area:**
  - Container `p-4 border-t border-gray-100`: thêm `bg-gray-50/50`
  - Textarea: `input-field` class sẽ pick up focus glow từ step 1 tự động
  - Send button: đổi `bg-green-600` → `bg-gradient-to-br from-green-500 to-emerald-600`; thêm `shadow-green-sm hover:shadow-green-md transition-all hover:-translate-y-0.5`

  **Files:** `src/pages/Chat.vue`
  
  **Verify:** `npm run dev` – chat bubbles hiển thị đẹp, typing indicator bounce animation hoạt động, send button có gradient + hover lift.

---

- [ ] 7. **Nâng cấp `src/pages/Login.vue`** – Form glassmorphism, focus glow

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>`.

  **Outer container:**
  - `bg-gradient-to-br from-green-50 to-emerald-50` → `bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900`
  - Thêm floating background blobs giống Hero section:
    ```html
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-20 -left-20 w-80 h-80 bg-green-400/20 rounded-full blur-3xl animate-float" />
      <div class="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-300/15 rounded-full blur-3xl animate-float" style="animation-delay:2s" />
    </div>
    ```
  - Inner `div.w-full.max-w-md`: thêm `relative z-10 animate-scale-in`

  **Card (`div.card.shadow-md`):**
  - Đổi thành: `bg-white/95 backdrop-blur-sm rounded-3xl shadow-lift border border-white/50 p-8`

  **Card header:**
  - Logo icon wrapper: đổi `bg-green-600` → `bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-md`; thêm `animate-scale-in`
  - H1: `text-gray-900` giữ nguyên

  **Form:**
  - Label: thêm `font-semibold` (từ `font-medium`)
  - Input fields: `.input-field` đã được nâng cấp ở step 1 (focus glow tự động)
  - Password toggle button: thêm `hover:bg-gray-100 rounded-full p-0.5 transition-colors`
  - Submit button `.btn-primary`: sẽ có gradient từ step 1; thêm `shadow-green-sm hover:shadow-green-md`

  **Footer links:**
  - "Chưa có tài khoản" link: `text-green-600` → `text-green-400 hover:text-green-300`
  - "Tiếp tục không cần đăng nhập": `text-gray-500` → `text-green-200/70 hover:text-green-100`
  - Demo account code block: `bg-gray-50 px-3 py-1.5 rounded-lg` → `bg-gray-900/60 border border-gray-700 text-gray-300`

  **Files:** `src/pages/Login.vue`
  
  **Verify:** `npm run dev` – Login page có dark gradient background + floating blobs. Card glassmorphism. Input focus hiển thị glow xanh.

---

- [ ] 8. **Nâng cấp `src/pages/Register.vue`** – Tương tự Login, thêm password strength bar đẹp hơn

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>`.

  **Áp dụng toàn bộ thay đổi giống Login.vue (step 7):**
  - Outer background: dark gradient + floating blobs
  - Card: `bg-white/95 backdrop-blur-sm rounded-3xl shadow-lift`
  - Logo, labels, inputs: cùng pattern

  **Thêm riêng cho Register:**
  - Password strength bar: đổi container `mt-1.5` wrap bên ngoài thêm `transition-all duration-300`; height bar `h-1.5` → `h-2`; thêm `rounded-full overflow-hidden` wrapper; bar fill: thêm `transition-all duration-500`
  - Confirm password: khi match (`CheckCircle` icon hiện), thêm `animate-scale-in` cho icon
  - Submit button: cùng gradient + shadow từ step 1

  **Files:** `src/pages/Register.vue`
  
  **Verify:** `npm run dev` – Register page có cùng visual với Login. Password strength bar animate smooth khi gõ. CheckCircle icon animate khi passwords match.

---

- [ ] 9. **Nâng cấp `src/pages/History.vue`** – Card grid hover lift, tab transition, modal đẹp hơn

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>`.

  **Page header:**
  - H1: thêm gradient text nhẹ (giữ màu xám như hiện tại nhưng đẹp hơn)

  **Tabs:**
  - Tab bar: đổi `border-b border-gray-200` sang glassmorphism light tab bar: thêm `bg-gray-50/80 px-1 py-1 rounded-2xl border border-gray-100` bao quanh các tab buttons
  - Active tab: thêm `bg-white shadow-sm rounded-xl` thay vì chỉ dùng border-bottom
  - Inactive tab: `hover:bg-white/50 rounded-xl`
  - Transition: `transition-all duration-200` trên mỗi tab button

  **Loading state:**
  - Thay `<Loader2 class="animate-spin">` bằng skeleton grid:
    ```html
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="card p-0 overflow-hidden">
        <div class="skeleton h-40 w-full" />
        <div class="p-4 space-y-2">
          <div class="skeleton h-4 w-3/4 rounded" />
          <div class="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
    ```

  **Classification grid cards:**
  - Wrapper card: thêm `.hover-lift` class (translateY -4px + shadow tăng từ step 1)
  - Thumbnail `group-hover:scale-105`: giữ nguyên; thêm `transition-transform duration-500` (tăng từ 300ms)
  - Hover overlay: làm đẹp hơn với `bg-gradient-to-b from-transparent to-black/50`
  - "Xem chi tiết" badge: thêm `animate-scale-in backdrop-blur-sm`
  - Category dots: tăng size `w-3 h-3`; thêm `ring-1 ring-white`

  **Pagination:**
  - Buttons: thêm `.hover-lift`; Active page indicator đẹp hơn

  **Chat session list:**
  - Session cards: thêm `.hover-lift`; active session: `border-green-500 bg-gradient-to-r from-green-50/80 to-emerald-50/50`

  **Detail modal (Teleport):**
  - Backdrop: `bg-black/60 backdrop-blur-sm` → `bg-black/70 backdrop-blur-md`
  - Modal container: thêm `animate-scale-in`
  - Sticky header: `bg-white/95 backdrop-blur-sm`
  - Detection item cards: thêm `.hover-lift` + `transition-all duration-200`
  - Rating stars: thêm `hover:scale-125 transition-transform` (đã có)

  **Files:** `src/pages/History.vue`
  
  **Verify:** `npm run dev` – Classification cards có hover lift effect. Skeleton hiển thị khi loading. Tabs chuyển đổi smooth. Modal mở với scale animation.

---

- [ ] 10. **Nâng cấp `src/pages/Profile.vue`** – Tab transition, avatar section, form đẹp hơn

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>`.

  **Page header:**
  - `text-2xl font-bold text-gray-900` → thêm gradient: `text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent`

  **Avatar card:**
  - `.card` wrapper: thêm `overflow-hidden relative` + subtle gradient top: `before:absolute before:top-0 before:inset-x-0 before:h-1 before:bg-gradient-to-r before:from-green-500 before:to-emerald-500`
  - Avatar circle: `border-2 border-green-200` → `ring-4 ring-green-100 ring-offset-2`
  - Camera icon button (upload avatar): đổi `bg-green-600` → `bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-sm`; thêm `hover:scale-110 transition-transform`
  - User role badge: thêm `animate-scale-in`

  **Tab navigation bar:**
  - Giữ `bg-gray-100 p-1 rounded-xl` nhưng thêm `shadow-inner`
  - Active tab: `bg-white text-green-700 shadow-sm` → thêm `shadow-md font-semibold`; thêm subtle gradient: `bg-gradient-to-r from-white to-green-50/50`
  - Tab transition: thêm `transition-all duration-200` trên tất cả tab buttons

  **Tab: Thông tin (info):**
  - Card headers: icon đổi màu `text-green-600` → `text-emerald-600`
  - Form inputs: `.input-field` tự động có focus glow từ step 1
  - Stat boxes trong "Thống kê": 
    - `bg-green-50 rounded-xl p-4` → `bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100`
    - `bg-blue-50` → `bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100`
    - Numbers: thêm `tabular-nums`

  **Tab: Bảo mật (security):**
  - Form inputs: `.input-field` tự động đẹp hơn
  - Eye toggle buttons: thêm `hover:bg-gray-100 rounded-full p-0.5 transition-colors`

  **Tab: Đánh giá (ratings):**
  - Rating cards: thêm `.hover-lift transition-all`
  - Admin reply section: `bg-green-50 border border-green-200` → thêm `shadow-sm`

  **Tab: Phản hồi (feedbacks):**
  - Form card: thêm gradient top bar (như avatar card)
  - Feedback item cards: màu border status giữ nguyên logic; thêm `shadow-sm hover:shadow-md transition-shadow`
  - "Chờ Admin" dots animation: đổi `bg-gray-300` → `bg-green-300`

  **Files:** `src/pages/Profile.vue`
  
  **Verify:** `npm run dev` – Avatar section có ring effect. Tabs chuyển với smooth transition. Stat boxes có gradient background. Form inputs có focus glow.

---

- [ ] 11. **Nâng cấp `src/pages/Download.vue`** – Glassmorphism cards, animated header

  **Việc cần làm:**
  Chỉ sửa `<template>`. Không sửa `<script setup>`.

  **Outer container:**
  - `bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50` → `bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 min-h-[calc(100vh-64px)]`
  - Thêm floating blobs giống Login.vue (step 7)

  **Header section:**
  - App icon `bg-green-600 rounded-3xl`: → `bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl shadow-green-lg`; thêm `animate-pulse-glow`
  - H1: `text-gray-900` → `text-white font-extrabold`
  - Description paragraph: `text-gray-500` → `text-green-200/70`

  **Loading state:**
  - Đổi spinner thành 2 skeleton cards xếp chồng

  **iOS Card:**
  - Outer wrapper `bg-white rounded-2xl shadow-md`: → `glass rounded-3xl overflow-hidden border border-white/20 shadow-glass`
  - Header `bg-gradient-to-r from-gray-800 to-gray-900`: → `bg-gradient-to-r from-gray-900/90 to-black/80 backdrop-blur border-b border-white/10`
  - Step numbers `bg-gray-900`: → `bg-white/10 backdrop-blur border border-white/20 text-white`
  - Step text: `text-gray-800` → `text-white/90`; desc: `text-gray-500` → `text-white/60`
  - "Mở Safari" button: `bg-gray-900 hover:bg-gray-800` → gradient `bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800`; thêm `shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`
  - Copy link box: `bg-gray-50` → `bg-white/5 border border-white/10`; code: `text-white/70`; copy button: `bg-white/10 border border-white/20 hover:bg-white/20`

  **Android Card:**
  - Outer wrapper: → `glass rounded-3xl overflow-hidden border border-white/20 shadow-glass`
  - Header `bg-gradient-to-r from-green-600 to-emerald-600`: giữ nguyên gradient + thêm `backdrop-blur`
  - Step numbers `bg-green-600`: → `bg-white/20 backdrop-blur border border-white/30 text-white`
  - "Tải APK" button: `bg-green-600 hover:bg-green-700` → `bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-white shadow-green-md hover:shadow-green-lg transition-all hover:-translate-y-0.5`
  - "APK đang chuẩn bị" placeholder: `bg-gray-50 border-dashed border-gray-200` → `bg-white/5 border-dashed border-white/20 text-white/50`
  - Warning box `bg-amber-50 border-amber-200`: giữ nguyên (contrast tốt)

  **PWA Option card:**
  - `bg-blue-50 border border-blue-200` → `glass border border-blue-300/30 bg-blue-500/10`
  - Text: `text-blue-800` → `text-blue-200`; `text-blue-600` → `text-blue-300`
  - Button: `bg-blue-600 hover:bg-blue-700` → gradient `bg-gradient-to-r from-blue-500 to-blue-600`; thêm `.hover-lift`

  **Files:** `src/pages/Download.vue`
  
  **Verify:** `npm run dev` – Download page có dark background với floating elements. iOS/Android cards hiển thị glassmorphism. Buttons có gradient và hover lift effect.

---

## Thứ tự ưu tiên (nếu cần làm dần)

1. **Bắt buộc trước** (nền tảng): Item 1 (style.css) + Item 2 (tailwind.config.js)
2. **High impact visible**: Item 4 (Home) + Item 3 (Navbar)  
3. **Core features**: Item 5 (Classify) + Item 6 (Chat)
4. **Auth pages**: Item 7 (Login) + Item 8 (Register)
5. **Secondary pages**: Item 9 (History) + Item 10 (Profile) + Item 11 (Download)

## Ghi chú kỹ thuật

- **Tất cả logic giữ nguyên**: `<script setup>` của mọi page không bị chạm vào, chỉ Navbar.vue được thêm scroll listener.
- **`src/pages/admin/`**: Không file nào trong thư mục này bị sửa đổi.
- **Tailwind purge**: Tất cả class mới cần xuất hiện trong file `.vue` mới được Tailwind generate; không cần safelist.
- **Inter font**: Thêm vào `index.html` qua Google Fonts CDN hoặc giữ Segoe UI như hiện tại (không bắt buộc).
- **Build command**: `npm run build` (Vite)
- **Dev server**: `npm run dev` (Vite dev server)
- **Không cài thêm package**: Tất cả thay đổi dùng Tailwind utility + CSS custom properties, không cần thêm dependency mới.
