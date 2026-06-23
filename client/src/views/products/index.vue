<template>
  <div class="products-page">
    <PageHeader title="商品管理" description="管理商品信息和 SKU 配置">
      <template #extra>
        <a-button type="primary" @click="handleAdd"><icon-plus />添加商品</a-button>
      </template>
    </PageHeader>

    <!-- 搜索筛选 -->
    <a-card class="search-card" :bordered="false">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input-search v-model="keyword" placeholder="搜索商品名/SKU" allow-clear @search="fetchData" />
        </a-col>
        <a-col :span="4">
          <a-select v-model="statusFilter" placeholder="状态" allow-clear @change="fetchData">
            <a-option value="">全部</a-option>
            <a-option value="active">上架</a-option>
            <a-option value="inactive">下架</a-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select v-model="categoryFilter" placeholder="类目" allow-clear @change="fetchData">
            <a-option value="">全部</a-option>
          </a-select>
        </a-col>
        <a-col :span="10">
          <a-space>
            <a-button type="primary" @click="fetchData"><icon-search />查询</a-button>
            <a-button @click="resetFilters">重置</a-button>
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
        :scroll="{ x: 1200 }"
      >
        <template #columns>
          <a-table-column title="商品信息" :width="280">
            <template #cell="{ record }">
              <div class="product-info-cell">
                <img :src="record.image || '/placeholder-product.png'" alt="" class="product-thumb" />
                <div class="info-text">
                  <p class="name">{{ record.name || `商品 #${record.id}` }}</p>
                  <p class="sku">SKU: {{ record.sku || '-' }}</p>
                </div>
              </div>
            </template>
          </a-table-column>
          <a-table-column title="类目" data-index="category" :width="100" />
          <a-table-column title="售价 (RM)" data-index="sellPrice" :width="110" align="right">
            <template #cell="{ record }">{{ record.sellPrice?.toFixed(2) }}</template>
          </a-table-column>
          <a-table-column title="成本 (¥)" data-index="costPrice" :width="100" align="right">
            <template #cell="{ record }">{{ record.costPrice?.toFixed(2) }}</template>
          </a-table-column>
          <a-table-column title="利润率" data-index="profitRate" :width="80" align="center">
            <template #cell="{ record }">{{ (record.profitRate * 100)?.toFixed(1) }}%</template>
          </a-table-column>
          <a-table-column title="库存" data-index="stock" :width="70" align="center" />
          <a-table-column title="状态" data-index="status" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.status === 'active' ? 'green' : 'gray'">
                {{ record.status === 'active' ? '上架' : '下架' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="150" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small">编辑</a-button>
                <a-button type="text" size="small" status="danger">删除</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconSearch } from '@arco-design/web-vue/icon'
import { getProductListApi } from '@/api/products.api'

const loading = ref(false)
const tableData = ref<any[]>([])
const keyword = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const pagination = reactive({ current: 1, pageSize: 20, showTotal: true, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getProductListApi({ keyword: keyword.value, status: statusFilter.value })
    const data = res.data || res
    tableData.value = data.data || []
    pagination.total = data.total || 0
  } catch (e) {
    console.error('Fetch products failed:', e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  keyword.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
  fetchData()
}

function handleAdd() {
  Message.info('添加商品功能开发中...')
}

function onPageChange(page: number) {
  pagination.current = page
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped lang="less">
.products-page {
  .search-card { margin-bottom: 16px; border-radius: 10px; }
  .table-card { border-radius: 10px; }

  .product-info-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .product-thumb {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      object-fit: cover;
      background: var(--color-fill-2);
    }

    .info-text {
      .name {
        font-size: 14px;
        color: var(--color-text-1);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 180px;
      }
      .sku {
        font-size: 12px;
        color: var(--color-text-3);
        margin: 0;
      }
    }
  }
}
</style>
