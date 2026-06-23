<template>
  <div class="material-library-page">
    <PageHeader title="素材库" description="管理和浏览所有商品素材">
      <template #extra>
        <a-space>
          <a-radio-group v-mode="viewMode" type="button" size="small">
            <a-radio value="grid"><icon-apps /></a-radio>
            <a-radio value="list"><icon-list /></a-radio>
          </a-radio-group>
          <a-upload :auto-upload="false" :show-file-list="false" @change="handleUpload">
            <a-button type="primary"><icon-upload />上传素材</a-button>
          </a-upload>
        </a-space>
      </template>
    </PageHeader>

    <!-- 搜索筛选 -->
    <a-row :gutter="16" class="filter-row">
      <a-col :span="6">
        <a-input v-model="keyword" placeholder="搜索文件名/标签" allow-clear />
      </a-col>
      <a-col :span="4">
        <a-select v-model="typeFilter" placeholder="类型">
          <a-option value="">全部</a-option>
          <a-option value="image">图片</a-option>
          <a-option value="video">视频</a-option>
        </a-select>
      </a-col>
    </a-row>

    <!-- 网格视图 -->
    <div class="material-grid" v-if="viewMode === 'grid' && materials.length > 0">
      <div class="material-item" v-for="item in materials" :key="item.id">
        <div class="preview">
          <img v-if="item.type === 'image'" :src="item.url || item.thumbnail" alt="" />
          <div v-else class="video-placeholder"><icon-video /></div>
          <div class="overlay">
            <a-button size="small" type="text"><icon-eye />预览</a-button>
            <a-button size="small" type="text"><icon-download />下载</a-button>
            <a-button size="small" type="text" status="danger"><icon-delete />删除</a-button>
          </div>
          <a-tag v-if="item.type === 'image'" class="type-tag" size="small" color="blue">图片</a-tag>
          <a-tag v-else class="type-tag" size="small" color="purple">视频</a-tag>
        </div>
        <div class="info">
          <p class="name">{{ item.name }}</p>
          <p class="meta">{{ formatSize(item.size) }} · {{ item.category || '-' }}</p>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <a-table v-else-if="viewMode === 'list'" :data="materials" row-key="id" :pagination="false">
      <template #columns>
        <a-table-column title="预览" :width="80">
          <template #cell="{ record }">
            <img v-if="record.type === 'image'" :src="record.thumbnail" style="width:48px;height:48px;border-radius:4px;object-fit:cover;background:#f2f3f5;" />
            <span v-else><icon-video :size="24" color="#c9cdd4"/></span>
          </template>
        </a-table-column>
        <a-table-column title="名称" data-index="name" />
        <a-table-column title="类型" data-index="type" width="80"><template #cell="{ record }"><a-tag size="small">{{ record.type==='image'?'图片':'视频' }}</a-tag></template></a-table-column>
        <a-table-column title="大小" :width="100"><template #cell="{ record }">{{ formatSize(record.size) }}</template></a-table-column>
        <a-table-column title="上传时间" data-index="createdAt" width="170" />
      </template>
    </a-table>

    <a-empty v-if="materials.length === 0" description="暂无素材，请点击上传" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconApps, IconList, IconUpload, IconEye, IconDownload, IconDelete, IconVideo } from '@arco-design/web-vue/icon'
import { getMaterialListApi } from '@/api/materials.api'

const viewMode = ref('grid')
const keyword = ref('')
const typeFilter = ref('')
const materials = ref<any[]>([])

function formatSize(size?: number): string {
  if (!size) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1048576).toFixed(1)} MB`
}

function handleUpload(file: any) {
  Message.info(`准备上传: ${file.file.name}`)
}

async function fetchMaterials() {
  try {
    const res: any = await getMaterialListApi({ type: typeFilter.value })
    materials.value = res.data?.data || res.data || []
  } catch (e) { console.error(e) }
}

onMounted(() => fetchMaterials())
</script>

<style scoped lang="less">
.material-library-page {
  .filter-row { margin-bottom: 20px; }

  .material-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .material-item {
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    border: 1px solid var(--color-border);
    transition: box-shadow .25s;

    &:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
  }

  .preview {
    position: relative; height: 180px; overflow: hidden; background: var(--color-fill-2);

    img { width: 100%; height: 100%; object-fit: cover; }
    .video-placeholder {
      display:flex; align-items:center; justify-content:center; height:100%; font-size:40px; color:var(--color-text-4)
    }

    .overlay {
      position:absolute; inset:0; background:rgba(0,0,0,.5); opacity:0; transition:.25s; display:flex; justify-content:center; align-items:center; gap:8px;

      :deep(.arco-btn-text){color:#fff}
    }

    &:hover .overlay{opacity:1}

    .type-tag{ position:absolute;top:8px;left:8px;}
  }

  .info{ padding:10px 12px;
    .name{ font-size:13px; margin-bottom:4px; white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .meta{ font-size:12px; color:var(--color-text-3);margin:0;}
  }
}
</style>
