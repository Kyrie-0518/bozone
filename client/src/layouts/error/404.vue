<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面不存在</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除。</p>
      <a-button type="primary" size="large" @click="$router.push('/')">返回首页</a-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f3f0;

  .error-content {
    text-align: center;

    .error-code {
      font-size: 120px;
      font-weight: 700;
      color: #e8e5e0;
      line-height: 1.2;
    }

    .error-title {
      font-size: 24px;
      color: #1d2129;
      margin-bottom: 12px;
    }

    .error-desc {
      font-size: 14px;
      color: #86909c;
      margin-bottom: 32px;
    }
  }
}
</style>
