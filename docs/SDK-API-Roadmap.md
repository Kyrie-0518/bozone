# Bozone SDK 对接 — 开发路线图 v2.0

> **基于**: TikTok Shop 官方 Node.js SDK (`nodejs_sdk_extracted/`)
> **SDK 规模**: 104 个 API 文件 / ~220+ 个方法 / 2381 个模型定义
> **当前状态**: 项目手搓 HTTP 请求，仅用 ~5 个方法
> **确认日期**: 2026-06-08 (用户已选模块)

---

## 已选模块（11/18）

| # | 模块 | 文件数 | 方法数 | 状态 |
|---|------|:------:|:------:|:----:|
| 📦 | 订单 Order | 5 | ~8 | ⬜ 待开发 |
| 👥 | 达人 AffiliateSeller(卖家端) | 13 | **~40+** | ⬜ 待开发 |
| 📊 | 数据分析 Analytics | 7 | **~12** | ⬜ 待开发 |
| 🚚 | 发货履约 Fulfillment | 8 | **~20** | ⬜ 待开发 |
| 🚛 | 物流 Logistics | 3 | ~4 | ⬜ 待开发 |
| ↩️ | 售后退款 ReturnRefund | 6 | **~12** | ⬜ 待开发 |
| 🏪 | 商品 Product | 13 | **~35+** | ⬜ 部分在用，待扩展 |
| 💰 | 财务 Finance | 4 | ~6 | ⬜ 部分在用，待扩展 |
| 🎟️ | 营销 Promotion | 3 | ~10 | ⬜ 待开发 |
| 🎧 | 客服 CustomerService | 7 | ~15 | ⬜ 待开发 |
| 📦 | 供应链 SupplyChain | 1 | ~1 | ⬜ 待开发 |

### 未选模块（7/18）

| # | 模块 | 不选原因 |
|---|------|---------|
| 🎬 | AffiliatePartner(MCN端) | 你是卖家不是 MCN |
| 🎤 | AffiliateCreator(达人端) | 这是达人用的，不是卖家用的 |
| 🔗 | Authorization | ✅ 已实现 |
| 📡 | Event/Webhook | 可后续加 |
| 🛒 | Seller | ✅ 已实现 |
| 📋 | DataReconciliation | P2 后续 |
| 🌐 | Open Platform | 给第三方开发者用的，与你无关 |

---

# Phase 1 — 立即做（本周）

## P0-1: 订单 Order（5 版本 8 方法）

### 当前问题
- `orders/search` 返回的 `line_items[].skuImage` 未存入 DB → 前端商品列显示占位符 📦
- 没有调用 `OrdersGet` 批量详情 → 侧边栏数据不完整
- 没有价格明细 → 财务核算缺少费用拆解

### 任务清单

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| O-001 | 存储SKU图片 | `OrdersSearchPost` 返回值 | 同步时解析 `line_items[].skuImage` 写入 orderItem 表 |
| O-002 | 前端展示商品图 | - | 订单表格用 `<img src={item.skuImage}>` 替代 📦 占位符 |
| O-003 | 订单详情增强 | `orderV202309Api.OrdersGet` | 点击行→侧边栏展示完整信息（含包裹/税费/物流商/运单号） |
| O-004 | 价格明细对接 | `orderV202407Api.OrdersOrderIdPriceDetailGet` | 财务模块使用：优惠券/税/折扣/运费逐项拆解 |
| O-005 | 盲盒开箱回调(US) | `orderV202511Api.OrdersBlindBoxResultCallbackPost` | US市场盲盒商品开箱后更新实际SKU图 |

### LineItems 完整可用字段（官方SDK模型）
```
id, skuId, sellerSku, skuName, ★skuImage(URL), productName, productId,
salePrice, originalPrice, platformDiscount, sellerDiscount, currency,
displayStatus, trackingNumber, packageId, packageStatus,
shippingProviderName, shippingProviderId,
cancelReason, cancelUser, itemTax[], rtsTime,
isGift, isDangerousGood, isUnboxingItem, combinedListingSkus[], subItemInfo[]
```

