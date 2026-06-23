<template>
  <a-layout class="layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      :collapsed="appStore.sidebarCollapsed"
      :width="220"
      :collapsed-width="64"
      collapsible
      breakpoint="lg"
      @collapse="appStore.setSidebarCollapsed"
    >
      <div class="logo">
        <img src="/favicon.svg" alt="Logo" class="logo-img" />
        <span v-show="!appStore.sidebarCollapsed" class="logo-text">Bozone</span>
      </div>

      <a-menu
        :selected-keys="selectedKeys"
        :open-keys="openKeys"
        :auto-open="false"
        @menu-item-click="handleMenuClick"
        @sub-menu-change="handleSubMenuChange"
      >
        <!-- 仪表盘 -->
        <a-menu-item key="/dashboard">
          <template #icon><icon-dashboard /></template>
          仪表盘
        </a-menu-item>

        <!-- 店铺管理 (admin/manager) -->
        <a-menu-item v-if="userStore.isManager" key="/shops">
          <template #icon><icon-store /></template>
          店铺管理
        </a-menu-item>

        <!-- 订单管理 -->
        <a-menu-item key="/orders">
          <template #icon><icon-file /></template>
          订单管理
        </a-menu-item>

        <!-- 商品管理 -->
        <a-menu-item key="/products">
          <template #icon><icon-apps /></template>
          商品管理
        </a-menu-item>

        <!-- 财务核算 -->
        <a-menu-item v-if="userStore.isFinance" key="/finance">
          <template #icon><icon-dollar /></template>
          财务核算
        </a-menu-item>

        <!-- 达人BD -->
        <a-menu-item key="/influencers">
          <template #icon><icon-user-group /></template>
          达人BD
        </a-menu-item>

        <!-- AI工作室 -->
        <a-sub-menu v-if="!userStore.isAdmin || true" key="/ai-studio">
          <template #icon><icon-magic-wand /></template>
          <template #title>AI工作室</template>
          <a-menu-item key="/ai-studio/material-library">素材库</a-menu-item>
          <a-menu-item key="/ai-studio/video-generator">AI视频生成</a-menu-item>
        </a-sub-menu>

        <!-- 库存管理 -->
        <a-menu-item v-if="userStore.isManager" key="/inventory">
          <template #icon><icon-storage /></template>
          库存管理
        </a-menu-item>

        <!-- 广告管理 -->
        <a-menu-item v-if="userStore.isManager" key="/ads">
          <template #icon><icon-advertise /></template>
          广告管理
        </a-menu-item>

        <!-- 分割线 -->
        <a-menu-divider />

        <!-- 系统设置 (仅管理员) -->
        <a-menu-item v-if="userStore.isAdmin" key="/audit-logs">
          <template #icon><icon-list /></template>
          操作日志
        </a-menu-item>
        <a-menu-item v-if="userStore.isAdmin" key="/settings">
          <template #icon><icon-settings /></template>
          系统设置
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧内容区 -->
    <a-layout>
      <!-- 顶栏 -->
      <a-layout-header class="header">
        <div class="header-left">
          <a-button type="text" @click="appStore.toggleSidebar">
            <icon-menu-fold v-if="!appStore.sidebarCollapsed" />
            <icon-menu-unfold v-else />
          </a-button>

          <!-- 面包屑 -->
          <a-breadcrumb style="margin-left: 16px">
            <a-breadcrumb-item>首页</a-breadcrumb-item>
            <a-breadcrumb-item v-if="$route.meta?.title">{{ $route.meta.title }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 暗色模式切换 -->
          <a-tooltip :content="appStore.isDarkMode ? '切换亮色模式' : '切换暗色模式'">
            <a-button type="text" @click="appStore.toggleDarkMode">
              <icon-moon-fill v-if="appStore.isDarkMode" />
              <icon-sun v-else />
            </a-button>
          </a-tooltip>

          <!-- 用户信息 -->
          <a-dropdown @select="handleUserAction">
            <a-button type="text" class="user-btn">
              <a-avatar :size="28" style="background-color: #2563eb">
                {{ userStore.userInfo?.name?.charAt(0) || 'U' }}
              </a-avatar>
              <span class="username">{{ userStore.userInfo?.name }}</span>
              <icon-down />
            </a-button>
            <template #content>
              <a-doption value="profile">个人中心</a-doption>
              <a-doption value="logout">退出登录</a-doption>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.store'
import { useUserStore } from '@/stores/user.store'
import { Message } from '@arco-design/web-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 菜单选中状态
const selectedKeys = computed(() => {
  const path = route.path
  // 处理子路由
  if (path.startsWith('/orders/')) return ['/orders']
  return [path]
})

const openKeys = ref<string[]>([])

watch(
  () => route.path,
  (path) => {
    // 自动展开父菜单
    if (path.startsWith('/ai-studio')) {
      openKeys.value = ['/ai-studio']
    }
  },
  { immediate: true }
)

function handleMenuClick(key: string) {
  router.push(key)
}

function handleSubMenuChange(keys: string[]) {
  openKeys.value = keys
}

function handleUserAction(value: string | number | Record<string, any> | undefined) {
  switch (value) {
    case 'profile':
      Message.info('个人中心开发中...')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      Message.success('已退出登录')
      break
  }
}
</script>

<style scoped lang="less">
.layout {
  min-height: 100vh;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border-2);
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  margin-left: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid var(--color-border-2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
}

.username {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content {
  padding: 20px;
  background-color: #f5f3f0;
  min-height: calc(100vh - 60px);
  overflow-y: auto;
}
</style>
