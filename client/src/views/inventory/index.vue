<template>
  <div class="inventory-page">
    <PageHeader title="库存管理" description="监控商品库存和预警">
      <template #extra>
        <a-button type="primary"><icon-plus />入库</a-button>
        <a-button @click="fetchData"><icon-refresh />刷新</a-button>
      </template>
    </PageHeader>

    <!-- 预警统计 -->
    <a-row :gutter="16" class="alert-cards">
      <a-col :span="8" v-for="(item, idx) in alertStats" :key="idx">
        <a-card :bordered="false" style="background:var(--color-fill-1)">
          <p class="label">{{ item.label }}</p>
          <h3 :class="['value', item.color]">{{ item.value }}</h3>
        </a-card>
      </a-col>
    </a-row>

    <!-- 库存表格 -->
    <a-card :bordered="false" style="margin-top:16px;border-radius:10px;">
      <a-table :data="tableData" :loading="loading" row-key="id" :pagination="pagination" @page-change="(p: number)=>{pagination.current = p; fetchData();}">
        <template #columns>
          <a-table-column title="商品" :width="250">
            <template #cell="{ record }">
              <strong>{{ record.productName || `#${record.productId}` }}</strong><br/>
              <small>{{ record.sku }}</small>
            </template>
          </a-table-column>
          <a-table-column title="仓库" data-index="warehouse" width="100" />
          <a-table-column title="总库存" align="right" :width="100">{{record.quantity}}</a-table-column>
          <a-table-column title="已占用" align="right" :width="90">{{record.reservedQuantity}}</a-table-column>
          <a-table-column title="可用" align="right" :width="90">{{record.availableQuantity}}</a-table-column>
          <a-table-column title="安全库存" align="right" :width="100">{{record.safetyStock}}</a-table-column>
          <a-table-column title="状态" :width="90">
            <template #cell="{ record }">
              <a-tag :color="record.status === 'normal' ? 'green' : record.status === 'low' ? 'orangered' : 'red'" size="small">
                {{ { normal: '正常', low: '偏低', out_of_stock: '缺货' }[record.status] || record.status }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="更新时间" data-index="lastUpdated" width="170" />
          <a-table-column title="操作" :width="120" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small">调整</a-button>
                <a-button type="text" size="small">记录</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { IconPlus, IconRefresh } from '@arco-design/web-vue/icon'
import { getInventoryListApi, getInventoryAlertsApi } from '@/api/inventory.api'

const loading = ref(false)
const tableData = ref<any[]>([])
const alertStats = ref<any[]>([
  { label: '正常库存', value: 0, color: '' },
  { label: '偏低预警', value: 0, color: 'warning' },
  { label: '缺货', value: 0, color: 'danger' }
])
const pagination = reactive({ current: 1, pageSize: 20, showTotal: true, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const [listRes, alertRes]: any[] = await Promise.all([getInventoryListApi(), getInventoryAlertsApi()])
    const d = listRes.data || listRes
    tableData.value = d.data || []
    pagination.total = d.total || 0
    const alerts = alertRes.data || alertRes || []
    alertStats.value[0].value = alerts.filter((a: any) => a.status === 'normal').length
    alertStats.value[1].value = alerts.filter((a: any) => a.status === 'low').length
    alertStats.value[2].value = alerts.filter((a: any) => a.status === 'out_of_stock').length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(() => fetchData())
</script>

<style scoped lang="less">
.inventory-page{
  .alert-cards{ margin-bottom:16px;
    .label{font-size:13px;color:#86909c;margin-bottom:6px;}
    .value{font-size:24px;font-weight:700; &.warning{color:#d97706} &.danger{color:#dc2626}}
  }
}
</style>