---

# Phase 1 — 并行: 达人 BD 二期升级

## P0-2: 达人 AffiliateSeller（13版本 40+ 方法）

### 核心价值
- 从纯本地 CRUD → **TikTok 数据驱动的达人管理平台**
- 自动拉取粉丝量、视频均播、GMV、佣金率等真实数据
- 站内私信建联替代手动登记联系方式

### 2.1 达人发现与数据（P0）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| AS-001 | 达人发现页 | `sellerSearchCreatorOnMarketplace` | 搜索框 + 筛选器（粉丝量区间/GMV区间/地区/类目/性别/年龄）|
| AS-002 | 达人详情画像 | `getMarketplaceCreatorPerformance` | 完整达人卡片：头像/昵称/简介/**粉丝量*/主页链接/均播/GMV/互动率/合作品牌/直播数/视频数/佣金率 |

**AS-001 返回字段**:
```
username, nickname, avatar{url}, follower_count, selection_region,
avg_ec_video_view_count, avg_ec_live_uv,
gmv{amount,currency}, live_gmv, video_gmv, gmv_range{formatted},
units_sold_range{formatted}, top_follower_demographics
```

**AS-002 返回字段（超丰富）**:
```
基础: username, nickname, avatar.url, bio_description, profile_tt_uri, follower_count
合作: top_collaborated_brand_ids, brand_collaboration_count, promoted_product_num
内容: ec_live_count, ec_video_count, avg_ec_video_play_count
带货: units_sold, units_sold_range, gmv, video_gmv, live_gmv, gmv_range
效率: ec_live_engagement_rate, avg_commission_rate, avg_commission_rate_range
利润: gpm, live_gpm, video_gpm, gpm_range, video_gpm_range
分布: category_gmv_distribution[], content_gmv_distribution[], product_original_price_range
```

### 2.2 达人建联沟通（P1）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| AS-003 | 发起对话 | `createConversationWithCreator` / `createConversationwithCreator` | 选达人→点"联系"→自动建会话 |
| AS-004 | 对话列表 | `getConversationList` | 所有会话列表（头像/最后消息时间/未读数）|
| AS-005 | 聊天窗口 | `getMessageInTheConversation` + `sendImMessage` | 消息收发界面 |
| AS-006 | 未读提醒 | `getLatestUnreadMessages` + `markConversationRead` | 红点/已读状态 |

### 2.3 合作管理（P1）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| AS-007 | 定向合作 CRUD | `createTargetCollaboration` / `searchTargetCollaborations` / `updateTargetCollaboration` / `queryTargetCollaborationDetail` / `removeTargetCollaboration` | 创建→列表→编辑→详情→删除 |
| AS-008 | 公开招募活动 | `createOpenCollaboration` / `searchOpenCollaborations` / `editOpenCollaborationSettings` / `getOpenCollaborationSettings` / `removeOpenCollaboration` / `removeCreatorFromOpenCollaboration` / `getOpenCollaborationCreatorContentDetail` | 发布活动→审核申请→管理成员→查看达人内容 |
| AS-009 | 推广链接生成 | `generateAffiliateProductPromotionLink` | 一键生成商品推广短链 |

### 2.4 寄样管理全流程（P1）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| AS-010 | 寄样申请列表 | `sellerSearchSampleApplications` | 达人提交的寄样申请（状态筛选）|
| AS-011 | 审核(通过/拒绝) | `sellerReviewSampleApplications` | 审核操作 + 反馈消息 |
| AS-012 | 寄样规则配置 | `getOpenCollaborationSampleRules` / `editOpenCollaborationSampleRule` | 设置谁可以申请/需要多少粉丝/发几个视频 |
| AS-013 | 发货追踪 | `sellerSearchSampleApplicationsFulfillments` | 寄样发货状态查询 |

