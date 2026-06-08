# TikTok Shop 官方 SDK — 全部 API 清单（104 个文件，312+ 个方法）

> 来源: `nodejs_sdk_extracted/api/` (TikTok Shop Official Node.js SDK)
> 生成日期: 2026-06-08
> 用法: 在你需要的模块前打 ✅ 或标注优先级

---

## 一、📦 订单 Order（5 版本 8 方法）

### orderV202309Api.ts（核心版本）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| 1 | `OrdersGet(ids, token)` | GetOrderDetail | **批量获取订单详情**（最多50个ID），含行项目(skuImage/skuName/价格/税费/包裹状态) |
| 2 | `OrdersSearchPost(body)` | GetOrderList | **搜索订单列表**，支持状态/时间/买家ID过滤，分页返回 |

### orderV202407Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| 3 | `OrdersOrderIdPriceDetailGet(id)` | GetPriceDetail | **获取订单价格明细**（优惠券/税/平台折扣/运费拆解） |

### orderV202507Api.ts（新版）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| 4 | `OrdersGet(ids, token)` | GetOrderDetail | 新版订单详情接口 |

### orderV202511Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| 5 | `OrdersBlindBoxResultCallbackPost()` | UpdateTheBlindBoxOpeningResults | **盲盒开箱结果回调**（US市场，开箱后更新实际SKU图片和名称）|

### orderV202605Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| 6 | `OrdersBlindBoxResultCallbackPost()` | UpdateTheBlindBoxOpeningResults | 盲盒开箱结果回调(新版) |

---

## 二、👥 达人联盟 — AffiliateSeller（卖家视角，13 版本 40+ 方法）

> **卖家主动找达人、管理合作、发消息、审核寄样的全部能力**

###affiliateSellerV202603Api.ts（最新版）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| S1 | `SellerSearchCreatoronMarketplace()` | SellerSearchCreatoronMarketplace | **在达人市场搜索达人**（按粉丝量/GMV/地区/类目筛选）|
| S2 | `GetMarketplaceCreatorPerformance(id)` | GetMarketplaceCreatorPerformance | **获取达人详细带货数据**（粉丝/GMV/视频均播/佣金率/合作品牌）|
| S3 | `CreateConversationwithcreator()` | CreateConversationwithcreator | **发起与达人的私信对话** |
| S4 | `GetConversationList()` | GetConversationList | 获取所有对话会话列表 |
| S5 | `GetMessageintheConversation(id)` | GetMessageintheConversation | 读取某个对话的聊天记录 |
| S6 | `SendIMMessage(id)` | SendIMMessage | 给达人发送消息 |
| S7 | `CreateTargetCollaboration()` | CreateTargetCollaboration | **创建定向合作计划**（指定达人ID + 目标 + 佣金）|
| S8 | `SearchTargetCollaborations()` | SearchTargetCollaborations | 搜索定向合作列表 |
| S9 | `UpdateTargetCollaboration()` | UpdateTargetCollaboration | 更新定向合作内容 |
| S10 | `QueryTargetCollaborationDetail(id)` | QueryTargetCollaborationDetail | 定向合作详情 |
| S11 | `RemoveTargetCollaboration(id)` | RemoveTargetCollaboration | 删除定向合作 |
| S12 | `CreateOpenCollaboration()` | CreateOpenCollaboration | **创建公开招募活动**（达人可自行申请加入）|
| S13 | `SearchOpenCollaborations()` | SearchOpenCollaborations | 搜索公开合作活动列表 |
| S14 | `EditOpenCollaborationSettings()` | EditOpenCollaborationSettings | 编辑公开合作设置（资格规则/申请限制）|
| S15 | `GetOpenCollaborationSettings()` | GetOpenCollaborationSettings | 获取当前合作设置 |
| S16 | `GetOpenCollaborationCreatorContentDetail()` | GetOpenCollaborationCreatorContentDetail | 获取达人提交的内容详情 |
| S17 | `RemoveCreatorFromOpenCollaboration()` | RemoveCreatorFromOpenCollaboration | 从合作中移除达人 |
| S18 | `RemoveOpenCollaboration(productId)` | RemoveOpenCollaboration | 移除开放合作的商品 |
| S19 | `sellerSearchSampleApplications()` | sellerSearchSampleApplications | **搜索寄样申请列表** |
| S20 | `SellerReviewSampleApplications()` | SellerReviewSampleApplications | **审核寄样申请**（通过/拒绝 + 反馈）|
| S21 | `sellerSearchSampleApplicationsFulfillments()` | sellerSearchSampleApplicationsFulfillments | 查询寄样发货状态 |
| S22 | `getOpenCollaborationSampleRules()` | getOpenCollaborationSampleRules | 获取寄样规则 |
| S23 | `editOpenCollaborationSampleRule()` | editOpenCollaborationSampleRule | 编辑寄样规则 |
| S24 | `searchSellerAffiliateOrders()` | searchSellerAffiliateOrders | **搜索达人带货订单**（按达人/商品/时间/状态）|
| S25 | `GenerateAffiliateProductPromotionLink(pid)` | GenerateAffiliateProductPromotionLink | **生成商品推广链接**（给达人推广用）|
| S26 | `sellerSearchAffiliateOpenCollaborationProduct()` | sellerSearchAffiliateOpenCollaborationProduct | 搜索开放合作中的商品 |
| S27 | `MarkConversationRead()` | MarkConversationRead | 标记对话已读 |
| S28 | `getLatestUnreadMessages()` | getLatestUnreadMessages | 获取最新未读消息 |

