# Bozone ERP

TikTok Shop 专精 SaaS ERP

## 项目结构

```
bozone/
├── client/             # 前端 (React 19 + Vite + shadcn/ui)
│   └── src/
│       ├── features/   # 按模块组织页面
│       │   ├── dashboard/     # 仪表盘
│       │   ├── shops/         # 店铺管理
│       │   ├── orders/        # 订单管理
│       │   ├── products/      # 商品管理
│       │   ├── finance/       # 财务核算 ⭐核心
│       │   ├── influencers/   # 达人BD
│       │   ├── ai-studio/     # AI工作室
│       │   ├── inventory/     # 库存管理
│       │   ├── ads/           # 广告管理
│       │   └── settings/      # 系统管理
│       ├── components/  # 全局组件
│       ├── routes/      # 路由定义
│       └── stores/      # Zustand 状态管理
│
├── server/             # 后端 (Hono + SQLite + Drizzle ORM)
│   └── src/
│       ├── routes/      # API 路由（对应前端各模块）
│       ├── services/    # 第三方服务（TikTok OAuth等）
│       ├── middleware/  # 中间件（JWT、日志等）
│       ├── db.ts        # 数据库连接
│       ├── db-schema.ts # 数据表定义
│       └── index.ts     # 服务入口
│
├── docs/               # 设计文档 & PRD
├── tools/              # 部署/测试工具脚本
├── ecosystem.config.cjs # PM2 生产环境配置
└── logs/               # PM2 运行日志
```

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19, Vite, shadcn/ui, TanStack Router/Query/Table, Recharts, Zustand |
| 后端 | Hono, Drizzle ORM, SQLite, JWT RBAC |
| API | TikTok Shop Open API (OAuth 已打通) |
| 部署 | PM2 + Nginx 反向代理 |

## 本地开发

```bash
# 后端
cd server
cp .env.example .env   # 编辑配置
npm install
npm run dev             # http://localhost:3001

# 前端
cd client
npm install
npm run dev             # http://localhost:5174
```

## 生产部署

```bash
# 上传 server/src 和 client/src 到服务器后:
cd /www/wwwroot/bozone
pm2 restart ecosystem.config.cjs --env production
```

## 开发路线图

详见 [docs/PRD.md](docs/PRD.md)
