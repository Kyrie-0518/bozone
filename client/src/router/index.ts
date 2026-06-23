/**
 * 路由配置
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores/user.store'

NProgress.configure({ showSpinner: false })

// 公开页面 (无需登录)
const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
]

// 需要认证的页面
const authenticatedRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'icon-dashboard', roles: ['admin', 'manager', 'finance', 'operator'] },
      },
      {
        path: '/shops',
        name: 'Shops',
        component: () => import('@/views/shops/index.vue'),
        meta: { title: '店铺管理', icon: 'icon-store', roles: ['admin', 'manager'] },
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/orders/index.vue'),
        meta: { title: '订单管理', icon: 'icon-file', roles: ['admin', 'manager', 'operator'] },
      },
      {
        path: '/orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/detail.vue'),
        meta: { title: '订单详情', hidden: true, roles: ['admin', 'manager', 'operator'] },
      },
      {
        path: '/products',
        name: 'Products',
        component: () => import('@/views/products/index.vue'),
        meta: { title: '商品管理', icon: 'icon-apps', roles: ['admin', 'manager', 'operator'] },
      },
      {
        path: '/finance',
        name: 'Finance',
        component: () => import('@/views/finance/index.vue'),
        meta: { title: '财务核算', icon: 'icon-dollar', roles: ['admin', 'manager', 'finance'] },
      },
      {
        path: '/influencers',
        name: 'Influencers',
        component: () => import('@/views/influencers/index.vue'),
        meta: { title: '达人BD', icon: 'icon-user-group', roles: ['admin', 'manager', 'operator'] },
      },
      {
        path: '/ai-studio',
        name: 'AIStudio',
        redirect: '/ai-studio/material-library',
        meta: { title: 'AI工作室', icon: 'icon-magic wand', roles: ['admin', 'manager', 'operator'] },
        children: [
          {
            path: '/ai-studio/material-library',
            name: 'MaterialLibrary',
            component: () => import('@/views/ai-studio/MaterialLibrary.vue'),
            meta: { title: '素材库' },
          },
          {
            path: '/ai-studio/video-generator',
            name: 'VideoGenerator',
            component: () => import('@/views/ai-studio/VideoGenerator.vue'),
            meta: { title: 'AI视频生成' },
          },
        ],
      },
      {
        path: '/inventory',
        name: 'Inventory',
        component: () => import('@/views/inventory/index.vue'),
        meta: { title: '库存管理', icon: 'icon-storage', roles: ['admin', 'manager'] },
      },
      {
        path: '/ads',
        name: 'Ads',
        component: () => import('@/views/ads/index.vue'),
        meta: { title: '广告管理', icon: 'icon-advertise', roles: ['admin', 'manager'] },
      },
      {
        path: '/audit-logs',
        name: 'AuditLogs',
        component: () => import('@/views/audit-logs/index.vue'),
        meta: { title: '操作日志', icon: 'icon-list', roles: ['admin'] },
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '系统设置', icon: 'icon-settings', roles: ['admin'] },
      },
    ],
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/layouts/error/404.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: [...publicRoutes, ...authenticatedRoutes],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

// 全局前置守卫 - JWT 认证检查
router.beforeEach((to, _from, next) => {
  NProgress.start()

  // 设置页面标题
  const title = to.meta?.title as string
  if (title) {
    document.title = `${title} - Bozone ERP`
  }

  const userStore = useUserStore()
  const requiresAuth = to.meta?.requiresAuth !== false

  // 需要认证但未登录 → 跳转登录页
  if (requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录访问登录页 → 跳转首页
  if (to.path === '/login' && userStore.isLoggedIn) {
    next({ path: '/' })
    return
  }

  // 权限检查 (如果定义了 roles)
  const requiredRoles = to.meta?.roles as string[]
  if (requiredRoles && !userStore.hasPermission(requiredRoles[0])) {
    next({ path: '/dashboard' }) // 无权限跳转到首页
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