### 其他历史版本方法（部分新增/变更）
- **V202512**: 新增 `CreateConversationWithCreator()` (新发起对话方式)
- **V202511**: 新增 `SearchOpenCollaboration` / `createOpenCollaboration` / `removeOpenCollaboration` / `removeCreator`
- **V202509**: 基础版对话/合作功能
- **V202508**: 新增寄样相关 API
- **V202507**: 新增寄样搜索/审核
- **V202505**: 新增市场搜索/达人表现
- **V202412**: 对话系统（消息收发/已读/未读）
- **V202410**: 达人订单搜索
- **V202409**: 开放合作设置编辑
- **V202406**: 合作产品搜索
- **V202405**: 核心基础版（编辑设置/移除达人/创建合作/搜索订单/生成链接/定向合作）

---

## 三、🎬 达人联盟 — AffiliatePartner（合作伙伴/MCN视角，6 版本 15+ 方法）

> **MCN/合作伙伴管理旗下达人的数据**

| # | 模块 | 方法 | @summary | 功能说明 |
|---|------|------|---------|---------|
| P1 | Campaign | `CreateAffiliatePartnerCampaign` | 创建联盟营销活动（给达人分配任务）|
| P2 | Campaign | `PublishAffiliatePartnerCampaign` | 发布/上线营销活动 |
| P3 | Campaign | `GetAffiliatePartnerCampaignList` | 营销活动列表 |
| P4 | Campaign | `GetAffiliatePartnerCampaignDetail` | 营销活动详情 |
| P5 | Campaign | `EditAffiliatePartnerCampaign` | 编辑营销活动 |
| P6 | Product | `GetAffiliatePartnerCampaignProductList` | 活动关联的商品列表 |
| P7 | Product | `ReviewAffiliatePartnerCampaignProduct` | 审核活动中的商品 |
| P8 | Link | `GenerateAffiliatePartnerCampaignProductLink` | 生成推广链接 |
| P9 | Orders | `SearchTapAffiliateOrders` | 搜索联盟订单（Tap渠道）|
| P10 | Creator Data | `GetAffiliateCampaignCreatorFulfillmentStatusList` | 达人履约状态列表 |
| P11 | Creator Data | `GetAffiliateCampaignCreatorProductContentStatistics` | **达人商品内容统计**(播放/互动/转化) |
| P12 | Creator Data | `GetAffiliateCampaignCreatorProductSampleStatus` | 达人寄样状态 |
| P13 | Creator Data | `GetAffiliateCampaignCreatorFulfillmentStatusInfo` | 履约详情 |
| P14 | Link | `PartnerGenerateMultiAffiliateCampaignProductLink` | 批量生成多商品推广链接 |

---

## 四、🎤 达人联盟 — AffiliateCreator（达人视角，10 版本 20+ 方法）

> **达人端操作：查看自己的合作/订单/寄样/橱窗商品**

