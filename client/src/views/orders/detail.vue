<template>
  <div class="order-detail-page" v-if="order">
    <PageHeader :title="`订单详情 - ${order.orderId}`" description="查看订单完整信息">
      <template #extra>
        <a-button @click="$router.back()">
          <icon-left />返回
        </a-button>
      </template>
    </PageHeader>

    <a-row :gutter="16">
      <!-- 基本信息 -->
      <a-col :span="16">
        <a-card title="基本信息" :bordered="false">
          <a-descriptions :column="2" bordered size="large">
            <a-descriptions-item label="订单号">{{ order.orderId }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="getStatusColor(order.status)">{{ getStatusText(order.status) }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="店铺">{{ order.shopName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="买家">{{ order.buyerName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ order.createdAt }}</a-descriptions-item>
            <a-descriptions-item label="发货时间">{{ order.shippedAt || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 商品明细 -->
        <a-card title="商品明细" :bordered="false" style="margin-top: 16px;">
          <a-table :data="order.items || []" :pagination="false" row-key="id">
            <template #columns>
              <a-table-column title="商品名称" data-index="productName" />
              <a-table-column title="SKU" data-index="skuName" :width="150" />
              <a-table-column title="数量" data-index="quantity" :width="80" align="center" />
              <a-table-column title="单价 (RM)" data-index="price" :width="100">
                <template #cell="{ record }">{{ record.price?.toFixed(2) }}</template>
              </a-table-column>
              <a-table-column title="小计 (RM)" data-index="total" :width="100">
                <template #cell="{ record }">{{ record.total?.toFixed(2) }}</template>
              </a-table-column>
            </template>
          </a-table>
        </a-card>

        <!-- 费用明细 -->
        <a-card title="费用明细" :bordered="false" style="margin-top: 16px;">
          <a-table :data="order.costs || []" :pagination="false" row-key="id">
            <template #columns>
              <a-table-column title="费用类型" data-index="typeName" />
              <a-table-column title="金额 (¥)" data-index="amount" align="right">
                <template #cell="{ record }">{{ record.amount?.toFixed(2) }}</template>
              </a-table-column>
              <a-table-column title="说明" data-index="description" :ellipsis="true" />
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 金额汇总 -->
      <a-col :span="8">
        <a-card title="金额汇总" :bordered="false" class="summary-card">
          <div class="summary-item">
            <span>商品总额</span>
            <span class="value">RM{{ order.totalAmount?.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>运费</span>
            <span class="value">RM{{ (order.shippingFee || 0).toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>平台优惠</span>
            <span class="value discount">-RM{{ (order.platformDiscount || 0).toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>卖家优惠</span>
            <span class="value discount">-RM{{ (order.sellerDiscount || 0).toFixed(2) }}</span>
          </div>
          <a-divider />
          <div class="summary-total">
            <span>实际收入</span>
            <span class="total-value">RM{{ order.finalAmount?.toFixed(2) }}</span>
          </div>
          <a-divider />
          <div class="summary-profit">
            <span>成本合计</span>
            <span>¥{{ (order.costTotal || 0).toFixed(2) }}</span>
          </div>
          <div class="summary-profit highlight">
            <span>净利润</span>
            <span :class="{ positive: order.profit >= 0, negative: order.profit < 0 }">
              ¥{{ order.profit?.toFixed(2) }}
            </span>
          </div>
          <div class="summary-rate">
            <span>利润率</span>
            <span>{{ (order.profitRate * 100).toFixed(1) }}%</span>
          </div>
        </a-card>

        <!-- 物流信息 -->
        <a-card title="物流信息" :bordered="false" style="margin-top: 16px;" v-if="order.trackingNumber">
          <p><strong>运单号:</strong> {{ order.trackingNumber }}</p>
          <a-button type="text">追踪物流</a-button>
        </a-card>
      </a-col>
    </a-row>
  </div>

  <a-spin v-else style="display: flex; justify-content: center; padding: 100px 0;" :size="48" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IconLeft } from '@arco-design/web-vue/icon'
import { getOrderDetailApi } from '@/api/orders.api'

const route = useRoute()
const order = ref<any>(null)

onMounted(async () => {
  try {
    const res: any = await getOrderDetailApi(Number(route.params.id))
    order.value = res.data || res
  } catch (e) {
    console.error('Fetch order detail failed:', e)
  }
})

function getStatusColor(status: string): string {
  return ({ pending: 'orangered', processing: 'blue', shipped: 'cyan', completed: 'green', cancelled: 'gray' })[status] || 'default'
}
function getStatusText(status: string): string {
  return ({ pending: '待处理', processing: '处理中', shipped: '已发货', completed: '已完成', cancelled: '已取消' })[status] || status
}
</script>

<style scoped lang="less">
.summary-card {
  .summary-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;

    .value { font-weight: 500; }
    .discount { color: #00b42a; }
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 600;

    .total-value { color: #2563eb; }
  }

  .summary-profit {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;

    &.highlight {
      background: var(--color-fill-1);
      padding: 12px 16px;
      margin: 0 -16px;
      border-radius: 6px;

      > span:last-child {
        font-size: 20px;
        font-weight: 700;
      }

      .positive { color: #00b42a; }
      .negative { color: #f53f3f; }
    }
  }

  .summary-rate {
    display: flex;
    justify-content: space-between;
    padding-top: 12px;
    color: #86909c;
  }
}
</style>