### 2.5 带货效果 & 佣金（P1）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| AS-014 | 达人带货订单 | `searchSellerAffiliateOrders` | 按达人/商品/时间/状态筛选联盟订单 |
| AS-015 | 效果看板 | 结合 Analytics 的 `getShopVideoPerformanceList`(account_type=AFFILIATES) | 视频 GMV/播放量/CTR 排行 |
| AS-016 | 佣金结算计算 | 基于 AS-014 订单数据 × 各达人佣金率 | 自动算出应付佣金 |

---

# Phase 2 — 两周内

## P1-3: 数据分析 Analytics（7版本 12方法）

### 3.1 视频效果分析（★ 核心亮点功能）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| AN-001 | 店铺视频列表+数据 | `analytics.getShopVideoPerformanceList` | 所有店铺视频：标题/**播放量**/GMV/订单/销量/CTR/作者/关联商品/发布时间。支持按 views/gmv/sku_orders 排序 |
| AN-002 | 视频概览图表 | `analytics.getShopVideoPerformanceOverview` | 按天汇总：总GMV/总订单/总销量/CTR 折线图 |
| AN-003 | 单视频详情 | `analytics.getShopVideoPerformanceDetails(video_id)` | 日均**播放量**趋势/GMV趋势/CTR趋势/日均买家数 |
| AN-004 | 视频商品转化 | `analytics.getShopVideoProductPerformanceList(video_id)` | 该视频中各商品的销量/GMV/点击率 |

**AN-001 返回字段**:
```
video{id}, title, username,
gmv{amount,currency}, sku_orders, units_sold, ★views, click_through_rate,
products[{id,name}], video_post_time
支持排序: gmv | sku_orders | units_sold | views | click_through_rate
支持过滤: account_type=ALL | LINKED_ACCOUNTS | AFFILIATES
```

### 3.2 经营数据大盘

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| AN-005 | 店铺经营概览 | `analytics.getShopPerformance` | 整体GMV/转化率/复购率（按天）|
| AN-006 | 商品表现排行 | `analytics.getShopProductPerformanceList` | 全部商品按 GMV 排名 |
| AN-007 | SKU 表现排行 | `analytics.getShopSKUPerformanceList` | 全部 SKU 按 GMV 排名 |
| AN-008 | 单品深度分析 | `analytics.getShopProductPerformance(product_id)` | 单个商品每日表现曲线 |
| AN-009 | 单SKU深度分析 | `analytics.getShopSKUPerformance(sku_id)` | 单 SKU 每日表现曲线 |

---

## P1-4: 发货履约 Fulfillment（8版本 20方法）

### 4.1 发货核心流程

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| FL-001 | 订单拆包检查 | `fulfillment.getOrderSplitAttributes` | 判断订单能否拆为多包裹 |
| FL-002 | 拆单操作 | `fulfillment.splitOrders` | 一个订单拆成多个包裹独立发货 |
| FL-003 | 可用配送方式 | `fulfillment.getEligibleShippingService` | 查询某订单可用的配送方案 |
| FL-004 | 创建发货包裹 | `fulfillment.createPackage` | 正式打包发货（生成 tracking_no）|

### 4.2 包裹管理

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| FL-005 | 包裹搜索 | `fulfillment.searchPackage` | 按状态/时间搜索所有包裹记录 |
| FL-006 | 首公里揽收 | `fulfillment.createFirstMileBundle` | 创建揽收批次 |
| FL-007 | 包裹合并 | `fulfillment.combinablePackage` | 多包裹合并发货 |
| FL-008 | 取消合并 | `fulfillment.uncombinePackages` | 取消包裹合并 |
| FL-009 | 交货时间窗 | `fulfillment.getPackageHandoverTimeSlots(id)` | 预约取件时间 |

---

## P1-5: 物流 Logistics（3版本 4方法）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| LG-001 | 仓库管理 | `logistics.getWarehouseList` | 仓库列表（名称/地址/类型/状态）|
| LG-002 | 全球仓(跨境) | `logistics.getGlobalSellerWarehouse` | 海外仓信息 |
| LG-003 | 配送方式 | `logistics.getWarehouseDeliveryOptions(id)` | 仓→可选配送方式 |
| LG-004 | 物流商 | `logistics.getShippingProviders(id)` | 配送方式→可用物流公司 |