| # | 模块 | 方法 | @summary | 功能说明 |
|---|------|------|---------|---------|
| C1 | Profile | `GetCreatorProfile` | 获取达人个人资料（粉丝数/主页等）|
| C2 | Collaboration | `CreatorSearchOpenCollaborationProduct` | 搜索可参与的合作商品 |
| C3 | Collaboration | `SearchCreatorTargetCollaborations` | 搜索针对自己的定向合作 |
| C4 | Orders | `SearchCreatorAffiliateOrders` | **搜索自己的带货订单**（GMV/佣金/状态）|
| C5 | Sample | `SearchCreatorSampleApplications` | 搜索自己的寄样申请 |
| C6 | Sample | `GetCreatorSampleApplicationDetail` | 寄样申请详情 |
| C7 | Sample | `GetCreatorApplicableSampleLabel` | 可用的寄样标签 |
| C8 | Sample | `CreatorSearchSampleApplicationFulfillments` | 寄样发货追踪 |
| C9 | Showcase | `AddShowcaseProducts` | 添加展示橱窗商品 |
| C10 | Showcase | `GetShowcaseProducts` | 获取橱窗商品列表 |
| C11 | Showcase | `RemoveShowcaseProducts` | 移除橱窗商品 |
| C12 | Showcase | `TopShowcaseProducts` | 置顶橱窗商品 |
| C13 | Link | `GenerateAffiliateSharingLink` | **生成分享推广链接** |
| C14 | Selection | `CreatorSelectAffiliateProduct` | 选择要推广的商品 |
| C15 | DeepLink | `CreatorGetSampleRequestDeeplink` | 寄样请求的深链 |
| C16 | Products | `GetOpenCollaborationProductListByProductIds` | 按商品ID查合作信息 |

---

## 五、📊 数据分析 Analytics（7 版本 12+ 方法）

### analyticsV202405Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| A1 | `getShopPerformance(query)` | GetShopPerformance | **店铺整体经营数据**（GMV/转化/复购，按天汇总）|
| A2 | `getShopProductPerformance(params)` | GetShopProductPerformance | 单个商品表现（按天：销量/GMV/访客）|
| A3 | `getShopProductPerformanceList(query)` | GetShopProductPerformanceList | **全部商品表现排行**（支持排序）|

### analyticsV202406Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| A4 | `getShopSKUPerformance(params)` | GetShopSKUPerformance | 单个 SKU 表现数据 |
| A5 | `getShopSKUPerformanceList(query)` | GetShopSKUPerformanceList | **全部 SKU 排行榜** |

### analyticsV202409Api.ts（★ 视频分析）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| A6 | `getShopVideoPerformanceList(query)` | **GetShopVideoPerformanceList** | **店铺全部视频列表+数据**：播放量/GMV/订单/销量/CTR/作者/关联商品/发布时间 |
| A7 | `getShopVideoPerformanceOverview(query)` | **GetShopVideoPerformanceOverview** | **视频整体概览**（按天汇总 GMV/订单/CTR）|
| A8 | `getShopVideoPerformanceDetails(params)` | **GetShopVideoPerformanceDetails** | **单个视频详情**（日均播放量/GMV/CTR/日均买家数）|
| A9 | `getShopVideoProductPerformanceList(params)` | GetShopVideoProductPerformanceList | **视频中各商品的带货数据** |

### analyticsV202508~V202605（新版）
- 更新了数据字段和查询参数
- 支持更多维度筛选

---

## 六、🚚 发货履约 Fulfillment（8 版本 20+ 方法）

### fulfillmentV202309Api.ts（核心版）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| F1 | `getWarehouseList()` | GetWarehouseList | **仓库列表**（绑定的发货仓）|
| F2 | `getGlobalSellerWarehouse()` | GetGlobalSellerWarehouse | 全球仓（跨境卖家专用）|
| F3 | `getWarehouseDeliveryOptions(id)` | GetWarehouseDeliveryOptions | 仓→可用配送方式 |
| F4 | `getShippingProviders(id)` | GetShippingProviders | 配送方式→可用物流商 |

