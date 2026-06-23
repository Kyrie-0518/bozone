<template>
  <div class="orders-page">
    <PageHeader title="订单管理" description="管理和跟踪所有 TikTok Shop 订单" />

    <!-- 搜索筛选 -->
    <a-card class="search-card" :bordered="false">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input-search
            v-model="queryParams.keyword"
            placeholder="搜索订单号/商品名"
            allow-clear
            @search="handleSearch"
          />
        </a-col>
        <a-col :span="4">
          <a-select v-model="queryParams.status" placeholder="状态" allow-clear @change="fetchData">
            <a-option value="">全部</a-option>
            <a-option value="pending">待处理</a-option>
            <a-option value="processing">处理中</a-option>
            <a-option value="shipped">已发货</a-option>
            <a-option value="completed">已完成</a-option>
            <a-option value="cancelled">已取消</a-option>
          </a-select>
        </a-col>
        <a-col :span="8">
          <a-range-picker v-model="dateRange" style="width: 100%" @change="handleDateChange" />
        </a-col>
        <a-col :span="6">
          <a-space>
            <a-button type="primary" @click="handleSearch"><icon-search />查询</a-button>
            <a-button @click="handleReset">重置</a-button>
            <a-button @click="handleExport"><icon-download />导出</a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据表格 -->
    <a-card class="table-card" :bordered="false">
      <a-table
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #columns>
          <a-table-column title="订单号" data-index="orderId" :width="180" :ellipsis="true" :tooltip="true" />
          <a-table-column title="店铺" data-index="shopName" :width="100" />
          <a-table-column title="商品" data-index="productName" :ellipsis="true" :tooltip="true" />
          <a-table-column title="金额 (RM)" data-index="totalAmount" :width="110">
            <template #cell="{ record }">{{ record.totalAmount?.toFixed(2) }}</template>
          </a-table-column>
          <a-table-column title="利润 (¥)" data-index="profit" :width="100">
            <template #cell="{ record }">
              <span :style="{ color: record.profit >= 0 ? '#059669' : '#dc2626', fontWeight: 500 }">
                {{ record.profit?.toFixed(2) }}
              </span>
            </template>
          </a-table-column>
          <a-table-column title="利润率" data-index="profitRate" :width="80">
            <template #cell="{ record }">{{ (record.profitRate * 100).toFixed(1) }}%</template>
          </a-table-column>
          <a-table-column title="状态" data-index="status" :width="90">
            <template #cell="{ record }">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="createdAt" :width="170" />
          <a-table-column title="操作" :width="120" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small" @click="viewDetail(record)">详情</a-button>
                <a-button type="text" size="small" status="danger" v-if="record.status === 'pending'" @click="cancelOrder(record)">
                  取消
                </a-button>
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
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconSearch, IconDownload } from '@arco-design/web-vue/icon'
import { getOrderListApi, updateOrderStatusApi } from '@/api/orders.api'

const router = useRouter()
const loading = ref(false)
const tableData = ref<any[]>([])
const dateRange = ref<string[]>([])

const queryParams = reactive({
  keyword: '',
  status: '',
  page: 1,
  pageSize: 20,
})

const pagination = reactive({ current: 1, pageSize: 20, showTotal: true, showPageSize: true, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getOrderListApi(queryParams)
    const data = res.data || res
    tableData.value = data.data || []
    pagination.total = data.total || 0
  } catch (e) {
    console.error('Fetch orders failed:', e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  fetchData()
}

function handleReset() {
  queryParams.keyword = ''
  queryParams.status = ''
  dateRange.value = []
  handleSearch()
}

function handleDateChange(val: string[]) {
  if (val && val.length === 2) {
    queryParams.dateFrom = val[0]
    queryParams.dateTo = val[1]
  }
}

function onPageChange(page: number) {
  queryParams.page = page
  pagination.current = page
  fetchData()
}

function onPageSizeChange(pageSize: number) {
  queryParams.pageSize = pageSize
  pagination.pageSize = pageSize
  fetchData()
}

function viewDetail(record: any) {
  router.push(`/orders/${record.id}`)
}

async function cancelOrder(record: any) {
  try {
    await updateOrderStatusApi(record.id, 'cancelled')
    Message.success('取消成功')
    fetchData()
  } catch (e: any) {
    Message.error(e.message || '操作失败')
  }
}

function handleExport() {
  Message.info('导出功能开发中...')
}

function getStatusColor(status: string): string {
  return ({ pending: 'orangered', processing: 'blue', shipped: 'cyan', completed: 'green', cancelled: 'gray', refunded: 'red' })[status] || 'default'
}
function getStatusText(status: string): string {
  return ({ pending: '待处理', processing: '处理中', shipped: '已发货', completed: '已完成', cancelled: '已取消', refunded: '已退款' })[status] || status
}

onMounted(() => fetchData())
</script>

<style scoped lang="less">
.orders-page {
  .search-card {
    margin-bottom: 16px;
    border-radius: 10px;
  }

  .table-card {
    border-radius: 10px;
  }
}
</style>
