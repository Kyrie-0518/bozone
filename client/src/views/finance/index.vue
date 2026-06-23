<template>
  <div class="finance-page">
    <PageHeader title="财务核算" description="订单利润分析与费用管理">
      <template #extra>
        <a-space>
          <a-range-picker v-model="dateRange" />
          <a-button type="primary" @click="fetchData"><icon-refresh />刷新</a-button>
          <a-button @click="handleExport"><icon-download />导出报表</a-button>
        </a-space>
      </template>
    </PageHeader>

    <!-- 概览卡片 -->
    <a-row :gutter="16" class="overview-cards">
      <a-col :span="6">
        <a-card class="stat-card">
          <p class="label">总收入</p>
          <h3 class="value revenue">¥{{ formatMoney(overview.totalRevenue) }}</h3>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <p class="label">总成本</p>
          <h3 class="value cost">¥{{ formatMoney(overview.totalCost) }}</h3>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <p class="label">净利润</p>
          <h3 class="value profit">¥{{ formatMoney(overview.totalProfit) }}</h3>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <p class="label">平均利润率</p>
          <h3 class="value rate">{{ (overview.avgProfitRate * 100)?.toFixed(1) }}%</h3>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <!-- 利润图表 -->
      <a-col :span="14">
        <a-card title="利润趋势" :bordered="false">
          <v-chart class="chart" :option="chartOption" autoresize />
        </a-card>
      </a-col>

      <!-- 费用项配置 -->
      <a-col :span="10">
        <a-card title="费用模板配置" :bordered="false">
          <a-list :data-source="costItems" size="small">
            <template #item="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.name" :description="`类型: ${getTypeLabel(item.type)} | 值: ${item.value}`" />
                <template #actions>
                  <a-button type="text" size="small">编辑</a-button>
                </template>
              </a-list-item>
            </template>
            <template #footer>
              <a-button long><icon-plus />添加费用项</a-button>
            </template>
          </a-list>
          <a-empty v-if="costItems.length === 0" description="暂无费用项配置" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 利润明细表 -->
    <a-card title="利润明细" :bordered="false" style="margin-top: 16px;">
      <a-table :data="profitRecords" :loading="loading" :pagination="false" row-key="id" :scroll="{ x: 900 }">
        <template #columns>
          <a-table-column title="日期" data-index="date" :width="110" />
          <a-table-column title="收入 (¥)" data-index="revenue" align="right"><template #cell="{ record }">{{ record.revenue?.toFixed(2) }}</template></a-table-column>
          <a-table-column title="成本 (¥)" data-index="cost" align="right"><template #cell="{ record }">{{ record.cost?.toFixed(2) }}</template></a-table-column>
          <a-table-column title="利润 (¥)" data-index="profit" align="right"><template #cell="{ record }"><span :style="{ color: record.profit >= 0 ? '#00b42a' : '#f53f3f' }">{{ record.profit?.toFixed(2) }}</span></template></a-table-column>
          <a-table-column title="利润率" data-index="profitRate" align="center" width="90"><template #cell="{ record }">{{ (record.profitRate * 100)?.toFixed(1) }}%</template></a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh, IconDownload, IconPlus } from '@arco-design/web-vue/icon'
import VChart from 'vue-echarts'
import { use as echartsUse } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getFinanceOverviewApi, getProfitRecordsApi, getCostItemsApi } from '@/api/finance.api'

echartsUse([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const loading = ref(false)
const dateRange = ref<string[]>([])
const overview = reactive({ totalRevenue: 0, totalCost: 0, totalProfit: 0, avgProfitRate: 0 })
const profitRecords = ref<any[]>([])
const costItems = ref<any[]>([])

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: profitRecords.value.map(d => d.date), axisLabel: { fontSize: 11 } },
  yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
  series: [{
    name: '利润',
    type: 'line', smooth: true,
    data: profitRecords.value.map(d => d.profit),
    areaStyle: { opacity: 0.2 }, itemStyle: { color: '#2563eb' }
  }]
}))

function formatMoney(n: number | undefined): string {
  return (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

function getTypeLabel(type: string): string {
  return ({ fixed: '固定金额', percentage: '百分比', per_order: '每单', per_kg: '每公斤' })[type] || type
}

async function fetchData() {
  loading.value = true
  try {
    const [ovRes, prRes, ciRes] = await Promise.all([
      getFinanceOverviewApi(),
      getProfitRecordsApi({ dateFrom: dateRange.value?.[0], dateTo: dateRange.value?.[1] }),
      getCostItemsApi()
    ])
    Object.assign(overview, ovRes.data || ovRes)
    profitRecords.value = prRes.data?.data || []
    costItems.value = ciRes.data || ciRes || []
  } catch (e) {
    console.error('Fetch finance failed:', e)
  } finally {
    loading.value = false
  }
}

function handleExport() { Message.info('导出功能开发中...') }

onMounted(() => fetchData())
</script>

<style scoped lang="less">
.finance-page {
  .overview-cards { margin-bottom: 16px; }
  .stat-card { border-radius: 10px;
    .label { font-size: 13px; color: var(--color-text-3); margin-bottom: 8px; }
    .value { font-size: 24px; font-weight: 700; &.revenue{color:#2563eb} &.cost{color:#f53f3f} &.profit{color:#00b42a} &.rate{color:#d97706} }
  }
  .chart { height: 320px; }
}
</style>