### fulfillmentV202407Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| F5 | `getOrderSplitAttributes(query)` | **GetOrderSplitAttributes** | 订单能否拆包检查 |
| F6 | `splitOrders(params)` | **SplitOrders** | **拆分订单为多个包裹** |
| F7 | `getEligibleShippingService(params)` | **GetEligibleShippingService** | **可用配送方式查询** |
| F8 | `searchPackage(params)` | SearchPackage | **搜索发货包裹记录** |
| F9 | `createPackage(params)` | **CreatePackage** | **创建发货包裹** |

### fulfillmentV202408~V202601（扩展）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| F10 | `createFirstMileBundle(params)` | CreateFirstMileBundle | 创建首公里揽收批次 |
| F11 | `searchCombinablePackages(params)` | SearchCombinablePackages | 查询可合并包裹 |
| F12 | `combinablePackage(body)` | CombinablePackage | 合并多个包裹 |
| F13 | `uncombinePackages(body)` | UncombinePackages | 取消合并包裹 |
| F14 | `getPackageHandoverTimeSlots(id)` | GetPackageHandoverTimeSlots | 包裹交货时间窗口 |

---

##七、↩️ 售后退款 ReturnRefund（6 版本 12+ 方法）

### returnRefundV202309Api.ts（核心版）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| R1 | `getAftersaleEligibility(params)` | **GetAftersaleEligibility** | **售后资格检查**（能否退货/退款）|
| R2 | `getRejectReasons(query)` | GetRejectReasons | 获取拒绝退货的理由选项 |
| R3 | `createReturn(params)` | **CreateReturn** | **创建退货请求** |
| R4 | `searchReturn(params)` | **SearchReturn** | **搜索退货/退款记录** |
| R5 | `getReturnRecord(params)` | GetReturnRecord | 退换操作记录历史 |
| R6 | `rejectReturn(params)` | RejectReturn | **拒绝退货请求** |
| R7 | `approveReturn(params)` | ApproveReturn | **通过退货/退款请求** |

### returnRefundV202309Api.ts（取消订单）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| R8 | `cancelOrder(body)` | **CancelOrder** | **取消订单**（发货前）|
| R9 | `approveCancellation(params)` | ApproveCancellation | 通过买家的取消请求 |
| R10 | `rejectCancellation(params)` | RejectCancellation | 拒绝买家的取消请求 |
| R11 | `searchCancellation(params)` | SearchCancellation | 搜索取消记录 |
| R12 | `calculateCancellation(body)` | CalculateCancellation | 预览取消时的退款金额 |

### V202512~V202604（新版更新）

---

## 八、🚛 物流 Logistics（3 版本 4+ 方法）

### logisticsV202309Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| L1 | `getWarehouseList()` | GetWarehouseList | 仓库列表 |
| L2 | `getGlobalSellerWarehouse()` | GetGlobalSellerWarehouse | 全球仓（跨境）|
| L3 | `getWarehouseDeliveryOptions(id)` | GetWarehouseDeliveryOptions | 仓→配送方式 |
| L4 | `getShippingProviders(id)` | GetShippingProviders | 物流商列表 |

### logisticsV202510~V202604（新版）
- 新增物流追踪、面单打印等能力

---

## 九、🏪 商品 Product（13 版本 35+ 方法）

### productV202309Api.ts（核心版）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| PR1 | `getCategories(query)` | GetCategories | 商品分类树 |
| PR2 | `getCategoryRules(params)` | GetCategoryRules | 分类规则/要求 |
| PR3 | `getAttributes(params)` | GetCategoryAttributes | 分类属性定义 |
| PR4 | `getCategoryAssets()` | GetCategoryAssets | 分类所需资产（品牌/证书等）|
| PR5 | `getBrands(query)` | GetBrands | 品牌列表 |
| PR6 | `createCustomBrands(body)` | CreateCustomBrands | 创建自定义品牌 |
| PR7 | `searchProducts(params)` | **SearchProducts** | **搜索商品列表**（已在用）|
| PR8 | `getProduct(params)` | **GetProduct** | **获取商品详情** |
| PR9 | `createProduct(body)` | **CreateProduct** | **创建新商品** |
| PR10 | `updateProduct(params)` | UpdateProduct | 更新商品 |
| PR11 | `deleteProducts(body)` | DeleteProducts | 删除商品 |
| PR12 | `updateProductPrice(params)` | UpdateProductPrice | 修改价格 |
| PR13 | `updateProductInventory(params)` | UpdateProductInventory | 修改库存 |

