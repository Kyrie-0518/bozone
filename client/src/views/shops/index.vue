<template>
  <div class="shops-page">
    <PageHeader title="店铺管理" description="管理和授权 TikTok Shop 店铺" />

    <a-card class="table-card">
      <!-- 操作栏 -->
      <div class="toolbar">
        <a-button type="primary" @click="handleAdd">
          <icon-plus />添加店铺
        </a-button>
        <a-button @click="fetchData">
          <icon-refresh />刷新
        </a-button>
      </div>

      <!-- 店铺卡片列表 -->
      <a-row :gutter="16" v-if="shops.length > 0">
        <a-col :span="8" v-for="shop in shops" :key="shop.id">
          <a-card hoverable class="shop-card">
            <div class="shop-header">
              <a-tag :color="shop.status === 'active' ? 'green' : 'red'" size="small">
                {{ shop.status === 'active' ? '正常' : '异常' }}
              </a-tag>
              <span class="shop-region">{{ shop.region }}</span>
            </div>
            <h3 class="shop-name">{{ shop.name || `店铺 #${shop.id}` }}</h3>
            <p class="shop-id">Shop ID: {{ shop.shopId }}</p>

            <div class="shop-stats">
              <div class="stat-item">
                <span class="label">今日订单</span>
                <span class="value">{{ shop.todayOrders || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">今日营收</span>
                <span class="value">RM{{ (shop.todayRevenue || 0).toFixed(2) }}</span>
              </div>
            </div>

            <div class="shop-footer">
              <span class="sync-time">同步: {{ shop.lastSyncedAt ? formatTime(shop.lastSyncedAt) : '从未' }}</span>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-empty v-else description="暂无店铺数据，请点击添加" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconRefresh } from '@arco-design/web-vue/icon'
import { getShopsApi } from '@/api/shops.api'

const shops = ref<any[]>([])
const loading = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getShopsApi()
    shops.value = res.data || res || []
  } catch (e) {
    console.error('Failed to fetch shops:', e)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  Message.info('添加店铺功能开发中...')
}

function formatTime(time: string): string {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => fetchData())
</script>

<style scoped lang="less">
.shops-page {
  .toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .shop-card {
    border-radius: 10px;
    margin-bottom: 16px;

    :deep(.arco-card-body) {
      padding: 20px;
    }
  }

  .shop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .shop-region {
    font-size: 13px;
    color: #86909c;
  }

  .shop-name {
    font-size: 18px;
    font-weight: 600;
    color: #1d2129;
    margin-bottom: 8px;
  }

  .shop-id {
    color: #86909c;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .shop-stats {
    display: flex;
    gap: 24px;
    padding: 12px 0;
    border-top: 1px solid var(--color-fill-2);
    border-bottom: 1px solid var(--color-fill-2);
    margin-bottom: 12px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 12px;
      color: #86909c;
      margin-bottom: 4px;
    }

    .value {
      font-size: 16px;
      font-weight: 600;
      color: #1d2129;
    }
  }

  .shop-footer {
    .sync-time {
      font-size: 12px;
      color: #c9cdd4;
    }
  }
}
</style>
