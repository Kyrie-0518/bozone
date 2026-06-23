<template>
  <div class="ads-page">
    <PageHeader title="广告管理" description="TikTok Ads 投放监控与效果分析">
      <template #extra>
        <a-button type="primary"><icon-plus />新建广告</a-button>
        <a-button @click="fetchData"><icon-refresh />刷新</a-button>
      </template>
    </PageHeader>

    <!-- 汇总卡片 -->
    <a-row :gutter="16" class="summary-cards">
      <a-col :span="6" v-for="(item, i) in summaryCards" :key="i">
        <a-card :bordered="false" style="border-radius:10px;">
          <p class="label">{{ item.label }}</p>
          <h3 class="value" :style="{color:item.color}">{{ item.value }}</h3>
        </a-card>
      </a-col>
    </a-row>

    <!-- 广告活动表格 -->
    <a-card :bordered="false" style="margin-top:16px;border-radius:10px;">
      <template #title><a-space>广告活动列表</a-space></template>
      <a-table :data="campaigns" row-key="id" :loading="loading">
        <template #columns>
          <a-table-column title="活动名称" data-index="name" />
          <a-table-column title="类型" data-index="type" width="120">
            <template #cell="{ record }"><a-tag size="small">{{ {traffic:'流量',conversion:'转化',app_promo:'应用推广'}[record.type]||record.type }}</a-tag></template>
          </a-table-column>
          <a-table-column title="状态" data-index="status" width="100">
            <template #cell="{ record }"><a-tag :color="record.status==='active'?'green':record.status==='paused'?'orangered':'gray'">{{{active:'投放中',paused:'已暂停',completed:'已结束'}[record.status]}}</a-tag></template>
          </a-table-column>
          <a-table-column title="预算 (RM)" data-index="budget" align="right" width="110"><template #cell="{ record }">{{record.budget?.toLocaleString()}}</template></a-table-column>
          <a-table-column title="花费 (RM)" align="right" data-index="spend" width="110"><template #cell="{ record }">{{record.spend?.toFixed(2)}}</template></a-table-column>
          <a-table-column title="展示量" align="right" data-index="impressions" width="100">{{record.impressions?.toLocaleString()}}</a-table-column>
          <a-table-column title="点击量" align="right" data-index="clicks" width="90">{{record.clicks?.toLocaleString()}}</a-table-column>
          <a-table-column title="CTR" align="center" width="80"><template #cell="{ record }">{{(record.ctr*100)?.toFixed(1)}}%</template></a-table-column>
          <a-table-column title="转化数" align="center" data-index="conversions" width="90">{{record.conversions}}</a-table-column>
          <a-table-column title="CPA (RM)" align="right" width="100"><template #cell="{ record }">{{record.costPerConversion?.toFixed(2)}}</template></a-table-column>
          <a-table-column title="操作" width="140" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" size="small">详情</a-button>
                <a-button type="text" size="small">{{ record.status==='active'?'暂停':'开启' }}</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>

      <a-empty v-if="!loading && campaigns.length===0" description="暂无广告活动数据" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { IconPlus, IconRefresh } from '@arco-design/web-vue/icon'
import { getAdCampaignsApi } from '@/api/ads.api'

const loading = ref(false)
const campaigns = ref<any[]>([])
const summaryCards = reactive<any[]>([
  { label: '总花费', value: '0', color: '#dc2626' },
  { label: '总展示', value: '0', color: '#2563eb' },
  { label: '总点击', value: '0', color: '#059669' },
  { label: '总转化', value: '0', color: '#d97706' },
])

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getAdCampaignsApi()
    const d = res.data || res
    campaigns.value = d.data || []
    if (campaigns.value.length > 0) {
      const totalSpend = campaigns.value.reduce((sum: number, c: any) => sum + (c.spend || 0), 0)
      const totalImp = campaigns.value.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0)
      const totalClicks = campaigns.value.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0)
      const totalConv = campaigns.value.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0)
      summaryCards[0].value = `¥${totalSpend.toFixed(2)}`
      summaryCards[1].value = totalImp.toLocaleString()
      summaryCards[2].value = totalClicks.toLocaleString()
      summaryCards[3].value = String(totalConv)
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(() => fetchData())
</script>

<style scoped lang="less">
.ads-page{
  .summary-cards{ margin-bottom:16px;
    .label{ font-size:13px; color:#86909c; margin-bottom:8px;}
    .value{ font-size:24px; font-weight:700;}
  }
}
</style>