### productV202312~V202604（扩展）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| PR14 | `getGlobalCategories(query)` | GetGlobalCategories | 全球分类（跨境通用）|
| PR15 | `getGlobalAttributes(params)` | GetGlobalAttributes | 全球属性 |
| PR16 | `getGlobalCategoryRules(params)` | GetGlobalCategoryRules | 全球分类规则 |
| PR17 | `createGlobalProduct(body)` | CreateGlobalProduct | 创建全球商品 |
| PR18 | `searchGlobalProducts(params)` | SearchGlobalProducts | 搜索全球商品 |
| PR19 | `deleteGlobalProducts(body)` | DeleteGlobalProducts | 删除全球商品 |
| PR20 | `getGlobalProduct(id)` | GetGlobalProduct | 全球商品详情 |
| PR21 | `updateGlobalInventory(params)` | UpdateGlobalInventory | 更新全球库存 |
| PR22 | `createManufacturer(body)` | CreateManufacturer | 创建制造商 |
| PR23 | `searchManufacturer(query)` | SearchManufacturer | 搜索制造商 |
| PR24 | `createResponsiblePerson(body)` | CreateResponsiblePerson | 创建责任人 |
| PR25 | `searchResponsiblePersons(params)` | SearchResponsiblePersons | 搜索责任人 |
| PR26 | `getRecommendedProductTitleAndDescription(query)` | 推荐标题和描述 |
| PR27 | `getProductsSEOWords(query)` | SEO 关键词建议 |
| PR28 | `searchSizeCharts(params)` | 尺码表搜索 |
| PR29 | `createImageTranslationTasks(body)` | 图片翻译任务 |
| PR30 | `getImageTranslationTasks(query)` | 图片翻译结果 |

---

## 十、💰 财务 Finance（4 版本 6+ 方法）

### financeV202309Api.ts
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| FI1 | `getStatements(params)` | **GetStatements** | **结算账单列表**（按周期/状态）|
| FI2 | `getPayments(params)` | **GetPayments** | **付款记录** |

### financeV202501~V202507（扩展）
| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| FI3 | `getWithdrawals(params)` | GetWithdrawals | **提现记录** |
| FI4 | `getTransactionsByOrder(orderId)` | GetTransactionsByOrder | **按订单查交易明细**（费用拆解）|
| FI5 | `getTransactionsByStatement(params)` | GetTransactionsByStatement | **按结算单查交易明细** |

---

## 十一、🎟️ 营销促销 Promotion（3 版本 10+ 方法）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| M1 | `createActivity(params)` | **CreateActivity** | **创建促销活动**（满减/折扣/闪购/包邮/多件优惠）|
| M2 | `updateActivity(params)` | UpdateActivity | 更新活动 |
| M3 | `deactivateActivity(id)` | DeactivateActivity | 下线活动 |
| M4 | `getActivity(id)` | GetActivity | 活动详情 |
| M5 | `searchActivity(body)` | **SearchActivity** | **搜索活动列表** |
| M6 | `updateActivityProduct(body)` | UpdateActivityProduct | 更新活动中商品 |
| M7 | `removeActivityProduct(params)` | RemoveActivityProduct | 移除活动中商品 |
| M8 | `getCoupon(id)` | GetCoupon | 优惠券详情 |
| M9 | `searchCoupon(body)` | **SearchCoupon** | **搜索优惠券** |

---

## 十二、🔗 授权认证 Authorization（6 版本 6+ 方法）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| AU1 | `getAuthorizedShops()` | GetAuthorizedShops | 已授权店铺列表（✅ 已用）|
| AU2 | `getActiveShops()` | GetActiveShops | 有效店铺列表 |
| AU3 | `getSellerPermissions()` | GetSellerPermissions | 卖家权限范围 |

---

## 十三、📡 事件订阅 Event（1 版本 4+ 方法）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| E1 | `getShopWebhooks()` | GetShopWebhooks | 当前 Webhook 列表 |
| E2 | `updateShopWebhook(body)` | **UpdateShopWebhook** | **配置事件回调 URL**（订单变更/退款/授权过期等）|
| E3 | `deleteShopWebhook(body)` | DeleteShopWebhook | 删除 Webhook |