---

## P1-6: 售后退款 ReturnRefund（6版本 12方法）

### 6.1 售后核心

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| RR-001 | 售后资格检查 | `returnRefund.getAftersaleEligibility` | 判断订单能否退货/退款及理由 |
| RR-002 | 退款理由选项 | `returnRefund.getRejectReasons` | 获取平台支持的拒绝理由列表 |
| RR-003 | 创建退货单 | `returnRefund.createReturn` | 发起退货请求 |
| RR-004 | 退货记录搜索 | `returnRefund.searchReturn` | 搜索退货/退款记录（按状态/时间/订单）|
| RR-005 | 操作历史 | `returnRefund.getReturnRecord` | 退货操作日志 |
| RR-006 | 拒绝退货 | `returnRefund.rejectReturn` | 卖家拒绝退货申请 |
| RR-007 | 通过退货 | `returnRefund.approveReturn` | 通过退货（可选择仅退款不退货）|

### 6.2 订单取消

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| RR-008 | 取消订单 | `returnRefund.cancelOrder` | 发起订单取消 |
| RR-009 | 通过取消 | `returnRefund.approveCancellation` | 同意买家取消 |
| RR-010 | 拒绝取消 | `returnRefund.rejectCancellation` | 拒绝买家取消 |
| RR-011 | 取消记录 | `returnRefund.searchCancellation` | 搜索取消记录 |
| RR-012 | 退款预览 | `returnRefund.calculateCancellation` | 取消前预览退款金额 |

> **退货/取消行项目含 `product_image{url,width,height}`** — 有完整商品图

---

## P1-7: 商品 Product 扩展（13版本 35+方法，部分已在用）

### 当前已用
- ✅ `searchProducts` — 商品同步（搜索列表）
- ✅ `getCategories` / `getAttributes` / `getBrands` — 分类/属性/品牌（创建商品时用）

### 待新增

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| PR-001 | 商品完整CRUD | `createProduct` / `updateProduct` / `deleteProduct` / `getProduct` | 在ERP内直接创建/编辑/上下架TikTok商品 |
| PR-002 | 价格批量修改 | `updateProductPrice` | 批量改价 |
| PR-003 | 库存批量修改 | `updateProductInventory` | 批量调库存 |
| PR-004 | 全球商品(跨境) | `createGlobalProduct` / `searchGlobalProduct` / `deleteGlobalProduct` / `getGlobalProduct` / `updateGlobalInventory` | 跨境GTM模式：全球品→本地品映射 |
| PR-005 | 制造商/责任人 | `createManufacturer` / `searchManufacturer` / `createResponsiblePerson` / `searchResponsiblePersons` | 合规信息管理 |
| PR-006 | SEO优化辅助 | `getRecommendedProductTitleAndDescription` / `getProductsSEOWords` | AI推荐标题/描述/SEO词 |
| PR-007 | 尺码表 | `searchSizeCharts` | 尺码表查询 |
| PR-008 | 图片翻译 | `createImageTranslationTasks` / `getImageTranslationTasks` | 多语言图片文字翻译 |
| PR-009 | 全局分类(跨境) | `getGlobalCategories` / `getGlobalAttributes` / `getGlobalCategoryRules` | 跨境通用分类体系 |

---

## P1-8: 财务 Finance 扩展（4版本 6方法，部分已在用）

### 待新增

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| FI-001 | 结算账单 | `finance.getStatements` | 按周期结算单列表（金额/状态/周期）|
| FI-002 | 付款记录 | `finance.getPayments` | 收款明细 |
| FI-003 | 提现记录 | `finance.getWithdrawals` | 提现到银行卡的记录 |
| FI-004 | 订单级交易明细 | `finance.getTransactionsByOrder(orderId)` | **单个订单的费用拆解**（平台佣/联盟佣/运费/税费/手续费）— 利润核算核心 |
| FI-005 | 结算单级交易明细 | `finance.getTransactionsByStatement(params)` | 某笔结算的所有交易项 |

