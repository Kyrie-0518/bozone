<template>
  <div class="influencers-page">
    <PageHeader title="达人 BD" description="管理和跟踪达人合作">
      <template #extra>
        <a-button type="primary" @click="handleAdd"><icon-plus />添加达人</a-button>
      </template>
    </PageHeader>

    <a-card class="search-card" :bordered="false">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input-search v-model="keyword" placeholder="搜索姓名/TikTok ID" allow-clear @search="fetchData" />
        </a-col>
        <a-col :span="4">
          <a-select v-model="statusFilter" placeholder="状态" allow-clear @change="fetchData">
            <a-option value="">全部</a-option>
            <a-option value="new">新建</a-option>
            <a-option value="contacted">已联系</a-option>
            <a-option value="cooperating">合作中</a-option>
            <a-option value="terminated">已终止</a-option>
          </a-select>
        </a-col>
        <a-col :span="14">
          <a-space>
            <a-button type="primary" @click="fetchData"><icon-search />查询</a-button>
            <a-button @click="keyword='';statusFilter='';fetchData()">重置</a-button>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <a-card :bordered="false" class="table-card">
      <a-table :data="tableData" :pagination="pagination" :loading="loading" row-key="id" @page-change="(p: number)=>{ pagination.current = p; fetchData(); }">
        <template #columns>
          <a-table-column title="姓名" data-index="name" :width="120" />
          <a-table-column title="TikTok ID" data-index="tiktokId" :width="150" />
          <a-table-column title="粉丝数" data-index="followers" align="right" width="100">
            <template #cell="{ record }">{{ record.followers?.toLocaleString() || '-' }}</template>
          </a-table-column>
          <a-table-column title="国家/地区" data-index="country" :width="90" />
          <a-table-column title="状态" data-index="status" :width="100">
            <template #cell="{ record }"><a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag></template>
          </a-table-column>
          <a-table-column title="带货 GMV (RM)" data-index="gmvTotal" align="right" width="130">
            <template #cell="{ record }">{{ record.gmvTotal ? Number(record.gmvTotal).toLocaleString() : '-' }}</template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="createdAt" :width="170" />
          <a-table-column title="操作" :width="150" fixed="right">
            <template #cell="{ record }">
              <a-space><a-button type="text" size="small">编辑</a-button><a-button type="text" size="small">记录</a-button></a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconSearch } from '@arco-design/web-vue/icon'
import { getInfluencerListApi } from '@/api/influencers.api'

const loading = ref(false)
const tableData = ref<any[]>([])
const keyword = ref('')
const statusFilter = ref('')
const pagination = reactive({ current: 1, pageSize: 20, showTotal: true, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getInfluencerListApi({ keyword: keyword.value, status: statusFilter.value })
    const d = res.data || res
    tableData.value = d.data || []
    pagination.total = d.total || 0
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function handleAdd() { Message.info('功能开发中...') }

function getStatusColor(s: string): string { return ({ new:'gray', contacted:'blue', sample_sent:'cyan', cooperating:'green', terminated:'red' })[s]||'default' }
function getStatusText(s: string): string { return ({ new:'新建', contacted:'已联系', sample_sent:'寄样中', cooperating:'合作中', terminated:'已终止' })[s]||s }

onMounted(() => fetchData())
</script>

<style scoped lang="less">
.influencers-page { .search-card{margin-bottom:16px;border-radius:10px;} .table-card{border-radius:10px;} }
</style>