> **EventType 枚举**: ORDER_STATUS_CHANGE / RECIPIENT_ADDRESS_UPDATE / PACKAGE_UPDATE / PRODUCT_STATUS_CHANGE / SELLER_DEAUTHORIZATION / NEW_CONVERSATION / NEW_MESSAGE / CANCELLATION_STATUS_CHANGE / RETURN_STATUS_CHANGE / INVOICE_STATUS_CHANGE / PRODUCT_AUDIT_STATUS_CHANGE 等

---

## 十四、🛒 店铺 Seller（2 版本 3+ 方法）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| SH1 | `getShopInfo()` | 获取店铺基本信息 |
| SH2 | `getSellerInfo()` | 获取卖家信息 |

---

## 十五、🎧 客服 CustomerService（7 版本 15+ 方法）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| CS1 | 搜索工单/纠纷/评价 | 处理售后纠纷 |
| CS2 | 回复消息/关闭工单 | 客服沟通 |
| CS3 | 评价回复/处理 | 管理用户评价 |
| ... | （7个版本的客服API）| 差异化管理 |

---

## 十六、📋 数据对账 DataReconciliation（3 版本）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| DR1 | 对账单据对比 | 系统订单 vs TikTok 订单核对 |
| DR2 | 数据差异报告 | 不一致项明细 |
| DR3 | 手动对账确认 | 确认对账结果 |

---

## 十七、📦 供应链 SupplyChain（1 版本）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| SC1 | 供应链节点管理 | 入库/出库/调拨 |

---

## 十八、🌐 开放平台 Open（1 版本）

| # | 方法 | @summary | 功能说明 |
|---|------|---------|---------|
| OP1 | Open 平台接口 | 第三方开发者接入 |

---

## 统计汇总

| 模块组 | 文件数 | API方法数 | 当前使用 | 可新增 |
|--------|:------:|:--------:|:-------:|:-----:|
| 📦 **订单 Order** | 5 | ~8 | ⚠️ 部分 | **P0: sku_image/详情/价格** |
| 👥 **达人 AffiliateSeller** | 13 | **~40+** | ❌ | **P0: 发现/数据/建联/合作/寄样/佣金** |
| 🎬 **达人 AffiliatePartner(MCN)** | 6 | ~15 | ❌ | P2: MCN管理 |
| 🎤 **达人 AffiliateCreator(端)** | 10 | ~18 | ❌ | P2: 达人端 |
| 📊 **数据分析 Analytics** | 7 | **~12** | ❌ | **P1: 视频/商品/SKU表现** |
| 🚚 **发货履约 Fulfillment** | 8 | **~20** | ❌ | **P1: 打包/发货/合并** |
| ↩️ **售后退款 ReturnRefund** | 6 | **~12** | ❌ | **P1: 售后/退款/取消** |
| 🚛 **物流 Logistics** | 3 | ~4 | ❌ | P2 |
| 🏪 **商品 Product** | 13 | **~35+** | ⚠️ 部分 | P1: CRUD/价格/库存/全局品 |
| 💰 **财务 Finance** | 4 | ~6 | ⚠️ 部分 | **P1: 结算/提款/交易明细** |
| 🎟️ **营销 Promotion** | 3 | ~10 | ❌ | P2: 活动/优惠券 |
| 🔗 **授权 Authorization** | 6 | ~3 | ✅ | - |
| 📡 **事件 Event** | 1 | ~4 | ❌ | P1: Webhook回调 |
| 🛒 **店铺 Seller** | 2 | ~3 | ✅ | - |
| 🎧 **客服 CustomerService** | 7 | ~15 | ❌ | P2 |
| 📋 **数据对账** | 3 | ~3 | ❌ | P2 |
| 📦 **供应链** | 1 | ~1 | ❌ | P3 |
| 🌐 **开放平台 Open** | 1 | ~1 | ❌ | P3 |
| **合计** | **104** | **~220+** | **~5** | **~215 待开发** |

---

## 你的选择

请告诉我：
1. **哪些模块整体需要？** （比如"全部订单 + 达人 + 视频 + 发货"）
2. **或者逐个方法选？** （比如"P0-001 sku_image 必须做"）
3. **优先级怎么排？** （先做哪几个？）

我会根据你的选择更新 `docs/SDK-API-Roadmap.md`。
