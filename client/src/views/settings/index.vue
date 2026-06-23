<template>
  <div class="settings-page">
    <PageHeader title="系统设置" description="系统配置与用户管理">
      <template #extra>
        <a-button type="primary" :loading="saving" @click="handleSave"><icon-check />保存设置</a-button>
      </template>
    </PageHeader>

    <a-row :gutter="20">
      <!-- 左侧：基本设置 -->
      <a-col :span="14">
        <a-card title="基本设置" :bordered="false">
          <a-form :model="settings" layout="vertical">
            <a-form-item label="站点名称">
              <a-input v-model="settings.siteName" placeholder="Bozone ERP" />
            </a-form-item>
            <a-form-item label="默认货币">
              <a-select v-model="settings.defaultCurrency">
                <a-option value="MYR">马来西亚令吉 (MYR)</a-option>
                <a-option value="USD">美元 (USD)</a-option>
                <a-option value="GBP">英镑 (GBP)</a-option>
                <a-option value="EUR">欧元 (EUR)</a-option>
                <a-option value="CNY">人民币 (CNY)</a-option>
              </a-select>
            </a-form-item>

            <a-divider>汇率配置</a-divider>

            <a-row :gutter="16" v-for="(rate, currency) in settings.exchangeRates || {}" :key="currency">
              <a-col :span="6">{{ getCurrencyName(currency) }} ({{ currency }})</a-col>
              <a-col :span="10">
                <a-input-number v-model.number="settings.exchangeRates[currency]" :min="0" :precision="4" style="width:100%;" hide-button>
                  <template #suffix>→ CNY</template>
                </a-input-number>
              </a-col>
              <a-col :span="8" style="display:flex;align-items:center;">
                <span class="rate-hint">1 {{ currency }} = {{ rate }} CNY</span>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </a-col>

      <!-- 右侧：用户管理 -->
      <a-col :span="10">
        <a-card title="用户管理" :bordered="false">
          <template #extra><a-button type="text" @click="showAddUser=true"><icon-plus />新增用户</a-button></template>

          <a-list :data-source="users" size="small">
            <template #item="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar style="background-color:#2563eb;">{{ item.name?.charAt(0) }}</a-avatar>
                  </template>
                  <template #title>{{ item.name }}</template>
                  <template #description>{{ item.email }}</description>
                </a-list-item-meta>
                <template #actions>
                  <a-tag :color="{admin:'red',manager:'orange',finance:'blue',operator:'green'}[item.role]">
                    {{ {admin:'管理员',manager:'运营主管',finance:'财务',operator:'运营'}[item.role]||item.role }}
                  </a-tag>
                  <a-button type="text" size="small">编辑</a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>

          <a-empty v-if="users.length===0" description="暂无用户" />
        </a-card>

        <!-- 系统信息 -->
        <a-card title="系统信息" :bordered="false" style="margin-top:16px;">
          <a-descriptions :column="1" size="medium" bordered>
            <a-descriptions-item label="版本">v1.3.0</a-descriptions-item>
            <a-descriptions-item label="框架">Vue 3 + Arco Design</a-descriptions-item>
            <a-descriptions-item label="后端">Hono + MySQL</a-descriptions-item>
            <a-descriptions-item label="数据库">MySQL</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <!-- 新增用户弹窗 -->
    <a-modal v-model:visible="showAddUser" title="新增用户" unmount-on-close ok-text="创建" cancel-text="取消" @ok="handleCreateUser">
      <a-form :model="newUser" layout="vertical">
        <a-form-item label="姓名" required><a-input v-model="newUser.name" /></a-form-item>
        <a-form-item label="邮箱" required><a-input v-model="newUser.email" /></a-form-item>
        <a-form-item label="密码" required><a-input-password v-model="newUser.password" /></a-form-item>
        <a-form-item label="角色" required>
          <a-select v-model="newUser.role">
            <a-option value="operator">运营专员</a-option>
            <a-option value="finance">财务</a-option>
            <a-option value="manager">运营主管</a-option>
            <a-option value="admin">管理员</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconCheck, IconPlus } from '@arco-design/web-vue/icon'
import { getSettingsApi, updateSettingsApi, getUserListApi, createUserApi } from '@/api/settings.api'

const saving = ref(false)
const showAddUser = ref(false)
const settings = reactive<any>({ siteName: 'Bozone ERP', defaultCurrency: 'MYR', exchangeRates: { MYR: 1.68, USD: 7.24, GBP: 9.12, EUR: 7.85 } })
const users = ref<any[]>([])
const newUser = reactive({ name: '', email: '', password: '', role: 'operator' })

function getCurrencyName(code: string): string {
  return ({ MYR:'马来西亚令吉', USD:'美金', GBP:'英镑', EUR:'欧元', CNY:'人民币' })[code] || code
}

async function fetchSettings() {
  try {
    const res: any = await getSettingsApi()
    Object.assign(settings, res.data || res)
  } catch (e) { console.error(e) }
}

async function fetchUsers() {
  try {
    const res: any = await getUserListApi()
    users.value = res.data?.data || []
  } catch (e) { console.error(e) }
}

async function handleSave() {
  saving.value = true
  try {
    await updateSettingsApi(settings as any)
    Message.success('保存成功')
  } catch (e: any) { Message.error(e.message || '保存失败') }
  finally { saving.value = false }
}

async function handleCreateUser() {
  if (!newUser.name || !newUser.email || !newUser.password) {
    return Message.warning('请填写完整信息')
  }
  try {
    await createUserApi(newUser as any)
    Message.success('用户创建成功')
    showAddUser.value = false
    newUser.name = ''; newUser.email = ''; newUser.password = ''
    fetchUsers()
  } catch (e: any) { Message.error(e.message || '创建失败') }
}

onMounted(() => { Promise.all([fetchSettings(), fetchUsers()]) })
</script>

<style scoped lang="less">
.settings-page .rate-hint{font-size:12px;color:#86909c;}
</style>