---

## P1-9: 营销 Promotion（3版本 10方法）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| PM-001 | 创建促销活动 | `promotion.createActivity` | 支持满减/百分比折扣/闪购/包邮/多件优惠 |
| PM-002 | 编辑活动 | `promotion.updateActivity` | 修改活动参数 |
| PM-003 | 下线活动 | `promotion.deactivateActivity` | 停止活动 |
| PM-004 | 活动详情 | `promotion.getActivity` | 活动完整信息 |
| PM-005 | 活动搜索 | `promotion.searchActivity` | 按类型/状态/时间搜索 |
| PM-006 | 活动商品管理 | `promotion.updateActivityProduct` / `removeActivityProduct` | 添加/移除活动中商品 |
| PM-007 | 优惠券 | `promotion.getCoupon` / `promotion.searchCoupon` | 优惠券详情/列表 |

---

## P1-10: 客服 CustomerService（7版本 15方法）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| CS-001 | 工单系统 | customerService 各版本API | 处理售后纠纷工单 |
| CS-002 | 消息回复 | 同上 | 回复买家消息 |
| CS-003 | 关闭工单 | 同上 | 解决问题后关闭 |
| CS-004 | 评价管理 | 同上 | 回复评价/处理差评 |
| ... | （具体需细读 7 个版本的 15 个方法） | | |

---

## P1-11: 供应链 SupplyChain（1版本 1方法）

| ID | 任务 | SDK 方法 | 说明 |
|----|------|---------|------|
| SC-001 | 供应链节点 | supplyChain API | 入库/出库/调拨管理 |

---

# Phase 3 — 月内规划（P2 低优先级）

| ID | 模块 | 内容 | 备注 |
|----|------|------|------|
| P2-01 | Webhook事件订阅 | `event.updateShopWebhook` | 订单变更实时推送，替代轮询同步 |
| P2-02 | 数据对账 | DataReconciliation | 系统订单 vs TikTok 订单自动核对 |
| P2-03 | MCN管理 | AffiliatePartner | 如果未来做 MCN 业务 |
| P2-04 | 达人端视角 | AffiliateCreator | 如果要给达人提供后台 |
| P2-05 | 高级分析 | 更多Analytics新版本字段 | 转化漏斗/留存/复购 |

---

# 技术债务

| ID | 债务 | 说明 | 影响 |
|----|------|------|------|
| DEBT-001 | **SDK迁移** | 将手搓 HTTP → 官方SDK (`nodejs_sdk_extracted`) | 类型安全 + 减少维护成本 |
| DEBT-002 | **OAuth Scope扩展** | 申请 affiliate_seller / analytics / fulfillment 等权限 | 新API才能调用 |
| DEBT-003 | **依赖处理** | 官方SDK用 `request` 库，可能需适配 fetch | 兼容性风险 |
| DEBT-004 | **npm包清理** | 移除未使用的 `tiktok-shop-sdk`（第三方包） | 减小 bundle |
| DEBT-005 | **盲盒支持(US)** | orderV202511/202605 的盲盒开箱回调 | US市场特需 |

---

# 实施顺序建议

```
Week 1:
├── O-001~O-005: 订单SKU图片+详情+价格（解决前端空图问题）⭐ 最紧急
├── DEBT-001~002: SDK迁移准备 + Scope申请
│
Week 2:
├── AS-001~AS-002: 达人发现+画像（BD二期核心）⭐ 商业价值最高
├── AN-001~AN-004: 视频效果分析（差异化功能）⭐ 用户最直观感知
│
Week 3-4:
├── FL-001~FL-004: 发货履约
├── RR-001~RR-007: 售后退款
├── AS-003~AS-016: 达人其余功能（建联/合作/寄样/佣金）
│
Week 5-6:
├── PR-001~PR-009: 商品CRUD扩展
├── FI-001~FI-005: 财务扩展
├── AN-005~AN-009: 经营数据分析
├── PM-001~PM-007: 营销活动
└── LG/CS/SC: 物流/客服/供应链
```
