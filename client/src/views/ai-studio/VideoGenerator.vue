<template>
  <div class="video-generator-page">
    <PageHeader title="AI 视频生成" description="基于 Seedance 生成营销视频素材" />

    <a-row :gutter="20">
      <!-- 左侧：输入表单 -->
      <a-col :span="10">
        <a-card title="生成配置" :bordered="false">
          <a-form layout="vertical" :model="form" @submit="handleGenerate">
            <a-form-item label="提示词 (Prompt)" required>
              <a-textarea
                v-model="form.prompt"
                placeholder="描述你想要生成的视频内容..."
                :max-length="2000"
                show-word-limit
                :auto-size="{ minRows: 4, maxRows: 8 }"
              />
              <template #extra>
                <p class="prompt-hint">支持中文/英文，描述越详细效果越好</p>
              </template>
            </a-form-item>

            <a-form-item label="参考图片 (可选)">
              <a-upload
                list-type="picture-card"
                :auto-upload="false"
                :limit="1"
              >
                <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                  <icon-plus style="font-size:20px;" />
                  <span style="font-size:12px;margin-top:4px;">上传图片</span>
                </div>
              </a-upload>
              <p class="form-hint">图生视频模式：上传一张主图作为参考</p>
            </a-form-item>

            <a-form-item label="时长">
              <a-slider v-model="form.duration" :min="3" :max="15" :step="1" show-input />
            </a-form-item>

            <a-form-item label="分辨率">
              <a-radio-group v-model="form.resolution">
                <a-radio value="720p">720P</a-radio>
                <a-radio value="1080p">1080P</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="风格">
              <a-select v-model="form.style">
                <a-option value="commercial">商业广告</a-option>
                <a-option value="lifestyle">生活方式</a-option>
                <a-option value="product-showcase">产品展示</a-option>
              </a-select>
            </a-form-item>

            <a-form-item>
              <a-button type="primary" long html-type="submit" :loading="generating" size="large">
                {{ generating ? '生成中...' : '开始生成' }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- 右侧：生成队列和结果 -->
      <a-col :span="14">
        <a-card title="生成队列" :bordered="false">
          <div class="queue-list">
            <div v-for="task in queue" :key="task.id" class="queue-item">
              <div class="task-info">
                <a-tag :color="getStatusColor(task.status)" size="small">{{ task.status }}</a-tag>
                <span class="task-prompt">{{ task.prompt.substring(0, 60) }}...</span>
              </div>
              <div class="task-progress" v-if="task.status === 'pending' || task.status === 'processing'">
                <a-progress :percent="task.progress || 50" :show-text="false" size="small" />
              </div>
            </div>
            <a-empty v-if="queue.length === 0" description="暂无任务" />
          </div>
        </a-card>

        <a-card title="最近生成" :bordered="false" style="margin-top: 16px;">
          <div class="result-grid">
            <div v-for="item in results" :key="item.id" class="result-item">
              <div class="video-thumb">
                <icon-video size="32" color="#86909c" />
              </div>
              <p>{{ item.prompt?.substring(0, 30) }}</p>
              <div class="actions">
                <a-button size="small" type="text"><icon-download />下载</a-button>
                <a-button size="small" type="text"><icon-link />关联商品</a-button>
              </div>
            </div>
            <a-empty v-if="results.length === 0" description="暂无生成记录" />
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus, IconVideo, IconDownload, IconLink } from '@arco-design/web-vue/icon'

const generating = ref(false)
const form = reactive({
  prompt: '',
  duration: 5,
  resolution: '1080p',
  style: 'product-showcase',
})

const queue = ref<any[]>([])
const results = ref<any[]>([])

function getStatusColor(status: string): string {
  return ({ pending: 'blue', processing: 'orangered', completed: 'green', failed: 'red' })[status] || 'default'
}

async function handleGenerate() {
  if (!form.prompt.trim()) {
    Message.warning('请输入提示词')
    return
  }

  generating.value = true
  const newTask = {
    id: Date.now(),
    prompt: form.prompt,
    status: 'processing',
    progress: 30,
    duration: form.duration,
  }
  queue.value.unshift(newTask)

  try {
    // TODO: 调用 Seedance API
    await new Promise(resolve => setTimeout(resolve, 3000))
    Message.success('视频生成成功!')
    newTask.status = 'completed'
    newTask.progress = 100
    results.value.unshift(newTask)
    queue.value = queue.value.filter(t => t.id !== newTask.id)
  } catch (e) {
    Message.error('生成失败')
    newTask.status = 'failed'
  } finally {
    generating.value = false
  }
}
</script>

<style scoped lang="less">
.video-generator-page {
  .prompt-hint, .form-hint { font-size:12px; color:#86909c; margin-top:6px; }

  .queue-list {
    max-height:300px; overflow-y:auto;
    .queue-item{ padding:12px 0;border-bottom:1px solid var(--color-fill-2);
      &:last-child{border-bottom:none}
      .task-info{ display:flex;align-items:center;gap:8px;margin-bottom:8px;
        .task-prompt{ font-size:13px;color:var(--color-text-1); overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      }
    }
  }

  .result-grid{
    display:grid; grid-template-columns:repeat(2,1fr); gap:12px;
    .result-item{
      padding:12px; border-radius:8px; border:1px solid var(--color-border); text-align:center;
      .video-thumb{ height:100px;background:var(--color-fill-2); border-radius:6px;display:flex; align-items:center;justify-content:center;margin-bottom:8px;}
      p{ font-size:12px;color:var(--color-text-2);margin:0 0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .actions{display:flex; justify-content:center; gap:8px;}
    }
  }
}
</style>
