<template>
  <div class="audit-logs-page">
    <PageHeader title="操作日志" description="查看所有用户操作记录">
      <template #extra>
        <a-button @click="fetchData"><icon-refresh />刷新</a-button>
        <a-button @click="handleExport"><icon-download />导出</a-button>
      </template>
    </PageHeader>

    <a-card :bordered="false" class="search-card">
      <a-row :gutter="16">
        <a-col :span="5"><a-input v-model="pathFilter" placeholder="搜索路径" allow-clear /></a-col>
        <a-col :span="4"><a-select v-model="methodFilter" placeholder="请求方法" allow-clear>
          <a-option value="">全部</a-option><a-option value="GET">GET</a-option><a-option value="POST">POST</a-option><a-option value="PUT">PUT</a-option><a-option value="DELETE">DELETE</a-option>
        </a-select></a-col>
        <a-col :span="8"><a-range-picker v-model="dateRange" style="width:100%" /></a-col>
        <a-col :span="7"><a-space><a-button type="primary" @click="fetchData"><icon-search />查询</a-button><a-button @click="resetFilters">重置</a-button></a-space></a-col>
      </a-row>
    </a-card>

    <a-card :bordered="false" style="margin-top:16px;border-radius:10px;">
      <a-table :data="logs" row-key="id" :loading="loading" :pagination="pagination" :scroll="{x:1100}" @page-change="(p:number)=>{pagination.current=p;fetchData();}">
        <template #columns>
          <a-table-column title="时间" data-index="createdAt" width="170" fixed="left" />
          <a-table-column title="用户" data-index="userName" width="100" />
          <a-table-column title="方法" data-index="method" width="80">
            <template #cell="{ record }"><a-tag size="small" :color="{GET:'blue',POST:'green',PUT:'orange',DELETE:'red'}[record.method]">{{record.method}}</a-tag></template>
          </a-table-column>
          <a-table-column title="请求路径" data-index="path" :ellipsis="true" :tooltip="true" />
          <a-table-column title="状态码" data-index="statusCode" width="80" align="center">
            <template #cell="{ record }">
              <span :style="{color:record.statusCode<400?'#00b42a':record.statusCode<500?'#ff7d00':'#f53f3f'}">{{record.statusCode}}</span>
            </template>
          </a-table-column>
          <a-table-column title="响应时间(ms)" width="120" align="right">{{record.responseTime||'-'}}</a-table-column>
          <a-table-column title="IP" data-index="ip" width="130" />
          <a-table-column title="User-Agent" data-index="userAgent" :ellipsis="true" :tooltip="true" width="200" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconRefresh, IconDownload, IconSearch } from '@arco-design/web-vue/icon'
import { getAuditLogsApi } from '@/api/audit-logs.api'

const loading = ref(false)
const logs = ref<any[]>([])
const pathFilter = ref('')
const methodFilter = ref('')
const dateRange = ref<string[]>([])
const pagination = reactive({ current:1, pageSize:20, showTotal:true, total:0 })

async function fetchData() {
  loading.value = true
  try {
    const res: any = await getAuditLogsApi({ path: pathFilter.value, method: methodFilter.value, dateFrom: dateRange.value?.[0], dateTo: dateRange.value?.[1] })
    const d = res.data || res
    logs.value = d.data || []
    pagination.total = d.total || 0
  } catch (e) { console.error(e) }
  finally{loading.value=false}
}

function resetFilters(){pathFilter.value='';methodFilter.value='';dateRange.value=[];fetchData()}
function handleExport(){Message.info('导出功能开发中...')}

onMounted(()=>fetchData())
</script>

<style scoped lang="less">
.audit-logs-page .search-card{border-radius:10px;}
</style>
