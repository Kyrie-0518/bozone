<template>
  <div class="dashboard-page">
    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stat-cards">
      <a-col :span="6" v-for="item in statCards" :key="item.key">
        <a-card class="stat-card" :bordered="false">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">{{ item.label }}</p>
              <h3 class="stat-value">{{ formatNumber(stats[item.key]) }}</h3>
              <p :class="['stat-trend', stats[item.trendKey] >= 0 ? 'up' : 'down']">
                <icon-arrow-rise v-if="stats[item.trendKey] >= 0" />
                <icon-arrow-fall v-else />
                {{ Math.abs(stats[item.trendKey]) }}%
                <span>较昨日</span>
              </p>
            </div>
            <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
              <component :is="item.icon" style="color: #fff; font-size: 24px;" />
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表区域 -->
    <a-row :gutter="16" class="chart-section">
      <!-- 利润趋势图 -->
      <a-col :span="16">
        <a-card title="利润趋势 (近30天)" :bordered="false">
          <template #extra>
            <a-radio-group type="button" v-model="trendRange" @change="fetchProfitTrend">
              <a-radio value="7">7天</a-radio>
              <a-radio value="30">30天</a-radio>
            </a-radio-group>
          </template>
          <v-chart class="chart" :option="profitChartOption" autoresize />
        </a-card>
      </a-col>

      <!-- 热销商品 Top10 -->
      <a-col :span="8">
        <a-card title="热销商品 Top10" :bordered="false">
          <div class="top-products">
            <div
              v-for="(product, index) in topProducts"
              :key="product.id"
              class="top-product-item"
            >
              <span class="rank" :class="{ top3: index < 3 }">{{ index + 1 }}</span>
              <img
                :src="product.image || '/placeholder-product.png'"
                alt=""
                class="product-img"
              />
              <div class="product-info">
                <p class="product-name">{{ product.name || `商品 #${product.id}` }}</p>
                <p class="product-sales">RM{{ formatNumber(product.totalSales) }}</p>
              </div>
            </div>
            <a-empty v-if="topProducts.length === 0" description="暂无数据" />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近订单 -->
    <a-card title="最近订单" :bordered="false" class="orders-section">
      <a-table
        :data="recentOrders"
        :pagination="false"
        size="small"
        row-key="id"
      >
        <template #columns>
          <a-table-column title="订单号" data-index="orderId" :width="180" />
          <a-table-column title="店铺" data-index="shopName" :width="100" />
          <a-table-column title="金额" data-index="totalAmount" :width="100">
            <template #cell="{ record }">
              RM{{ record.totalAmount?.toFixed(2) }}
            </template>
          </a-table-column>
          <a-table-column title="利润" data-index="profit" :width="100">
            <template #cell="{ record }">
              <span :style="{ color: record.profit >= 0 ? '#059669' : '#dc2626' }">
                ¥{{ record.profit?.toFixed(2) }}
              </span>
            </template>
          </a-table-column>
          <a-table-column title="状态" data-index="status" :width="90">
            <template #cell="{ record }">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="时间" data-index="createdAt" :width="160" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { IconArrowRise, IconArrowFall } from '@arco-design/web-vue/icon'
import {
  getDashboardStatsApi,
  getProfitTrendApi,
  getTopProductsApi,
  getRecentOrdersApi,
} from '@/api/dashboard.api'

