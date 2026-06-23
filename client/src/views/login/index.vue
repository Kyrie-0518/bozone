<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="/favicon.svg" alt="Bozone" class="login-logo" />
        <h1 class="login-title">Bozone ERP</h1>
        <p class="login-subtitle">TikTok Shop 智能运营平台</p>
      </div>

      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        @submit="handleLogin"
      >
        <a-form-item field="email" hide-label>
          <a-input
            v-model="formData.email"
            placeholder="请输入邮箱"
            size="large"
            allow-clear
          >
            <template #prefix><icon-user /></template>
          </a-input>
        </a-form-item>

        <a-form-item field="password" hide-label>
          <a-input-password
            v-model="formData.password"
            placeholder="请输入密码"
            size="large"
            allow-clear
            @press-enter="handleLogin"
          >
            <template #prefix><icon-lock /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model="rememberMe">记住我</a-checkbox>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            long
            size="large"
            :loading="loading"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="login-footer">
        <p>默认测试账号: super@bozone.cn / Bozone2024!</p>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="copyright">
      &copy; 2024-2026 Bozone. All rights reserved.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconUser, IconLock } from '@arco-design/web-vue/icon'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const rememberMe = ref(true)

const formData = reactive({
  email: '',
  password: '',
})

const formRules = {
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '邮箱格式不正确' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '密码长度不能少于6位' },
  ],
}

async function handleLogin() {
  try {
    const errors = await formRef.value?.validate()
    if (errors) return

    loading.value = true
    const success = await userStore.login({
      email: formData.email,
      password: formData.password,
    })

    if (success) {
      Message.success('登录成功!')
      // 跳转到之前访问的页面或首页
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    }
  } catch (error: any) {
    console.error('Login error:', error)
    Message.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.login-subtitle {
  color: #86909c;
  margin: 0;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;

  p {
    color: #c9cdd4;
    font-size: 12px;
    margin: 0;
  }
}

.copyright {
  position: fixed;
  bottom: 24px;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}
</style>
