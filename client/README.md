# Bozone ERP - Vue 3 前端

基于 **Vue 3 + Arco Design Pro** 的 TikTok Shop 智能运营平台前端。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | Composition API |
| TypeScript | 5.3+ | 类型安全 |
| Vite | 5.0+ | 构建工具 |
| Pinia | 2.1+ | 状态管理 |
| Vue Router | 4.2+ | 路由管理 |
| Axios | 1.6+ | HTTP 客户端 |
| ECharts + vue-echarts | - | 图表库 |
| Arco Design Vue | 2.55+ | UI 组件库 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (默认端口 5173)
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── api/              # API 接口定义 (Axios 封装)
├── components/       # 公共组件
│   └── common/       # PageHeader, StatusBadge 等
├── views/            # 页面组件
│   ├── login/        # 登录页
│   ├── dashboard/    # 仪表盘
│   ├── shops/        # 店铺管理
│   ├── orders/       # 订单管理
│   ├── products/     # 商品管理
│   ├── finance/      # 财务核算
│   ├── influencers/  # 达人BD
│   ├── ai-studio/    # AI工作室 (素材库/视频生成)
│   ├── inventory/    # 库存管理
│   ├── ads/          # 广告管理
│   ├── audit-logs/   # 操作日志
│   └── settings/     # 系统设置
├── layouts/          # 布局组件
│   └── DefaultLayout.vue  # 主布局 (侧边栏+顶栏+内容区)
├── stores/           # Pinia Store (状态管理)
│   ├── user.store.ts # 用户信息
│   └── app.store.ts  # 全局状态
├── router/           # 路由配置
├── styles/           # 全局样式
└── utils/            # 工具函数
```

## API 对接

所有 API 接口定义在 `src/api/` 目录下，与后端 Hono 服务器的 REST API 一一对应：

- `/api/auth/jwt/*` → 认证相关
- `/api/dashboard/*` → 仪表盘数据
- `/api/tiktok/*` → 店铺管理
- `/api/orders/*` → 订单管理
- `/api/products/*` → 商品管理
- `/api/finance/*` → 财务核算
- `/api/influencers/*` → 达人 BD
- `/api/materials/*` → 素材库
- `/api/inventory/*` → 库存管理
- `/api/ads/*` → 广告管理
- `/api/audit-logs/*` → 审计日志
- `/api/settings/*` → 系统设置

## 开发代理

开发环境通过 Vite Proxy 将 `/api` 请求转发到后端服务器：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
```

## 构建部署

```bash
npm run build
```

构建产物输出到 `client/dist/`，由后端 Hono 服务器提供静态文件服务。

## 用户角色权限

| 角色 | 权限范围 |
|------|----------|
| admin (管理员) | 所有功能 |
| manager (运营主管) | 数据查看 + 订单/商品/达人管理 |
| finance (财务) | 财务模块 + 只读其他 |
| operator (运营专员) | 订单处理 + 达人登记 + 素材上传 |