use([CanvasRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

// 数据状态
const loading = ref(false)
const trendRange = ref('30')
const stats = reactive({
  todayRevenue: 0,
  todayOrders: 0,
  todayProfit: 0,
  roi: 0,
  revenueChange: 0,
  ordersChange: 0,
  profitChange: 0,
})
const profitData = ref<any[]>([])
const topProducts = ref<any[]>([])
const recentOrders = ref<any[]>([])

// 统计卡片配置
const statCards = [
  {
    key: 'todayRevenue',
    label: '今日营收',
    trendKey: 'revenueChange',
    icon: 'icon-dollar',
    bgColor: '#2563eb',
  },
  {
    key: 'todayOrders',
    label: '今日订单',
    trendKey: 'ordersChange',
    icon: 'icon-file',
    bgColor: '#059669',
  },
  {
    key: 'todayProfit',
    label: '今日利润',
    trendKey: 'profitChange',
    icon: 'icon-rise',
    bgColor: '#d97706',
  },
  {
    key: 'roi',
    label: 'ROI',
    trendKey: 'roi',
    icon: 'icon-percentage',
    bgColor: '#dc2626',
  },
]

// 利润趋势图配置
const profitChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
  },
  legend: {
    data: ['利润', 'ROI'],
    bottom: 0,
  },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: profitData.value.map((d) => d.date),
    axisLabel: { fontSize: 11 },
  },
  yAxis: [
    {
      type: 'value',
      name: '利润 (¥)',
      position: 'left',
      axisLabel: { formatter: '¥{value}' },
    },
    {
      type: 'value',
      name: 'ROI (%)',
      position: 'right',
      axisLabel: { formatter: '{value}%' },
    },
  ],
  series: [
    {
      name: '利润',
      type: 'line',
      smooth: true,
      data: profitData.value.map((d) => d.profit),
      areaStyle: { opacity: 0.2 },
      itemStyle: { color: '#2563eb' },
    },
    {
      name: 'ROI',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: profitData.value.map((d) => Number((d.roi * 100).toFixed(1))),
      itemStyle: { color: '#059669' },
    },
  ],
}))

function formatNumber(num: number | undefined) {
  if (num === undefined || num === null) return '0.00'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'orangered',
    processing: 'blue',
    shipped: 'cyan',
    completed: 'green',
    cancelled: 'gray',
    refunded: 'red',
  }
  return colors[status] || 'default'
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  }
  return texts[status] || status
}

async function fetchDashboardStats() {
  try {
    const res: any = await getDashboardStatsApi()
    Object.assign(stats, res.data || res)
  } catch (e) {
    console.error('Failed to fetch dashboard stats:', e)
  }
}

async function fetchProfitTrend() {
  try {
    const res: any = await getProfitTrendApi(Number(trendRange.value))
    profitData.value = res.data || res || []
  } catch (e) {
    console.error('Failed to fetch profit trend:', e)
  }
}

async function fetchTopProducts() {
  try {
    const res: any = await getTopProductsApi()
    topProducts.value = res.data || res || []
  } catch (e) {
    console.error('Failed to fetch top products:', e)
  }
}

async function fetchRecentOrders() {
  try {
    const res: any = await getRecentOrdersApi()
    recentOrders.value = res.data || res || []
  } catch (e) {
    console.error('Failed to fetch recent orders:', e)
  }
}

onMounted(() => {
  Promise.all([
    fetchDashboardStats(),
    fetchProfitTrend(),
    fetchTopProducts(),
    fetchRecentOrders(),
  ])
})
</script>

<style scoped lang="less">
.dashboard-page {
  .stat-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    border-radius: 8px;

    :deep(.arco-card-body) {
      padding: 20px;
    }
  }

  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    color: #86909c;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #1d2129;
    margin-bottom: 8px;
  }

  .stat-trend {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;

    &.up { color: #00b42a; }
    &.down { color: #f53f3f; }

    span {
      color: #86909c;
      margin-left: 4px;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-section {
    margin-bottom: 16px;
  }

  .chart {
    height: 350px;
  }

  .top-products {
    max-height: 380px;
    overflow-y: auto;
  }

  .top-product-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-fill-2);

    &:last-child {
      border-bottom: none;
    }
  }

  .rank {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: var(--color-fill-3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #86909c;
    margin-right: 12px;

    &.top3 {
      background: linear-gradient(135deg, #ffd700, #ffaa00);
      color: #fff;
    }
  }

  .product-img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    margin-right: 12px;
    background: var(--color-fill-2);
  }

  .product-info {
    flex: 1;

    .product-name {
      font-size: 13px;
      color: #1d2129;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-sales {
      font-size: 12px;
      color: #86909c;
      margin: 0;
    }
  }

  .orders-section {
    border-radius: 8px;
  }
}
</style>
