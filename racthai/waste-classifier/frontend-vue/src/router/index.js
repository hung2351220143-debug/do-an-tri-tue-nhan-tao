import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/',          name: 'Home',     component: () => import('../pages/Home.vue') },
  { path: '/classify',  name: 'Classify',  component: () => import('../pages/Classify.vue') },
  { path: '/chat',      name: 'Chat',      component: () => import('../pages/Chat.vue') },
  { path: '/download',  name: 'Download',  component: () => import('../pages/Download.vue') },
  { path: '/recycle-orders', name: 'RecycleOrders', component: () => import('../pages/RecycleOrders.vue'), meta: { requiresAuth: true } },
  { path: '/login',     name: 'Login',    component: () => import('../pages/Login.vue') },
  { path: '/register',  name: 'Register', component: () => import('../pages/Register.vue') },
  {
    path: '/history', name: 'History',
    component: () => import('../pages/History.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile', name: 'Profile',
    component: () => import('../pages/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: () => import('../pages/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, adminOnly: true },
    children: [
      { path: '',           redirect: 'dashboard' },
      { path: 'dashboard',  name: 'AdminDashboard',  component: () => import('../pages/admin/Dashboard.vue') },
      { path: 'users',      name: 'AdminUsers',      component: () => import('../pages/admin/Users.vue') },
      { path: 'images',     name: 'AdminImages',     component: () => import('../pages/admin/Images.vue') },
      { path: 'ai-stats',   name: 'AdminAIStats',    component: () => import('../pages/admin/AIStats.vue') },
      { path: 'feedbacks',  name: 'AdminFeedbacks',  component: () => import('../pages/admin/Feedbacks.vue') },
      { path: 'ratings',    name: 'AdminRatings',    component: () => import('../pages/admin/Ratings.vue') },
      { path: 'app-config', name: 'AdminAppConfig',  component: () => import('../pages/admin/AppConfig.vue') },
      { path: 'staff',      name: 'AdminStaff',      component: () => import('../pages/admin/Staff.vue') },
      { path: 'banners',    name: 'AdminBanners',    component: () => import('../pages/admin/Banners.vue') },
      { path: 'chat',       name: 'AdminChat',       component: () => import('../pages/admin/ChatManager.vue') },
      { path: 'recycle-orders', name: 'AdminRecycleOrders', component: () => import('../pages/admin/RecycleOrders.vue') },
      { path: 'recycle-prices', name: 'AdminRecyclePrices', component: () => import('../pages/admin/RecyclePrices.vue') },
    ]
  },
  {
    path: '/staff',
    component: () => import('../pages/staff/StaffLayout.vue'),
    meta: { requiresAuth: true, staffOnly: true },
    children: [
      { path: '',         redirect: 'inbox' },
      { path: 'inbox',    name: 'StaffInbox',   component: () => import('../pages/staff/Inbox.vue') },
      { path: 'chat/:id', name: 'StaffChat',    component: () => import('../pages/staff/ChatRoom.vue') },
      { path: 'banners',  name: 'StaffBanners', component: () => import('../pages/admin/Banners.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (auth.state.loading) await auth.init()
  if (to.meta.requiresAuth && !auth.state.user) {
    return next({ name: 'Login', state: { from: to.fullPath } })
  }
  if (to.meta.adminOnly && auth.state.user?.role !== 'admin') {
    return next({ name: 'Home' })
  }
  if (to.meta.staffOnly && auth.state.user?.role !== 'staff' && auth.state.user?.role !== 'admin') {
    return next({ name: 'Home' })
  }
  next()
})

export default router
