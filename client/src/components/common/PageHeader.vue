<template>
  <div class="page-header">
    <div class="header-left">
      <h2 class="title">
        <span class="icon-wrapper" v-if="$slots.icon || icon">
          <slot name="icon"><component :is="icon" /></slot>
        </span>
        {{ title }}
      </h2>
      <p v-if="description" class="description">{{ description }}</p>
    </div>
    <div class="header-right" v-if="$slots.extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string | object
}>()
</script>

<style scoped lang="less">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;

  .header-left {
    .title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 600;
      color: #1d2129;
      margin-bottom: 6px;
    }

    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
      font-size: 18px;
    }

    .description {
      font-size: 14px;
      color: #86909c;
      margin: 0;
      padding-left: 42px; // 与图标对齐
    }
  }
}
</style>
