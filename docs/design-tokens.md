# Bozone 设计系统参考

> 本文档是 UI 开发的快速参考，所有新页面必须遵循此规范

---

## 颜色体系

### 主题色（Warm Industrial — Amber 暖琥珀）

| Token | 用途 | 色值 |
|-------|------|------|
| `--primary` | 主按钮、高亮、关键操作 | Amber #D97706 |
| `--brand` | 仪表盘点缀、链接、信息 | Blue #2563EB |
| `--success` | 成功/已完成/已签收 | Green #059669 |
| `--danger` | 删除/错误/已取消 | Red #DC2626 |
| `--warning` | 预警/待处理 | Orange #D97706 |

### 灰色阶

| Token | 用途 |
|-------|------|
| `--background` | 页面背景 |
| `--card` | 卡片背景 |
| `--foreground` | 主文字色 |
| `--muted-foreground` | 次要文字/说明 |
| `--border` | 边框/分割线 |

### 使用方法

```tsx
// ✅ 正确：使用 CSS 变量
<div className="text-primary bg-card border-border" />

// ❌ 错误：硬编码颜色
<div className="text-[#D97706]" />
```

---

## 圆角规范

| 级别 | 值 | 用途 |
|------|-----|------|
| 小 `rounded-md` | 6px | 标签、小按钮、输入框 |
| 中 `rounded-lg` | 10px | 卡片、模态框 |
| 大 `rounded-xl` | 14px | 弹窗、大容器 |

---

## 组件规范

### 页面标题

所有页面必须使用 `PageHeader` 组件：

```tsx
import { PageHeader } from '@/components/page-header'
import { ShoppingCart } from 'lucide-react'

<PageHeader
  icon={ShoppingCart}
  title="订单管理"
  subtitle="追踪和管理所有跨境订单"
>
  <Button>同步订单</Button>
</PageHeader>
```

### 搜索/筛选栏

使用 `SearchFilterBar` 包装：

```tsx
import { SearchFilterBar } from '@/components/search-filter-bar'

<SearchFilterBar>
  <Input placeholder="搜索..." className="w-48" />
  <SelectDropdown ... />
</SearchFilterBar>
```

### 表格容器

```tsx
<Card className="rounded-lg shadow-sm border-0">
  <CardContent>
    <Table>...</Table>
  </CardContent>
</Card>
```

### 状态标签

```tsx
import { StatBadge } from '@/components/stat-badge'

<StatBadge variant="success">已签收</StatBadge>
<StatBadge variant="warning">待发货</StatBadge>
<StatBadge variant="danger">已取消</StatBadge>
```

---

## Tailwind v4 注意事项

本项目使用 Tailwind CSS v4（通过 `@tailwindcss/vite` 插件），与 v3 的主要区别：

- **配置文件**：不再使用 `tailwind.config.ts`，配置在 CSS 文件中用 `@theme` 指令
- **CSS 变量**：通过 `@theme inline` 注册为 Tailwind utility
- **暗色模式**：使用 `.dark` class + CSS 变量切换

---

## 图标使用

所有图标统一使用 `lucide-react`，不要引入其他图标库。

```tsx
import { Package, Truck, DollarSign, ShoppingCart } from 'lucide-react'
```
