# TK GMV Max 完整底层逻辑与规则体系深度拆解

> **来源**: https://www.tkgmvmax.com (全站逆向分析)
> **提取日期**: 2026-06-08
> **分析目的**: 为Bozone广告模块开发提供竞品参考与技术蓝图
> **产品定位**: TikTok GMV Max 广告自动化管理 SaaS 工具（¥9.9/店/天）

---

## 📌 一、产品定位与商业模式

### 1.1 产品本质

```
TK GMV Max = TikTok Business API SDK 的 SaaS 封装产品
         = 规则引擎（Rule Engine）+ 定时调度器（Scheduler）+ 数据可视化（Dashboard）
```

**核心SDK依赖**: `tiktok-business-api-sdk-official` (npm包，基于Swagger Codegen生成)

### 1.2 商业模式

| 项目 | 详情 |
|------|------|
| **定价** | ¥9.9 元/店/天 ≈ ¥300/月/店 |
| **目标用户** | TikTok Shop GMV Max 广告主（中小卖家为主）|
| **核心价值主张** | 7×24小时无人值守自动化广告管理 |
| **技术门槛** | 低（填8个数字就能用）|
| **备案信息** | 皖ICP备2026012139号 / 皖公网安备34162302003394号 |
| **版权** | ©2024 TK GMV Max（所在地推断：安徽省）|

---

## 🏗️ 二、系统底层技术架构（完整还原）

### 2.1 整体系统架构图

```
┌──────────────────────────────────────────────────────────────┐
│                    用户交互层 (Frontend)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ 规则编辑器│  │ 实时看板  │  │ 报表中心 │  │ 账户/权限管理 │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                    业务逻辑层 (Backend)                        │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  规则引擎核心     │  │  任务调度器      │                   │
│  │  - 条件解析器    │  │  - Cron定时触发  │                   │
│  │  - 动作执行器    │  │  - 队列管理      │                   │
│  │  - 公式计算器    │  │  - 并发控制      │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│  ┌────────┴────────────────────┴────────┐                   │
│  │           数据处理层                     │                   │
│  │  - 数据聚合/清洗                       │                   │
│  │  - 指标计算（CPA/ROI/ROAS/消耗率）       │                   │
│  │  - 时间窗口切片（3d/7d/14d/30d）        │                   │
│  └────────────────┬───────────────────────┘                   │
├───────────────────┼───────────────────────────────────────────┤
│           数据采集层 (API Gateway)                              │
│  ┌────────────────┴──────────────────┐                        │
│  │   TikTok Business API SDK          │                        │
│  │ ├─ ReportingApi (报表数据拉取)      │ ← 每8分钟调用一次     │
│  │ ├─ CampaignCreationApi (系列管理)   │ ← 执行动作时调用       │
│  │ ├─ AdgroupApi (广告组管理)          │ ← 调预算/开关         │
│  │ ├─ AdApi (广告管理)                 │ ← 移除/加回素材       │
│  │ └─ AutomatedRulesApi (可选)        │ ← 平台原生规则(未用)  │
│  └─────────────────────────────────────┘                        │
├──────────────────────────────────────────────────────────────┤
│                    数据存储层 (Database)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 用户/账户 │ │ 规则配置  │ │ 广告数据  │ │ 操作日志  │        │
│  │ 表       │ │ 表       │ │ 缓存表   │ │ 表       │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 核心技术栈（推断）

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Vue.js 3 + Element Plus / Ant Design Vue | 单页应用(SPA)，组件化UI |
| **后端** | Node.js + Express / Koa / Hono | RESTful API服务 |
| **数据库** | MySQL 8.0 | 关系型，支持复杂查询 |
| **任务调度** | node-cron / Bull Queue | 定时任务管理 |
| **API封装** | tiktok-business-api-sdk-official | 官方JS SDK |
| **公式引擎** | mathjs 或自定义eval | 支持用户自定义公式 |

---

### 2.3 核心数据流（单次执行周期）

```
【Step 1】定时器触发（精确到毫秒）
  ↓ 每8分钟一次
【Step 2】获取所有启用规则的列表
  ↓ 过滤掉 disabled 和不在时间窗口内的规则
【Step 3】批量拉取广告数据（减少API调用次数）
  ├─ 调用 ReportingApi.reportIntegratedGet()
  ├─ 一次性获取Campaign/AdGroup/Ad三个层级的数据
  └─ 时间范围覆盖3d/7d/14d/30d（按需）
  ↓
【Step 4】数据处理与聚合
  ├─ 计算派生指标（CPA/ROI/消耗率等）
  ├─ 按Campaign ID组织数据结构
  └─ 缓存到内存（本次周期复用）
  ↓
【Step 5】遍历规则列表，逐条评估
  ├─ FOR EACH rule IN enabled_rules:
  │   ├─ 解析规则的目标层级(Series/Creative/Product)
  │   ├─ 从缓存中提取对应层级的数据
  │   ├─ 将数据传入 ConditionEvaluator.evaluate()
  │   ├─ IF 返回 true:
  │   │   ├─ 生成执行上下文(ExecutionContext)
  │   │   ├─ 调用 ActionExecutor.execute()
  │   │   ├─ 记录操作日志到数据库
  │   │   └─ (可选)发送实时通知给用户
  │   └─ ELSE:
  │       └─ 跳过，继续下一条规则
  ↓
【Step 6】汇总本轮执行结果
  ├─ 统计成功/失败次数
  ├─ 记录API调用配额使用情况
  └─ 更新下次执行时间戳
  ↓
【Step 7】等待下一次触发（8分钟后）
```

---

## 🎯 三、三层级管理体系详解

### 3.0 为什么是"三层"？

TikTok GMV Max 广告的层级结构：

```
Campaign（系列/Campaign）
  └─ AdGroup（广告组）—— 普通广告到此为止
       └─ Ad（广告/创意）—— 视频/图片素材
            └─ Product（商品/SKU）—— ⭐GMV Max特有！可管到商品级别
```

> **关键差异**: 普通Campaign只能管到AdGroup层级；GMV Max可以管到Product/SKU级别 —— 这是它的核心竞争力！

---

### 3.1 系列层级（Series Level — Campaign）

**管理对象**: 广告系列（Campaign）
**可用操作**:
- ✅ 调整系列预算（增加/减少）
- ✅ 开关系列状态（暂停/启用）
- ✅ 修改出价策略

#### 适用场景与示例规则

**场景A: 防爆款跑飞（最重要！）**
```javascript
IF (今日系列消耗率 ≥ 80% AND 今日系列ROI ≥ 2.0)
THEN 系列预算 += 50元 【持续执行】

// 底层TikTok API调用:
campaignUpdate({
  advertiser_id: "xxx",
  campaign_ids: ["123"],
  budget_mode: "BUDGET_MODE_DAY",
  budget: current_budget + 50  // 新预算值
})
```

**场景B: ROI不达标止损**
```javascript
IF (近7天系列ROI < 1.5)
THEN 暂停该系列 【持续执行】

// 底层API调用:
campaignStatusUpdate({
  advertiser_id: "xxx",
  campaign_ids: ["123"],
  operation_status: "DISABLE"
})
```

**场景C: 日预算初始化**
```javascript
IF (当前时间 == 00:00)
THEN 重置系列预算为 30元 【时间点执行】

// 底层API调用:
campaignUpdate({
  advertiser_id: "xxx",
  campaign_ids: ["123"],
  budget: 30
})
```

---

### 3.2 创意层级（Creative Level — Ad/Creative）

**管理对象**: 单个广告创意（视频/图片素材）
**可用操作**:
- ✅ 移除无效素材（从系列中解绑/暂停）
- ✅ 加回优质素材（重新绑定到系列/重新启用）
- ✅ 创建加热任务（给新素材分配测试预算）

#### 核心规则逻辑（网站展示的真实案例）

##### 规则A: 自动剔除无效素材
```javascript
// IF 条件
IF (今日创意花费 >= 2元 AND 今日创意订单 == 0)

// THEN 动作
→ 移除该创意素材（按条件）

// 执行方式：【持续执行】

// 业务含义: 这个素材花了2块钱测试了，但一个订单都没有 → 垃圾素材，立即移除止损

// 底层实现方案1: 暂停该Ad
adUpdate({
  advertiser_id: "xxx",
  ad_ids: ["456"],
  operation_status: "DISABLE"
})

// 底层实现方案2: 从GMV Max Campaign中移除特定creative_id（如果API支持）
```

##### 规则B: 自动恢复优质素材
```javascript
// IF 条件
IF (近7天创意订单 > 0 AND 近7天创意CPA < 6元)

// THEN 动作
→ 加回该创意素材（重新启用）

// 执行方式：【持续执行】

// 业务含义: 这个素材在过去7天有出单，而且CPA控制在6元以内 → 是个优质素材 → 加回来继续跑

// 底层实现:
adUpdate({
  advertiser_id: "xxx",
  ad_ids: ["456"],
  operation_status: "ENABLE"
})
```

##### 规则C: 新素材冷启动加热
```javascript
// IF 条件
IF (今日创意状态 == "未投放")

// THEN 动作
→ 创建创意加热（预算12~15元）

// 执行方式：【持续执行】

// 业务含义: 发现了一个还没开始投放的新素材 → 给它一笔启动资金让它有机会展示

// 底层实现方案1: 给该Ad设置独立的日预算
adgroupCreate({
  advertiser_id: "xxx",
  campaign_id: "123",
  budget: 15,  // 测试预算
  // ... 其他参数
})

// 底层实现方案2: 在Campaign级别增加总预算（间接加热）
campaignUpdate({
  advertiser_id: "xxx",
  campaign_ids: ["123"],
  budget: current_budget + 15
})
```

---

### 3.3 商品层级（Product Level — SKU）

**管理对象**: 具体商品SKU
**可用操作**:
- ✅ 单品ROI追踪（查看每个商品的表现）
- ✅ 单品花费控制（限制单个商品的广告花费上限）
- ✅ 商品级别的启停（GMV Max特有功能！）

#### 特殊之处与应用场景

```
普通Campaign只能管到AdGroup级别
GMV Max可以管到Product/SKU级别 → 这是它的核心竞争力！

为什么重要？
因为同一个视频可能推广多个商品，每个商品的转化率不同：
- 商品A: CPA=3元，ROI=5x → 继续投
- 商品B: CPA=15元，ROI=0.8x → 应该暂停
→ 如果只在Ad级别操作，会误伤商品A
→ SKU级别的精细化控制能避免这个问题
```

#### 推测的TikTok API接口（基于官方SDK文档）

```javascript
// GMV Max商品级别操作（推测接口，待验证）
gmvMaxSessionCreate({
  advertiser_id: "xxx",
  campaign_id: "123",
  product_ids: ["SKU_001", "SKU_002"],
  product_budget: 50,      // 单品预算
  product_status: "ACTIVE" // 启用/暂停
})

// 或者通过CatalogApi关联
catalogProductUpdate({
  advertiser_id: "xxx",
  catalog_id: "CAT_001",
  product_ids: ["SKU_001"],
  advertising_status: "PAUSED"  // 暂停该商品的广告
})
```

---

## ⚙️ 四、五种执行计划引擎（调度系统详解）

### 4.1 执行计划类型一览表

| 类型 | 中文名称 | 技术实现方式 | 适用场景 | 典型使用频率 |
|------|---------|-------------|---------|------------|
| **CONTINUOUS** | 持续执行 | `setInterval` 或 Cron `*/8 * * * *` | 全天候监控类规则 | 每8分钟 |
| **ONCE** | 一次执行 | 单次任务队列 + 执行后标记 `executed=true` | 初始化/批量设置/临时调整 | 仅1次 |
| **TIME_POINT** | 时间点执行 | `node-cron` 的精确Cron表达式 | 特定时刻的操作 | 如每天00:00 |
| **TIME_RANGE** | 时段执行 | 每次触发时检查当前时间是否在窗口内 | 高峰期集中投放策略 | 窗口期内每8分钟 |
| **INTERVAL** | 间隔执行 | 自定义计数器 + 取模运算 `% interval === 0` | 需要自定义频率的场景 | 可配置 |

### 4.2 各类型的详细说明与应用示例

#### 类型1: CONTINUOUS（持续执行）— 最常用！

```typescript
interface ContinuousSchedule {
  type: 'CONTINUOUS'
  intervalMinutes: number  // 通常固定为8分钟
}

// 适用规则示例:
// - CPA超限自动暂停
// - 素材花费超限自动移除
// - ROI不达标自动关停
// - 消耗率达80%自动加预算

// 技术实现:
// 方案A: 使用 setInterval
setInterval(async () => {
  await ruleEngine.evaluateAndExecute(ruleId)
}, 8 * 60 * 1000)  // 8分钟 = 480000毫秒

// 方案B: 使用 node-cron（推荐，更稳定）
cron.schedule('*/8 * * * *', async () => {
  await ruleEngine.evaluateAllContinuousRules()
})
```

#### 类型2: ONCE（一次执行）

```typescript
interface OnceSchedule {
  type: 'ONCE'
  executeAt?: Date       // 可选：指定执行时间（默认立即执行）
  executed: boolean      // 是否已执行
  executedAt?: Date      // 实际执行时间
}

// 适用规则示例:
// - 首次启动时初始化所有系列的预算为30元
// - 批量暂停所有广告（如系统维护前）
// - 一次性导入规则模板

// 技术实现:
async function executeOnceRule(ruleId: string) {
  const rule = await db.rules.findById(ruleId)
  if (rule.schedule.executed) {
    console.log(`规则 ${ruleId} 已执行过，跳过`)
    return
  }
  
  await ruleEngine.evaluateAndExecute(ruleId)
  
  // 标记为已执行
  await db.rules.update(ruleId, { 
    'schedule.executed': true,
    'schedule.executedAt': new Date()
  })
}
```

#### 类型3: TIME_POINT（时间点执行）

```typescript
interface TimePointSchedule {
  type: 'TIME_POINT'
  cronExpression: string   // 标准Cron表达式
}

// 适用规则示例:
// - 每天00:00重置所有系列日预算
// - 每周一09:00生成上周报表并发送邮件
// - 大促当天00:01自动开启全部广告

// 常用Cron表达式对照表:
const commonTimePoints = {
  '每天00:00': '0 0 * * *',
  '每天08:00': '0 8 * * *',
  '每周一09:00': '0 9 * * 1',
  '每月1号00:00': '0 0 1 * *',
  '每小时整点': '0 * * * *',
}

// 技术实现:
function registerTimePointRule(rule: Rule) {
  const job = cron.schedule(rule.schedule.cronExpression, async () => {
    console.log(`[时间点触发] 规则 ${rule.name} 在 ${new Date().toISOString()} 执行`)
    await ruleEngine.evaluateAndExecute(rule.id)
  })
  
  // 保存job引用以便后续取消
  activeJobs.set(rule.id, job)
}
```

#### 类型4: TIME_RANGE（时段执行）

```typescript
interface TimeRangeSchedule {
  type: 'TIME_RANGE'
  startHour: number     // 开始小时 (0-23)
  startMinute: number   // 开始分钟 (0-59)
  endHour: number       // 结束小时 (0-23)
  endMinute: number     // 结束分钟 (0-59)
  timezone?: string     // 时区（默认Asia/Shanghai）
}

// 适用规则示例:
// - 只在早8点到晚12点之间投放（凌晨不投）
// - 工作日白天高频监控，夜间低频
// - 特定活动期间才生效的规则

// 示例: 工作日白班时段（9:00-18:00）
const workHoursRule = {
  name: '工作日白班时段规则',
  schedule: {
    type: 'TIME_RANGE',
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0
  },
  // ... condition 和 action
}

// 技术实现:
function isInTimeWindow(schedule: TimeRangeSchedule): boolean {
  const now = new Date()
  
  // 处理跨午夜的情况（如22:00-06:00）
  if (schedule.endHour < schedule.startHour) {
    // 跨午夜：当前时间 >= 开始 OR 当前时间 <= 结束
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = schedule.startHour * 60 + schedule.startMinute
    const endMinutes = schedule.endHour * 60 + schedule.endMinute
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  } else {
    // 正常情况
    const currentHour = now.getHours()
    return currentHour >= schedule.startHour && currentHour <= schedule.endHour
  }
}
```

#### 类型5: INTERVAL（间隔执行）

```typescript
interface IntervalSchedule {
  type: 'INTERVAL'
  intervalMinutes: number  // 自定义间隔（最小1分钟）
  offsetMinutes?: number   // 偏移量（避免所有规则同时触发）
}

// 适用规则示例:
// - 每30分钟检查一次消耗率（比8分钟更频繁的关键指标）
// - 每2小时发送一次进度报告
// - 每6小时备份一次规则配置

// 技术实现（基于计数器）:
let executionCounter = 0
const baseInterval = 8  // 基础轮询周期（分钟）

cron.schedule(`*/${baseInterval} * * * *`, async () => {
  executionCounter++
  
  // 查找所有INTERVAL类型规则
  const intervalRules = await db.rules.findByType('INTERVAL')
  
  for (const rule of intervalRules) {
    const { intervalMinutes, offsetMinutes = 0 } = rule.schedule
    
    // 计算是否应该执行: (总次数 + 偏移) % (间隔/基础周期) === 0
    if ((executionCounter + Math.floor(offsetMinutes / baseInterval)) % Math.ceil(intervalMinutes / baseInterval) === 0) {
      await ruleEngine.evaluateAndExecute(rule.id)
    }
  }
})

// 示例计算:
// 基础周期=8分钟, 规则间隔=30分钟
// 30 / 8 = 3.75 → 向上取整=4
// 所以每4个基础周期(32分钟≈30分钟)执行一次
// Counter序列: 0,4,8,12,16,... 时执行
```

### 4.3 调度器核心代码结构（推测的完整实现）

```typescript
// server/src/services/scheduler.ts
import cron from 'node-cron'
import { RuleEngine } from './rule-engine'
import { db } from '../db'

interface Rule {
  id: string
  name: string
  enabled: boolean
  layer: 'SERIES' | 'CREATIVE' | 'PRODUCT'
  schedule: ContinuousSchedule | OnceSchedule | TimePointSchedule | TimeRangeSchedule | IntervalSchedule
  condition: ConditionNode
  action: ActionItem
  priority: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

class Scheduler {
  private rules: Map<string, Rule> = new Map()
  private activeJobs: Map<string, cron.ScheduledTask> = new Map()
  private ruleEngine: RuleEngine
  
  constructor(ruleEngine: RuleEngine) {
    this.ruleEngine = ruleEngine
  }

  /**
   * 初始化调度器：从数据库加载所有启用的规则并注册调度任务
   */
  async init() {
    console.log('[Scheduler] 正在初始化...')
    
    // 1. 从数据库加载所有启用的规则
    const allRules = await db.rules.findAllEnabled()
    allRules.forEach(rule => this.rules.set(rule.id, rule))
    
    console.log(`[Scheduler] 已加载 ${this.rules.size} 条规则`)
    
    // 2. 注册全局8分钟定时任务（用于CONTINUOUS/TIME_RANGE/INTERVAL类型）
    this.registerGlobalTick()
    
    // 3. 注册所有TIME_POINT类型的规则（各自独立的Cron表达式）
    for (const [id, rule] of this.rules) {
      if (rule.schedule.type === 'TIME_POINT') {
        this.registerTimePointJob(id, rule)
      }
      if (rule.schedule.type === 'ONCE' && !rule.schedule.executed) {
        // 如果是一次性规则且尚未执行，立即执行或等到指定时间
        if (rule.schedule.executeAt && new Date(rule.schedule.executeAt) > new Date()) {
          setTimeout(() => this.executeSingleRule(id), 
            new Date(rule.schedule.executeAt).getTime() - Date.now())
        } else {
          this.executeSingleRule(id)
        }
      }
    }
    
    console.log('[Scheduler] 初始化完成 ✓')
  }

  /**
   * 全局时钟滴答：每8分钟触发一次，处理CONTINUOUS/TIME_RANGE/INTERVAL规则
   */
  private registerGlobalTick() {
    const job = cron.schedule('*/8 * * * *', async () => {
      const tickStart = Date.now()
      console.log(`[Scheduler] ⏱ Global tick at ${new Date().toISOString()}`)
      
      try {
        // 并行处理三种类型规则以提高效率
        await Promise.all([
          this.executeRulesByType('CONTINUOUS'),
          this.executeRulesByType('TIME_RANGE'),
          this.executeRulesByType('INTERVAL'),
        ])
        
        const duration = Date.now() - tickStart
        console.log(`[Scheduler] ✅ Tick completed in ${duration}ms`)
      } catch (error) {
        console.error('[Scheduler] ❌ Tick error:', error)
        
        // 发送错误告警（可选）
        await this.sendAlert(`调度器执行异常: ${error.message}`)
      }
    })
    
    this.activeJobs.set('__global_tick__', job)
  }

  /**
   * 按类型执行规则
   */
  private async executeRulesByType(type: ScheduleType): Promise<void> {
    const matchedRules = Array.from(this.rules.values()).filter(rule => {
      if (!rule.enabled || rule.schedule.type !== type) return false
      
      // TIME_RANGE需要额外检查时间窗口
      if (type === 'TIME_RANGE') {
        return this.isInTimeWindow(rule.schedule as TimeRangeSchedule)
      }
      
      return true
    })

    console.log(`[Scheduler] 执行 ${type} 类型规则: ${matchedRules.size} 条`)

    // 按优先级排序（数字越小优先级越高）
    matchedRules.sort((a, b) => a.priority - b.priority)

    // 串行执行每条规则（避免API Rate Limit）
    for (const rule of matchedRules) {
      try {
        await this.ruleEngine.evaluateAndExecute(rule)
      } catch (error) {
        console.error(`[Scheduler] 规则 ${rule.name} (${rule.id}) 执行失败:`, error)
        // 记录失败日志但不影响其他规则执行
        await db.ruleExecutionLogs.create({
          ruleId: rule.id,
          status: 'FAILED',
          errorMessage: error.message
        })
      }
    }
  }

  /**
   * 执行单条规则（用于TIME_POINT和ONCE类型）
   */
  private async executeSingleRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId)
    if (!rule || !rule.enabled) return
    
    console.log(`[Scheduler] 执行单条规则: ${rule.name}`)
    
    try {
      await this.ruleEngine.evaluateAndExecute(rule)
      
      // 如果是ONCE类型，标记为已执行
      if (rule.schedule.type === 'ONCE') {
        await db.rules.update(ruleId, { 
          'schedule.executed': true,
          'schedule.executedAt': new Date()
        })
      }
    } catch (error) {
      console.error(`[Scheduler] 单条规则 ${ruleId} 执行失败:`, error)
    }
  }

  /**
   * 注册时间点任务
   */
  private registerTimePointJob(ruleId: string, rule: Rule): void {
    const job = cron.schedule(rule.schedule.cronExpression, async () => {
      console.log(`[Scheduler] ⏰ 时间点触发: ${rule.name} (${rule.schedule.cronExpression})`)
      await this.executeSingleRule(ruleId)
    })
    
    this.activeJobs.set(ruleId, job)
  }

  /**
   * 判断当前时间是否在TIME_RANGE窗口内
   */
  private isInTimeWindow(schedule: TimeRangeSchedule): boolean {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = schedule.startHour * 60 + schedule.startMinute
    const endMinutes = schedule.endHour * 60 + schedule.endMinute
    
    // 处理跨午夜情况（如22:00-06:00）
    if (endMinutes < startMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }

  /**
   * 动态添加新规则（运行时注册）
   */
  async addRule(rule: Rule): Promise<void> {
    this.rules.set(rule.id, rule)
    
    // 根据类型注册对应的调度任务
    switch (rule.schedule.type) {
      case 'TIME_POINT':
        this.registerTimePointJob(rule.id, rule)
        break
      case 'ONCE':
        if (!rule.schedule.executed) {
          this.executeSingleRule(rule.id)
        }
        break
      // CONTINUOUS/TIME_RANGE/INTERVAL 由全局tick处理，无需额外注册
    }
    
    console.log(`[Scheduler] ➕ 新规则已添加: ${rule.name}`)
  }

  /**
   * 移除规则（运行时注销）
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
    
    // 如果是TIME_POINT类型，取消对应的cron任务
    const job = this.activeJobs.get(ruleId)
    if (job) {
      job.stop()
      this.activeJobs.delete(ruleId)
    }
    
    console.log(`[Scheduler] ➖ 规则已移除: ${ruleId}`)
  }

  /**
   * 发送告警通知
   */
  private async sendAlert(message: string): Promise<void> {
    // TODO: 实现通知逻辑（邮件/Discord/Webhook/站内信等）
    console.warn(`[ALERT] ${message}`)
  }

  /**
   * 优雅关闭：停止所有定时任务
   */
  shutdown(): void {
    console.log('[Scheduler] 正在关闭所有调度任务...')
    for (const [id, job] of this.activeJobs) {
      job.stop()
    }
    this.activeJobs.clear()
    this.rules.clear()
    console.log('[Scheduler] 已关闭 ✓')
  }
}

export { Scheduler }
export type { Rule, ScheduleType }
```

---

## 📊 五、30+条件字段系统（完整列表与来源）

### 5.1 字段分类总览

```
条件字段系统 = 原始指标(A) + 效率指标(B) + GMV Max特有(C) + 自定义公式(D)
             ≈ 10个原始 + 12个效率 + 8个GMV Max特有 + N个自定义
             = 30+ 可用字段
```

---

### 5.2 A类：原始指标（直接从ReportingApi获取，无需计算）

| # | 字段名 | 变量标识 | API Metrics名称 | 数据类型 | 说明 | 时间范围 |
|---|--------|---------|----------------|---------|------|---------|
| 1 | **花费** | `spend` | `spend` | DECIMAL(12,2)| 广告总花费金额 | 3/7/14/30天 |
| 2 | **展示量** | `impressions` | `impressions` | BIGINT | 广告被展示的总次数 | 3/7/14/30天 |
| 3 | **点击量** | `clicks` | `clicks` | BIGINT | 用户点击广告的总次数 | 3/7/14/30天 |
| 4 | **转化数** | `conversions` | `conversion` | INT | 转化事件总数（购买/注册等）| 3/7/14/30天 |
| 5 | **营收** | `revenue` | `revenue` | DECIMAL(12,2)| 广告带来的总收入 | 3/7/14/30天 |
| 6 | **订单数** | `orders` | `orders` | INT | 广告带来的订单数量 | 3/7/14/30天 |

#### TikTok API调用示例（获取原始指标）

```javascript
const result = await reportingApi.reportIntegratedGet(accessToken, {
  body: {
    advertiser_id: advertiserId,
    date_range: {
      start: getDateStr(-7),  // 近7天
      end: getDateStr(0)       // 到今天
    },
    dimensions: ['stat_time_day', 'campaign_id', 'adgroup_id', 'ad_id'],
    metrics: [
      'spend',          // 花费
      'impressions',    // 展示量
      'clicks',         // 点击量
      'conversion',     // 转化数
      'revenue',        // 营收
      'orders',         // 订单数
    ],
    page_size: 100,
  }
})
```

---

### 5.3 B类：效率指标（由原始指标计算得出）

| # | 字段名 | 变量标识 | 计算公式 | 数据类型 | 业务含义 | 正常范围参考 |
|---|--------|---------|---------|---------|---------|------------|
| 7 | **CTR点击率** | `ctr` | `clicks ÷ impressions × 100%` | PERCENTAGE(4,2)| 衡量素材吸引力 | 1%~5% |
| 8 | **CPC点击成本** | `cpc` | `spend ÷ clicks` | DECIMAL(10,2)| 每次点击成本 | ¥0.5~¥3 |
| 9 | **CPM千次展现成本**| `cpm` | `spend ÷ impressions × 1000` | DECIMAL(10,2)| 展示效率 | ¥10~¥50 |
| 10 | **CPA转化成本** | `cpa` | `spend ÷ conversions` | DECIMAL(10,2)| **最关键指标之一** | 因品类而异 |
| 11 | **ROI投产比** | `roi` | `revenue ÷ spend` | DECIMAL(10,4)| **核心盈利指标** | ≥2.0为健康 |
| 12 | **ROAS广告回报率** | `roas` | 同ROI | DECIMAL(10,4)| 电商行业常用叫法 | 同上 |
| 13 | **点击转化率** | `cvr_click` | `conversions ÷ clicks × 100%` | PERCENTAGE(4,2)| 流量质量指标 | 1%~10% |
| 14 | **展示转化率** | `cvr_impression`| `conversions ÷ impressions × 100%` | PERCENTAGE(4,2)| 综合效果指标 | 0.1%~2% |
| 15 | **平均订单金额** | `aov` | `revenue ÷ orders` | DECIMAL(10,2)| 客单价 | 因品类而异 |

#### 计算引擎代码

```typescript
class MetricsCalculator {
  /**
   * 计算所有派生指标
   */
  calculateDerivedMetrics(raw: RawMetricsData): DerivedMetrics {
    const safeDivide = (a: number, b: number, fallback = 0) => 
      b !== 0 ? a / b : fallback

    return {
      // 点击相关
      ctr: safeDivide(raw.clicks, raw.impressions, 0) * 100,
      cpc: safeDivide(raw.spend, raw.clicks, 0),
      cpm: safeDivide(raw.spend, raw.impressions, 0) * 1000,

      // 转化相关
      cpa: safeDivide(raw.spend, raw.conversions, 0),
      roi: safeDivide(raw.revenue, raw.spend, 0),
      roas: safeDivide(raw.revenue, raw.spend, 0),
      cvrClick: safeDivide(raw.conversions, raw.clicks, 0) * 100,
      cvrImpression: safeDivide(raw.conversions, raw.impressions, 0) * 100,

      // 订单相关
      aov: safeDivide(raw.revenue, raw.orders, 0),
    }
  }
}
```

---

### 5.4 C类：GMV Max特有指标（视频/互动/商品相关）

| # | 字段名 | 变量标识 | 说明 | 数据来源 | 应用场景 |
|---|--------|---------|------|---------|---------|
| 16 | **播放率** | `play_rate` | 视频被播放的比例 | Video Analytics API | 判断视频开头3秒吸引力 |
| 17 | **完播率** | `completion_rate`| 视频完整观看的比例 | Video Analytics API | 内容质量核心指标 |
| 18 | **互动率** | `engagement_rate`| (点赞+评论+分享)/展示量 | Video Analytics API | 病毒传播潜力 |
| 19 | **加购率** | `cart_add_rate` | 加入购物车的转化率 | Pixel/Conversion API | 购买意向强度 |
| 20 | **商品点击率** | `product_ctr` | 点击商品卡片的比率 | Catalog API | 商品卡片吸引力 |
| 21 | **5秒播放率** | `play_5s_rate` | 播放超过5秒的比例 | Video Analytics API | 黄金5秒法则 |
| 22 | **25%播放点** | `play_25pct` | 播放到25%时长的比例 | Video Analytics API | 内容节奏判断 |
| 23 | **50%播放点** | `play_50pct` | 播放到50%时长的比例 | Video Analytics API | 中段留存能力 |
| 24 | **75%播放点** | `play_75pct` | 播放到75%时长的比例 | Video Analytics API | 后段吸引力 |
| 25 | **100%完播数** | `complete_views` | 完整观看的视频次数 | Video Analytics API | 忠诚观众数量 |

> **注**: 这些指标主要来自TikTok Video Performance Analytics API，需要额外的API调用或通过Pixel事件收集。

---

### 5.5 D类：自定义公式字段（用户可自由定义）

| # | 字段名 | 公式 | 业务含义 | 使用示例 |
|---|--------|------|---------|---------|
| 26 | **预算消耗率** | `spend ÷ budget × 100%` | 判断是否快花完了 | ≥80%时触发热门扩量 |
| 27 | **动态建议预算** | `spend × 1.6`(系数可调)| 科学扩量的依据 | 用于自动加预算的金额 |
| 28 | **CPA趋势变化率** | `(todayCPA - yesterdayCPA) ÷ yesterdayCPA` | 成本是否在恶化 | >0表示恶化,<0表示改善 |
| 29 | **ROI达标率** | `currentROI ÷ targetROI` | 相对于目标的完成度 | ≥1.0表示达标 |
| 30 | **盈亏平衡线** | `productCost + shippingCost + platformFee` | 单个订单的成本底线 | 与CPA对比判断盈利 |
| 31 | **真实利润率** | `(revenue - totalCost) ÷ revenue` | 扣除所有费用后的净利润率 | **最真实的盈利指标** |
| 32 | **素材生命周期得分** | `综合评分函数` | 素材当前所处阶段 | 冷启动期/成长期/成熟期/衰退期 |

---

### 5.6 时间窗口机制

#### 为什么需要多时间范围？

```
单一时间点的数据容易受波动影响：
- 今天CPA=10元 → 可能只是偶然
- 但如果近7天CPA都是10元左右 → 这是系统性问题

所以系统支持灵活的时间范围来过滤噪声：
```

| 时间范围 | 用途 | 典型应用场景 |
|---------|------|------------|
| **3天** | 短期波动检测 | 快速响应突发问题（如CPA突然飙升）|
| **7天** | **默认推荐** | 平衡灵敏度与稳定性（最常用）|
| **14天** | 中期趋势判断 | 评估策略调整后的效果 |
| **30天** | 长期表现评估 | 月度总结/素材生命周期分析 |

#### 时间范围的技术实现

```typescript
type DayRange = 3 | 7 | 14 | 30

interface TimeRangeConfig {
  days: DayRange
  type: 'ROLLING'  // 滚动窗口（始终以今天为终点往前推）
}

/**
 * 根据配置生成日期范围字符串
 */
function getDateRange(days: DayRange): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  
  // 格式: YYYY-MM-DD
  const formatDate = (d: Date) => d.toISOString().split('T')[0]
  
  return {
    start: formatDate(start),
    end: formatDate(end)
  }
}

// 示例:
getDateRange(7)  // → { start: '2026-06-01', end: '2026-06-08' } (假设今天是6月8日)
getDateRange(30) // → { start: '2026-05-09', end: '2026-06-08' }
```

---

## 🧠 六、智能规则生成引擎（核心技术壁垒深度剖析）

### 6.1 输入→输出的映射流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户输入层                                 │
│                                                             │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│   │ 参数1    │ │ 参数2    │ │ 参数3    │ │ ...     │         │
│   │max_cpa  │ │max_crt_ │ │daily_   │ │         │         │
│   │ ≤6元    │ │ spend   │ │ budget  │ │         │         │
│   │ ≤2元    │ │ 30元    │ │         │ │         │         │
│   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘         │
│        └──────────┬─┴──────────┬─┴──────────┘              │
│                   ▼                                      │
│          ┌────────────────┐                               │
│          │  输入参数集合    │                               │
│          │  (8个数值)      │                               │
│          └───────┬────────┘                               │
└──────────────────┼──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   参数验证模块                                │
│                                                             │
│   ┌──────────────────────────────────────────────────┐     │
│   │ 验证规则:                                        │     │
│   │ • 数值合理性 (如 max_cpa > 0)                     │     │
│   │ • 逻辑一致性 (如 min_budget ≤ daily_init_budget)   │     │
│   │ • 安全边界 (如 consume_rate_amount 不超过1000元)   │     │
│   └──────────────────────────────────────────────────┘     │
│                   │                                       │
│                   ▼ 验证通过                               │
└──────────────────┼──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  规则模板库                                   │
│                                                             │
│   ┌──────────────────────────────────────────────────┐     │
│   │ 预定义的9条规则模板 (JSON/TypeScript Interface)     │     │
│   │                                                   │     │
│   │ Template 1: CPA硬控停投                           │     │
│   │ Template 2: 素材测试止损                          │     │
│   │ Template 3: 日预算初始化                          │     │
│   │ Template 4: 最低预算保护                          │     │
│   │ Template 5: CPA预警通知                          │     │
│   │ Template 6: 消耗率触发自动扩量                    │     │
│   │ Template 7: 新素材加热启动                       │     │
│   │ Template 8: 取消加热进入正常投放                 │     │
│   │ Template 9: 优质素材自动加回                     │     │
│   └──────────────────────────────────────────────────┘     │
│                   │                                       │
│                   ▼                                       │
└──────────────────┼──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  变量替换引擎                                 │
│                                                             │
│   将用户输入的8个参数值填入9个模板的占位符                      │
│                                                             │
│   示例:                                                     │
│   模板: IF (today_cpa >= {{high_cpa_threshold}}) THEN ...    │
│   替换: IF (today_cpa >= 15) THEN ...                       │
│                                                             │
│                   │                                       │
│                   ▼                                       │
└──────────────────┼──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  依赖排序算法                                 │
│                                                             │
│   确定规则的执行顺序（避免冲突和依赖问题）                      │
│                                                             │
│   排序原则:                                                 │
│   1. 优先级高的先执行 (priority数值小优先)                    │
│   2. 保护类规则先于扩量类规则                                │
│   3. 初始化规则最先执行                                      │
│   4. 通知类规则最后执行                                      │
│                                                             │
│   排序后顺序: R1(停投) → R2(移除) → R3(初始化) → ... → R9   │
│                                                             │
│                   │                                       │
│                   ▼                                       │
└──────────────────┼──────────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  输出: 9条完整的可执行规则实例                    │
│                                                             │
│   每条规则包含:                                             │
│   • id (唯一标识)                                          │
│   • name (人类可读名称)                                     │
│   • layer (SERIES/CREATIVE/PRODUCT)                         │
│   • scheduleType (CONTINUOUS/...)                           │
│   • condition (IF条件的AST语法树)                            │
│   • action (THEN动作的具体定义)                              │
│   • priority (执行优先级)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.2 八大输入参数详解

| # | 参数名 | 变量标识 | 默认值 | 含义解释 | 业务逻辑 | 影响哪些规则 |
|---|--------|---------|--------|---------|---------|------------|
| **1** | **转化成本上限** | `max_cpa` | ≤6元 | 能接受的最高CPA阈值 | 超过此值的素材/系列应被优化或停投 | R1(停投), R5(预警), R9(加回) |
| **2** | **素材花费上限** | `max_creative_spend` | ≤2元 | 测试期单个素材最多允许花多少钱 | 超过此花费仍无转化的素材应立即移除止损 | R2(移除无效素材) |
| **3** | **每日初始预算** | `daily_init_budget` | 30元 | 每天早上重置的基础预算 | 确保每天有固定的起始资金池 | R3(日预算初始化) |
| **4** | **最低预算保底** | `min_budget` | 20元 | 预算调整的下限（不能再低了）| 防止预算被调得过小导致流量中断 | R4(最低预算保护) |
| **5** | **CPA过高阈值** | `high_cpa_threshold` | ≥15元 | 触发紧急预警/硬控的标准线 | 这是一个"危险信号"，需要立即行动 | R1(硬控), R5(预警) |
| **6** | **消耗率+加金额** | `consume_rate` | ≥80%, +50元 | 当预算消耗达到多少百分比时自动追加多少资金 | 防止爆款因预算耗尽而断流损失 | R6(自动扩量) |
| **7** | **加热预算** | `warmup_budget` | 15元 | 分配给新创建素材的启动测试资金 | 让新素材有机会获得初始展示量 | R7(新素材加热) |
| **8** | **取消加热条件** | `warmup_cancel_spend` | ≥5元 | 新素材累计花费达到多少后取消特殊待遇 | 测试阶段结束，让市场决定生死 | R8(取消加热) |

#### 各参数之间的逻辑关系图

```
                ┌─────────────────┐
                │  daily_init_    │
                │  budget (30元)   │ ← 每天的起点
                └────────┬────────┘
                         │ 设置为
                         ▼
                ┌─────────────────┐
                │  min_budget     │ ← 不能低于这个值
                │  (20元)         │
                └────────┬────────┘
                         │ 当消耗率≥80%时
                         │ 自动增加
                         ▼
                ┌─────────────────┐
                │  +50元          │ ← 防断流机制
                └────────┬────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌───────────┐ ┌──────────────────┐
│ warmup_budget│ │ max_cpa   │ │ high_cpa_        │
│ (15元)       │ │ (≤6元)    │ │ threshold(≥15元) │
│ 新素材测试    │ │ 日常控制线  │ │ 紧急红线         │
└───────────────┘ └───────────┘ └──────────────────┘
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────┐ ┌──────────────────┐
│ cancel at     │ │ R9: 加回  │ │ R1: 硬控停投     │
│ ≥5元          │ │ 优质素材  │ │ R5: 预警通知      │
└───────────────┘ └───────────┘ └──────────────────┘

独立参数:
┌─────────────────┐
│ max_creative_   │
│ spend (≤2元)     │ → R2: 移除无效素材
└─────────────────┘
```

---

### 6.3 九条生成规则的完整伪代码（TypeScript接口定义）

```typescript
// ============================================================
// 规则数据模型定义
// ============================================================

/** 条件运算符类型 */
type Comparator =
  | '>'   // 大于
  | '>='  // 大于等于
  | '<'   // 小于
  | '<='  // 小于等于
  | '=='  // 等于
  | '!='  // 不等于

/** 逻辑组合运算符 */
type LogicalOperator = 'AND' | 'OR' | 'NOT'

/** AST条件节点（递归结构，支持任意复杂的嵌套条件）*/
interface ConditionNode {
  /** 如果有子节点，则是逻辑组合节点 */
  operator?: LogicalOperator
  conditions?: ConditionNode[]  // 子条件数组
  
  /** 如果没有子节点，则是叶子节点（具体比较条件）*/
  field?: string           // 字段名（如 today_cpa）
  comparator?: Comparator  // 运算符
  value?: any              // 比较值（如 15 或 6）
}

/** 动作类型枚举 */
type ActionType =
  | 'SET_BUDGET'              // 设定固定预算值
  | 'INCREASE_BUDGET'         // 在现有基础上增加预算
  | 'DECREASE_BUDGET'         // 减少预算
  | 'DISABLE_SERIES'          // 暂停整个广告系列
  | 'ENABLE_SERIES'           // 启用系列
  | 'DISABLE_CREATIVE'        // 暂停/移除某个素材广告
  | 'ENABLE_CREATIVE'         // 启用/恢复某个素材广告
  | 'REMOVE_FROM_CAMPAIGN'    // 从系列中移除素材
  | 'ADD_TO_CAMPAIGN'         // 将素材加入系列投放
  | 'SEND_NOTIFICATION'       // 发送告警/通知消息
  | 'ENABLE_WITH_BUDGET'      // 启用并分配加热预算
  | 'REMOVE_WARMUP_BUDGET'    // 取消加热预算进入正常模式
  | 'ADJUST_BID'              // 调整出价

/** 动作项定义 */
interface ActionItem {
  type: ActionType            // 动作类型
  target?: string             // 目标对象ID（Campaign ID / Ad ID等）
  value?: number              // 数值参数（如预算金额）
  amount?: number             // 增量参数（如增加的金额）
  message?: string            // 通知文案（仅用于SEND_NOTIFICATION）
}

/** 调度计划类型（联合类型）*/
type ScheduleConfig =
  | { type: 'CONTINUOUS'; intervalMinutes: number }
  | { type: 'ONCE'; executeAt?: Date; executed?: boolean; executedAt?: Date }
  | { type: 'TIME_POINT'; cronExpression: string }
  | { type: 'TIME_RANGE'; startHour: number; startMinute: number; endHour: number; endMinute: number }
  | { type: 'INTERVAL'; intervalMinutes: number; offsetMinutes?: number }

/** 完整的规则定义 */
interface GeneratedRule {
  id: string                  // 规则唯一ID (如 'R1_CPA_HARD_STOP')
  name: string                // 规则名称（人类可读）
  layer: 'SERIES' | 'CREATIVE' | 'PRODUCT'  // 所属管理层级
  schedule: ScheduleConfig    // 调度配置
  condition: ConditionNode    // IF条件（AST语法树）
  action: ActionItem          // THEN动作
  priority: number            // 执行优先级（数字越小越先执行）
  description?: string        // 规则描述/说明
}

/** 用户输入参数集合（8个数值）*/
interface InputParams {
  max_cpa: number              // 参数1: 转化成本上限
  max_creative_spend: number  // 参数2: 素材花费上限
  daily_init_budget: number   // 参数3: 每日初始预算
  min_budget: number          // 参数4: 最低预算
  high_cpa_threshold: number  // 参数5: CPA过高阈值
  consume_rate_percent: number// 参数6: 消耗率百分比
  consume_rate_amount: number // 参数6: 增加金额
  warmup_budget: number       // 参数7: 加热预算
  warmup_cancel_spend: number // 参数8: 取消加热条件
}


// ============================================================
// 规则生成引擎核心函数
// ============================================================

/**
 * 智能规则生成器主函数
 * 输入: 8个用户参数
 * 输出: 9条完整的可执行规则实例
 */
function generateRules(params: InputParams): GeneratedRule[] {
  
  // ====== 参数预验证 ======
  validateParams(params)
  
  // ====== 生成9条规则 ======
  return [
    generateRule1_CpaHardStop(params),
    generateRule2_TestingStopLoss(params),
    generateRule3_DailyBudgetInit(params),
    generateRule4_MinBudgetProtect(params),
    generateRule5_CpaWarning(params),
    generateRule6_AutoScaleUp(params),
    generateRule7_NewCreativeWarmup(params),
    generateRule8_WarmupComplete(params),
    generateRule9_RestoreGoodCreative(params),
  ]
}

/**
 * 参数验证函数
 */
function validateParams(p: InputParams): void {
  const errors: string[] = []
  
  if (p.max_cpa <= 0) errors.push('转化成本上限必须大于0')
  if (p.max_creative_spend <= 0) errors.push('素材花费上限必须大于0')
  if (p.daily_init_budget < p.min_budget) {
    errors.push('每日初始预算必须大于等于最低预算')
  }
  if (p.max_cpa >= p.high_cpa_threshold) {
    errors.push('转化成本上限应小于CPA过高阈值')
  }
  if (p.consume_rate_percent < 0 || p.consume_rate_percent > 100) {
    errors.push('消耗率百分比应在0-100之间')
  }
  if (errors.length > 0) {
    throw new Error(`参数验证失败:\n${errors.join('\n')}`)
  }
}


// ============================================================
// 9条规则的具体生成函数
// ============================================================

/**
 * ====== 规则1: CPA硬控停投（最重要！）======
 * 
 * 作用: 当CPA超过危险阈值时，立即无条件暂停
 * 优先级: 最高（1）— 这是最严格的保护措施
 * 层级: CREATIVE（也可以用在SERIES级别）
 */
function generateRule1_CpaHardStop(p: InputParams): GeneratedRule {
  return {
    id: 'R1_CPA_HARD_STOP',
    name: 'CPA超标立即停投（硬控）',
    layer: 'CREATIVE',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 1,
    description: `当今日CPA ≥ ${p.high_cpa_threshold}元时，立即暂停该创意`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'today_cpa',
          comparator: '>=',
          value: p.high_cpa_threshold  // 默认≥15元
        }
      ]
    },
    action: {
      type: 'DISABLE_CREATIVE',
      target: '$current_creative'  // $变量表示当前正在评估的对象
    }
  }
}

/**
 * ====== 规则2: 素材测试止损 ======
 * 
 * 作用: 给新素材一个"试用期"，花了测试预算还没出单就淘汰
 * 优先级: 2（高）— 快速止损很重要
 * 层级: CREATIVE
 */
function generateRule2_TestingStopLoss(p: InputParams): GeneratedRule {
  return {
    id: 'R2_TESTING_STOP_LOSS',
    name: '移除无效素材（测试止损）',
    layer: 'CREATIVE',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 2,
    description: `当今日素材花费 ≥ ${p.max_creative_spend}元 且 今日订单 = 0 时移除`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'today_creative_spend',
          comparator: '>=',
          value: p.max_creative_spend  // 默认≥2元
        },
        {
          field: 'today_creative_orders',
          comparator: '==',
          value: 0
        }
      ]
    },
    action: {
      type: 'REMOVE_FROM_CAMPAIGN',
      target: '$current_creative'
    }
  }
}

/**
 * ====== 规则3: 日预算初始化 ======
 * 
 * 作用: 每天零点将所有系列预算重置为初始值，确保公平竞争
 * 优先级: 3（中高）
 * 层级: SERIES
 */
function generateRule3_DailyBudgetInit(p: InputParams): GeneratedRule {
  return {
    id: 'R3_DAILY_BUDGET_INIT',
    name: '每日重置初始预算',
    layer: 'SERIES',
    schedule: { 
      type: 'TIME_POINT', 
      cronExpression: '0 0 * * *'  // 每天00:00:00执行
    },
    priority: 3,
    description: `每天00:00将系列预算重置为 ${p.daily_init_budget}元`,
    condition: {
      operator: 'ALWAYS'  // 无条件执行（特殊的叶子节点）
    },
    action: {
      type: 'SET_BUDGET',
      value: p.daily_init_budget  // 默认30元
    }
  }
}

/**
 * ====== 规则4: 最低预算保护 ======
 * 
 * 作用: 防止预算被其他规则调得太低导致流量完全中断
 * 优先级: 4（中）
 * 层级: SERIES
 */
function generateRule4_MinBudgetProtect(p: InputParams): GeneratedRule {
  return {
    id: 'R4_MIN_BUDGET_PROTECT',
    name: '最低预算保底保护',
    layer: 'SERIES',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 4,
    description: `当当前预算 < ${p.min_budget}元时，提升到${p.min_budget}元`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'current_budget',
          comparator: '<',
          value: p.min_budget  // 默认<20元
        }
      ]
    },
    action: {
      type: 'SET_BUDGET',
      value: p.min_budget
    }
  }
}

/**
 * ====== 规则5: CPA预警通知 ======
 * 
 * 作用: CPA偏高但还没到硬控线时发出警告，让人工决策
 * 优先级: 5（中）
 * 层级: CREATIVE
 * 
 * 设计思路: 在R1(硬控)之前有一个"软预警"区间
 * 例如: max_cpa=6, high_cpa_threshold=15
 * 则 6≤CPA<15 区间内触发警告而不是直接停投
 */
function generateRule5_CpaWarning(p: InputParams): GeneratedRule {
  return {
    id: 'R5_CPA_WARNING',
    name: 'CPA偏高预警通知',
    layer: 'CREATIVE',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 5,
    description: `当今日CPA ≥ ${p.max_cpa}元 且 < ${p.high_cpa_threshold}元时发送预警`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'today_cpa',
          comparator: '>=',
          value: p.max_cpa  // 默认≥6元
        },
        {
          field: 'today_cpa',
          comparator: '<',
          value: p.high_cpa_threshold  // 但<15元（还没到硬控线）
        }
      ]
    },
    action: {
      type: 'SEND_NOTIFICATION',
      message: `⚠️ CPA偏高(${p.max_cpa}~${p.high_cpa_threshold}元区间)，请注意监控！建议手动检查或等待系统自动优化。`
    }
  }
}

/**
 * ====== 规则6: 消耗率触发自动扩量 ======
 * 
 * 作用: 爆款素材跑得很快，防止因预算耗尽导致断流
 * 优先级: 6（中低）— 先确保安全再考虑扩量
 * 层级: SERIES
 * 
 * 设计思路: 只有ROI健康的情况下才会自动加预算
 * 避免给亏损的广告继续送钱
 */
function generateRule6_AutoScaleUp(p: InputParams): GeneratedRule {
  return {
    id: 'R6_AUTO_SCALE_UP',
    name: '爆款跑飞防断流（自动扩量）',
    layer: 'SERIES',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 6,
    description: `当今日消耗率 ≥ ${p.consume_rate_percent}% 且 近7天ROI ≥ 2.0 时，自动增加预算 ${p.consume_rate_amount}元`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'today_consume_rate',
          comparator: '>=',
          value: p.consume_rate_percent / 100  // 默认≥80%即0.8
        },
        {
          field: 'series_roi_7d',
          comparator: '>=',
          value: 2.0  // ROI必须健康
        }
      ]
    },
    action: {
      type: 'INCREASE_BUDGET',
      amount: p.consume_rate_amount  // 默认+50元
    }
  }
}

/**
 * ====== 规则7: 新素材冷启动加热 ======
 * 
 * 作用: 新上传的素材需要一笔"启动资金"来获得初始曝光
 * 优先级: 7（较低）
 * 层级: CREATIVE
 * 
 * 设计思路: 新素材如果没有初始预算分配，可能永远不会被展示
 * 所以系统主动给它一笔测试预算
 */
function generateRule7_NewCreativeWarmup(p: InputParams): GeneratedRule {
  return {
    id: 'R7_NEW_CREATIVE_WARMUP',
    name: '新素材冷启动加热',
    layer: 'CREATIVE',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 7,
    description: `发现今天新建且未投放的素材，自动启用并分配 ${p.warmup_budget}元加热预算`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'creative_status',
          comparator: '==',
          value: 'NOT_RUNNING'  // 未在投放状态
        },
        {
          field: 'creative_created_date',
          comparator: '==',
          value: 'TODAY'  // 今天创建的
        }
      ]
    },
    action: {
      type: 'ENABLE_WITH_BUDGET',
      amount: p.warmup_budget  // 默认15元
    }
  }
}

/**
 * ====== 规则8: 取消加热进入正常投放 ======
 * 
 * 作用: 素材已经获得了足够的测试机会，取消特殊照顾
 * 优先级: 8（低）
 * 层级: CREATIVE
 * 
 * 设计思路: 加热阶段结束后，应该让市场自然选择
 * 此时如果素材好，会被R9(加回规则)重新启用；不好就会被R2(移除规则)淘汰
 */
function generateRule8_WarmupComplete(p: InputParams): GeneratedRule {
  return {
    id: 'R8_WARMUP_COMPLETE',
    name: '取消加热进入正常投放模式',
    layer: 'CREATIVE',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 8,
    description: `加热中的素材累计花费 ≥ ${p.warmup_cancel_spend}元时，取消加热预算`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'creative_is_warming_up',
          comparator: '==',
          value: true  // 标记为正在加热状态
        },
        {
          field: 'total_creative_spend',
          comparator: '>=',
          value: p.warmup_cancel_spend  // 默认≥5元
        }
      ]
    },
    action: {
      type: 'REMOVE_WARMUP_BUDGET',
      target: '$current_creative'
    }
  }
}

/**
 * ====== 规则9: 优质素材自动加回 ======
 * 
 * 作用: 曾经表现好的素材（可能是被R2误杀的），自动恢复
 * 优先级: 9（最低）— 最后执行，作为兜底机制
 * 层级: CREATIVE
 * 
 * 设计思路: 有些素材可能只是暂时表现不好（比如某天没出单），
 * 但长期来看是优质的。这条规则给了它们"复活"的机会。
 */
function generateRule9_RestoreGoodCreative(p: InputParams): GeneratedRule {
  return {
    id: 'R9_RESTORE_GOOD_CREATIVE',
    name: '恢复历史优质素材',
    layer: 'CREATIVE',
    schedule: { type: 'CONTINUOUS', intervalMinutes: 8 },
    priority: 9,
    description: `近7天有订单 且 近7天CPA < ${p.max_cpa}元的素材自动加回投放`,
    condition: {
      operator: 'AND',
      conditions: [
        {
          field: 'creative_7d_orders',
          comparator: '>',
          value: 0  // 有出单
        },
        {
          field: 'creative_7d_cpa',
          comparator: '<',
          value: p.max_cpa  // CPA在可控范围内
        }
      ]
    },
    action: {
      type: 'ADD_TO_CAMPAIGN',
      target: '$current_creative'
    }
  }
}
```

---

## ⚡ 七、规则引擎核心运行机制（深度代码级剖析）

### 7.1 规则生命周期

```
创建 → 验证 → 存储 → 调度 → 评估 → 匹配 → 执行 → 记录
 ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓
用户   语法   MySQL  Cron   拉取   IF    THEN   日志
填写   检查   入库   注册   数据   判断   动作   +通知
```

### 7.2 条件解析器（IF部分 — 核心算法）

```typescript
/**
 * 条件评估器 — 规则引擎的大脑
 * 
 * 功能: 接收一个条件AST树 + 当前数据上下文 → 返回 true/false
 * 支持: 任意深度的 AND/OR/NOT 嵌套组合
 */
class ConditionEvaluator {
  
  /**
   * 主入口：评估条件是否满足
   * @param condition 条件的AST语法树
   * @param context 数据上下文（包含所有字段的当前值）
   * @returns true=条件匹配 / false=条件不匹配
   */
  evaluate(condition: ConditionNode, context: DataContext): boolean {
    
    // 检查是否有子节点（逻辑组合节点）
    if (condition.operator && condition.conditions) {
      return this.evaluateLogical(condition.operator, condition.conditions, context)
    }
    
    // 否则是叶子节点（具体比较条件）
    if (condition.field && condition.comparator && condition.value !== undefined) {
      return this.evaluateLeaf(condition.field, condition.comparator, condition.value, context)
    }
    
    // 特殊节点: ALWAYS（无条件成立）
    if (condition.operator === 'ALWAYS') {
      return true
    }
    
    throw new Error(`无效的条件节点: ${JSON.stringify(condition)}`)
  }
  
  /**
   * 评估逻辑组合（AND/OR/NOT）
   */
  private evaluateLogical(
    operator: LogicalOperator, 
    conditions: ConditionNode[], 
    context: DataContext
  ): boolean {
    switch (operator) {
      case 'AND':
        // 所有子条件都必须为true
        return conditions.every(child => this.evaluate(child, context))
        
      case 'OR':
        // 至少一个子条件为true即可
        return conditions.some(child => this.evaluate(child, context))
        
      case 'NOT':
        // 对第一个子条件取反（通常只有一个子节点）
        return !this.evaluate(conditions[0], context)
        
      default:
        throw new Error(`未知逻辑运算符: ${operator}`)
    }
  }
  
  /**
   * 评估叶子节点（具体的字段比较）
   */
  private evaluateLeaf(
    field: string, 
    comparator: Comparator, 
    expectedValue: any, 
    context: DataContext
  ): boolean {
    const actualValue = this.getFieldValue(context, field)
    
    // 处理可能的undefined/null（防御性编程）
    if (actualValue === undefined || actualValue === null) {
      console.warn(`[ConditionEvaluator] 字段 ${field} 的值为空，视为不匹配`)
      return false
    }
    
    switch (comparator) {
      case '>':   return actualValue > expectedValue
      case '>=':  return actualValue >= expectedValue
      case '<':   return actualValue < expectedValue
      case '<=':  return actualValue <= expectedValue
      case '==':  return actualValue == expectedValue  // 松散相等
      case '!=':  return actualValue != expectedValue
      default:
        throw new Error(`未知比较运算符: ${comparator}`)
    }
  }
  
  /**
   * 字段解析器 — 将字段名映射到实际的数据值
   * 
   * 这是连接抽象字段名和具体数据的桥梁
   * 支持30+种字段的动态解析
   */
  getFieldValue(context: DataContext, field: string): number | string | boolean {
    
    // ---- 今日数据字段 ----
    const today = context.todayMetrics
    switch (field) {
      case 'today_cpa': return today.cpa
      case 'today_creative_spend': return context.currentCreative?.todaySpend ?? 0
      case 'today_creative_orders': return context.currentCreative?.todayOrders ?? 0
      case 'today_consume_rate': return today.spend / context.budget
      case 'current_budget': return context.budget
      case 'creative_status': return context.currentCreative?.status
      case 'creative_created_date': return this.getCreativeCreatedDate(context.currentCreative)
      case 'creative_is_warming_up': return context.currentCreative?.isWarmingUp ?? false
      case 'total_creative_spend': return context.currentCreative?.totalSpend ?? 0
      // ...
    }
    
    // ---- 近7天数据字段 ----
    const d7 = context.metrics7d
    switch (field) {
      case 'series_roi_7d': return d7.roi
      case 'creative_7d_orders': return context.currentCreative?.orders7d ?? 0
      case 'creative_7d_cpa': return context.currentCreative?.cpa7d ?? 999
      // ...
    }
    
    // ---- 特殊常量字段 ----
    switch (field) {
      case 'TODAY': return 'TODAY'  // 用于日期比较
    }
    
    // 如果都不匹配，尝试从context动态查找
    if (field in context) {
      return (context as any)[field]
    }
    
    // 未知的字段名
    throw new Error(`未知字段名: ${field}`)
  }
  
  /**
   * 辅助方法: 获取素材创建日期（返回'TODAY'或其他日期字符串）
   */
  private getCreativeCreatedDate(creative: CreativeContext | undefined): string {
    if (!creative) return ''
    const createdDate = new Date(creative.createdAt)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'TODAY'
    if (diffDays === 1) return 'YESTERDAY'
    return `${diffDays}DAYS_AGO`
  }
}
```

### 7.3 数据上下文（DataContext）的定义

```typescript
/**
 * 数据上下文 — 传递给条件评估器的所有可用数据
 */
interface DataContext {
  // === 基础信息 ===
  advertiserId: string
  userId: string
  evaluationTime: Date
  
  // === 当前正在评估的目标对象 ===
  targetType: 'CAMPAIGN' | 'ADGROUP' | 'AD' | 'PRODUCT'
  targetId: string
  
  // === 当前系列/组/广告的信息 ===
  currentSeries?: SeriesContext
  currentAdgroup?: AdgroupContext
  currentCreative?: CreativeContext
  currentProduct?: ProductContext
  
  // === 预计算的指标数据 ===
  todayMetrics: MetricSnapshot     // 今日数据快照
  metrics3d: MetricSnapshot        // 近3天聚合
  metrics7d: MetricSnapshot        // 近7天聚合（最常用）
  metrics14d: MetricSnapshot       // 近14天聚合
  metrics30d: MetricSnapshot       // 近30天聚合
  
  // === 配置信息 ===
  budget: number                   // 当前预算值
  userSettings: UserInputParams    // 用户设置的8个参数
}

/** 指标快照 */
interface MetricSnapshot {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  orders: number
  // 派生指标
  cpa: number
  roi: number
  ctr: number
  cpc: number
  cpm: number
  cvrClick: number
  aov: number
}

/** 系列/创意上下文 */
interface SeriesContext {
  id: string
  name: string
  budget: number
  status: string
  todaySpend: number
  totalSpend: number
}

interface CreativeContext {
  id: string
  name: string
  videoUrl?: string
  thumbnailUrl?: string
  status: string  // ACTIVE / PAUSED / NOT_RUNNING
  createdAt: string
  isWarmingUp: boolean
  todaySpend: number
  todayOrders: number
  todayImpressions: number
  totalSpend: number
  orders7d: number
  cpa7d: number
  roi7d: number
}
```

### 7.4 动作执行器（THEN部分 — 与TikTok API交互的核心）

```typescript
/**
 * 动作执行器 — 规则引擎的手臂
 * 
 * 功能: 接收一个动作指令 → 调用对应的TikTok API → 返回执行结果
 * 包含: 错误处理、重试逻辑、日志记录、限速控制
 */
class ActionExecutor {
  private apiClientFactory: (advertiserId: string) => TikTokAdsClient
  private rateLimiter: RateLimiter  // API限速控制器
  
  constructor(apiClientFactory: (advertiserId: string) => TikTokAdsClient) {
    this.apiClientFactory = apiClientFactory
    this.rateLimiter = new RateLimiter({
      maxRequestsPerSecond: 10,  // TikTok API限制约10QPS
      maxRequestsPerDay: 100000  // 每日限额
    })
  }
  
  /**
   * 主入口：执行动作
   */
  async execute(action: ActionItem, context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      // 1. 限速检查
      await this.rateLimiter.acquire()
      
      // 2. 安全检查（防止危险操作）
      this.safetyCheck(action)
      
      // 3. 根据动作类型分发处理
      let result: any
      switch (action.type) {
        case 'SET_BUDGET':
          result = await this.handleSetBudget(action, context)
          break
        case 'INCREASE_BUDGET':
          result = await this.handleIncreaseBudget(action, context)
          break
        case 'DISABLE_CREATIVE':
        case 'DISABLE_SERIES':
          result = await this.handleDisable(action, context)
          break
        case 'ENABLE_CREATIVE':
        case 'ENABLE_SERIES':
          result = await this.handleEnable(action, context)
          break
        case 'REMOVE_FROM_CAMPAIGN':
          result = await this.handleRemoveFromCampaign(action, context)
          break
        case 'ADD_TO_CAMPAIGN':
          result = await this.handleAddToCampaign(action, context)
          break
        case 'SEND_NOTIFICATION':
          result = await this.handleSendNotification(action, context)
          break
        case 'ENABLE_WITH_BUDGET':
          result = await this.handleEnableWithBudget(action, context)
          break
        case 'REMOVE_WARMUP_BUDGET':
          result = await this.handleRemoveWarmupBudget(action, context)
          break
        default:
          throw new Error(`未知的动作类型: ${(action as any).type}`)
      }
      
      // 4. 构建成功结果
      const duration = Date.now() - startTime
      return {
        success: true,
        actionType: action.type,
        targetId: context.targetId,
        apiResponse: result,
        durationMs: duration
      }
      
    } catch (error) {
      // 5. 错误处理与重试
      const duration = Date.now() - startTime
      const execError = error as Error
      
      console.error(`[ActionExecutor] 动作 ${action.type} 执行失败:`, execError.message)
      
      // 判断是否应该重试（网络错误/API限流可以重试，业务错误不应该重试）
      if (this.shouldRetry(execError)) {
        await this.delay(2000)  // 等2秒再试
        return this.execute(action, context)  // 递归重试（最多重试1次）
      }
      
      // 不可重试的错误，返回失败结果
      return {
        success: false,
        actionType: action.type,
        targetId: context.targetId,
        errorMessage: execError.message,
        durationMs: duration
      }
    }
  }
  
  // ==================== 各动作的具体实现 ====================
  
  /**
   * 设定固定预算
   */
  private async handleSetBudget(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const api = this.apiClientFactory(ctx.advertiserId)
    
    return api.campaignUpdate({
      body: {
        advertiser_id: ctx.advertiserId,
        campaign_ids: [ctx.targetId],
        budget_mode: 'BUDGET_MODE_DAY',
        budget: action.value!,  // 使用用户设定的值
      }
    })
  }
  
  /**
   * 在现有基础上增加预算
   */
  private async handleIncreaseBudget(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const api = this.apiClientFactory(ctx.advertiserId)
    
    // 先查询当前预算
    const current = await this.getCurrentBudget(ctx)
    const newBudget = current + action.amount!
    
    // 安全限制: 单次增幅不超过500元
    if (action.amount! > 500) {
      throw new Error(`单次预算增幅过大(${action.amount}元)，已拒绝操作（安全限制500元）`)
    }
    
    return api.campaignUpdate({
      body: {
        advertiser_id: ctx.advertiserId,
        campaign_ids: [ctx.targetId],
        budget_mode: 'BUDGET_MODE_DAY',
        budget: newBudget,
      }
    })
  }
  
  /**
   * 暂停（系列或素材）
   */
  private async handleDisable(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const api = this.apiClientFactory(ctx.advertiserId)
    
    if (ctx.targetType === 'CAMPAIGN') {
      return api.campaignStatusUpdate({
        body: {
          advertiser_id: ctx.advertiserId,
          campaign_ids: [ctx.targetId],
          operation_status: 'DISABLE'
        }
      })
    } else {
      // AD级别
      return api.adStatusUpdate({
        body: {
          advertiser_id: ctx.advertiserId,
          ad_ids: [ctx.targetId],
          operation_status: 'DISABLE'
        }
      })
    }
  }
  
  /**
   * 启用（系列或素材）
   */
  private async handleEnable(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const api = this.apiClientFactory(ctx.advertiserId)
    
    if (ctx.targetType === 'CAMPAIGN') {
      return api.campaignStatusUpdate({
        body: {
          advertiser_id: ctx.advertiserId,
          campaign_ids: [ctx.targetId],
          operation_status: 'ENABLE'
        }
      })
    } else {
      return api.adStatusUpdate({
        body: {
          advertiser_id: ctx.advertiserId,
          ad_ids: [ctx.targetId],
          operation_status: 'ENABLE'
        }
      })
    }
  }
  
  /**
   * 从系列中移除素材（GMV Max特有操作）
   */
  private async handleRemoveFromCampaign(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const api = this.apiClientFactory(ctx.advertiserId)
    
    // 方案1: 直接暂停该Ad（通用做法）
    return api.adStatusUpdate({
      body: {
        advertiser_id: ctx.advertiserId,
        ad_ids: [ctx.targetId],
        operation_status: 'DISABLE'
      }
    })
    
    // 方案2: 如果TikTok API支持从Campaign解绑Creative（更精准）
    // return api.campaignCreativeDelete({ ... })
  }
  
  /**
   * 将素材加入系列投放
   */
  private async handleAddToCampaign(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const api = this.apiClientFactory(ctx.advertiserId)
    
    // 重新启用之前暂停的Ad
    return api.adStatusUpdate({
      body: {
        advertiser_id: ctx.advertiserId,
        ad_ids: [ctx.targetId],
        operation_status: 'ENABLE'
      }
    })
  }
  
  /**
   * 发送通知消息
   */
  private async handleSendNotification(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const notificationService = new NotificationService()
    
    return notificationService.send({
      userId: ctx.userId,
      title: `🤖 规则引擎通知: ${ctx.ruleName}`,
      message: action.message!,
      level: 'INFO',  // WARNING / ERROR / SUCCESS
      metadata: {
        ruleId: ctx.ruleId,
        targetId: ctx.targetId,
        targetType: ctx.targetType,
        snapshot: {
          cpa: ctx.context.todayMetrics.cpa,
          roi: ctx.context.todayMetrics.roi,
          spend: ctx.context.todayMetrics.spend,
          budget: ctx.context.budget,
        },
        triggeredAt: new Date().toISOString(),
      }
    })
  }
  
  /**
   * 启用并分配加热预算
   */
  private async handleEnableWithBudget(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    const api = this.apiClientFactory(ctx.advertiserId)
    
    // 1. 启用该Ad
    await api.adStatusUpdate({
      body: {
        advertiser_id: ctx.advertiserId,
        ad_ids: [ctx.targetId],
        operation_status: 'ENABLE'
      }
    })
    
    // 2. 标记为加热状态（记录到我们自己的数据库）
    await db.creatives.update(ctx.targetId, {
      is_warming_up: true,
      warming_up_since: new Date(),
      warmup_budget_remaining: action.amount!
    })
    
    return { success: true, message: `已启用并标记为加热状态，预算${action.amount}元` }
  }
  
  /**
   * 取消加热预算
   */
  private async handleRemoveWarmupBudget(action: ActionItem, ctx: ExecutionContext): Promise<any> {
    // 更新数据库中的加热状态标记
    await db.creatives.update(ctx.targetId, {
      is_warming_up: false,
      warming_up_until: new Date(),
    })
    
    return { success: true, message: '已取消加热标记，恢复正常投放模式' }
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 安全检查：防止危险操作
   */
  private safetyCheck(action: ActionItem): void {
    // 危险操作清单
    const dangerousActions = ['DISABLE_SERIES', 'SET_BUDGET']
    
    if (dangerousActions.includes(action.type)) {
      // 可以在这里添加二次确认逻辑或审计日志
      console.log(`[SafetyCheck] ⚠️ 执行危险操作: ${action.type}`, action)
    }
    
    // 预算变更幅度检查
    if (action.type === 'INCREASE_BUDGET' && action.amount && action.amount > 1000) {
      throw new Error(`单次预算增加幅度过大(${action.amount}元)，已拦截`)
    }
  }
  
  /**
   * 判断错误是否可重试
   */
  private shouldRetry(error: Error): boolean {
    const retryablePatterns = [
      /RATE_LIMIT_EXCEEDED/i,
      /NETWORK_ERROR/i,
      /TIMEOUT/i,
      /ECONNRESET/i,
      /SERVICE_UNAVAILABLE/i,
      /TOO_MANY_REQUESTS/i,
    ]
    
    return retryablePatterns.some(pattern => pattern.test(error.message))
  }
  
  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 查询当前预算（辅助函数）
   */
  private async getCurrentBudget(ctx: ExecutionContext): Promise<number> {
    const api = this.apiClientFactory(ctx.advertiserId)
    const result = await api.campaignGet({
      advertiser_id: ctx.advertiserId,
      campaign_ids: [ctx.targetId],
      fields: ['budget']
    })
    return result.data.list[0].budget
  }
}

/** 执行结果类型 */
interface ExecutionResult {
  success: boolean
  actionType: string
  targetId: string
  apiResponse?: any
  errorMessage?: string
  durationMs: number
}

/** 执行上下文 */
interface ExecutionContext {
  advertiserId: string
  targetId: string
  targetType: string
  ruleId: string
  ruleName: string
  context: DataContext
  userId: string
}
```

---

## 🧮 八、公式计算引擎（差异化亮点功能）

### 8.1 内置公式库

```typescript
/**
 * 公式计算引擎 — 支持动态预算和自定义字段
 */
class FormulaEngine {
  
  /**
   * 内置公式1: 预算消耗率
   * 
   * 含义: 已经花了百分之多少的预算
   * 用途: 判断是否接近预算耗尽（≥80%时考虑加预算）
   */
  consumeRate(spend: number, budget: number): number {
    if (budget === 0) return 1  // 防止除零
    return Number((spend / budget).toFixed(4))  // 返回0-1之间的小数
  }
  
  /**
   * 内置公式2: 动态建议预算（核心差异化功能！）
   * 
   * 来源: TK GMV Max网站的明确说明 "预算 = 花费 × 1.6"
   * 
   * 数学原理: 
   * - 如果ROI=2（花1赚2），那么花越多赚越多
   * - 乘以1.6意味着: 如果已经花了100元，建议预算设为160元
   * - 这样还有60元的余量可以让爆款继续跑
   * - 系数1.6是根据经验得出的"安全扩量系数"
   *   （太激进可能导致亏损，太保守可能错失爆量机会）
   * 
   * @param spend 当前已花费金额
   * @param multiplier 扩量系数（默认1.6，可根据风险偏好调整）
   * @returns 建议的新预算值
   */
  dynamicBudget(spend: number, multiplier: number = 1.6): number {
    const suggested = spend * multiplier
    // 四舍五入到整数（因为TikTok API接受的预算通常是整数）
    return Math.round(suggested)
  }
  
  /**
   * 内置公式3: CPA趋势变化率
   * 
   * 用途: 监控成本变化方向
   * - 正值: 成本在恶化（今天比昨天贵了）
   * - 负值: 成本在改善（今天比昨天便宜了）
   * - 零: 成本持平
   */
  cpaTrend(todayCpa: number, yesterdayCpa: number): number {
    if (yesterdayCpa === 0) return todayCpa > 0 ? 1 : 0
    return Number(((todayCpa - yesterdayCpa) / yesterdayCpa).toFixed(4))
  }
  
  /**
   * 内置公式4: ROI加权评分（用于综合判断）
   * 
   * 用途: 将ROI转换为0-1之间的评分
   * - >1.0: 超额完成任务（评分>0.5）
   * - =1.0: 刚好回本（评分=0.5）
   * - <1.0: 亏损（评分<0.5）
   */
  roiScore(currentRoi: number, targetRoi: number = 2.0): number {
    if (targetRoi === 0) return currentRoi > 0 ? 1 : 0
    const ratio = currentRoi / targetRoi
    // 使用sigmoid函数平滑映射到0-1
    return Number((1 / (1 + Math.exp(-ratio))).toFixed(4))
  }
  
  /**
   * 内置公式5: 真实利润率（结合Bozone财务数据）
   * 
   * ⭐这是TK GMV Max做不到的！因为他们没有店铺成本数据
   * 
   * 公式: (营收 - 采购成本 - 佣金 - 物流费 - 包装费 - 仓储费 - 广告费) / 营收
   */
  realProfitMargin(data: {
    revenue: number
    productCost: number
    commission: number
    shippingCost: number
    packagingCost: number
    warehouseCost: number
    adSpend: number
  }): number {
    const totalCost = data.productCost + data.commission + data.shippingCost + 
                      data.packagingCost + data.warehouseCost + data.adSpend
    const profit = data.revenue - totalCost
    
    if (data.revenue === 0) return profit >= 0 ? 1 : -1
    return Number((profit / data.revenue).toFixed(4))
  }
}
```

### 8.2 自定义公式解析器（高级功能 — 支持用户自己写公式）

```typescript
/**
 * 自定义公式解析器 — 让用户可以用简单的数学表达式定义自己的指标
 * 
 * 安全考虑: 使用mathjs库而非eval()，防止代码注入攻击
 */
import { evaluate, parse } from 'mathjs'

class CustomFormulaParser {
  private cache: Map<string, ReturnType<typeof parse>> = new Map()
  
  /**
   * 解析并计算自定义公式
   * 
   * @param formulaString 公式字符串（如 "spend / budget * 100"）
   * @param variables 变量字典（如 { spend: 24, budget: 30 }）
   * @returns 计算结果
   */
  parse(formulaString: string, variables: Record<string, number>): number {
    try {
      // 1. 安全性检查：只允许数学运算符和字母数字变量名
      this.validateFormula(formulaString)
      
      // 2. 编译公式（带缓存加速重复计算）
      let compiled = this.cache.get(formulaString)
      if (!compiled) {
        compiled = parse(formulaString)
        this.cache.set(formulaString, compiled)
      }
      
      // 3. 代入变量求值
      const result = compiled.evaluate(variables)
      
      // 4. 结果校验
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error(`公式计算结果非法: ${result}`)
      }
      
      return Number(result.toFixed(4))
      
    } catch (error) {
      const err = error as Error
      throw new Error(`公式解析错误 "${formulaString}": ${err.message}`)
    }
  }
  
  /**
   * 公式安全性验证（白名单机制）
   * 
   * 只允许: 数字、变量名、四则运算、括号、常用数学函数
   * 禁止: 函数调用、属性访问、赋值语句等
   */
  private validateFormula(formula: string): void {
    // 移除空白字符
    const cleaned = formula.replace(/\s/g, '')
    
    // 白名单正则：只允许数字、字母、下划线和数学符号
    const allowedPattern = /^[a-zA-Z0-9_+\-*/().%^]+$/
    
    if (!allowedPattern.test(cleaned)) {
      throw new Error(`公式包含非法字符，只允许: 字母、数字、+-*/().^%`)
    }
    
    // 黑名单关键词检查
    const forbiddenKeywords = [
      'function', '=>', 'const', 'let', 'var', 'return',
      'require', 'import', 'process', 'global', 'window',
      'eval', 'Function', 'new', 'delete', 'void',
      '__proto__', 'prototype', 'constructor'
    ]
    
    const lowerFormula = formula.toLowerCase()
    for (const keyword of forbiddenKeywords) {
      if (lowerFormula.includes(keyword)) {
        throw new Error(`公式禁止包含关键字: ${keyword}`)
      }
    }
  }
  
  /**
   * 清空编译缓存（当公式更新时调用）
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ==================== 使用示例 ====================

const parser = new CustomFormulaParser()

// 示例1: 预算消耗率
const result1 = parser.parse('spend / budget * 100', { spend: 24, budget: 30 })
console.log(result1)  // 输出: 80 (%)

// 示例2: 动态预算建议
const result2 = parser.parse('spend * 1.6', { spend: 100 })
console.log(result2)  // 输出: 160

// 示例3: 综合评分（复合公式）
const result3 = parser.parse('(roi / 3) * 0.6 + (1 / cpa) * 0.4', {
  roi: 2.5,
  cpa: 5
})
console.log(result3)  // 输出: 0.68 (综合评分68%)

// 示例4: 异常处理（非法公式）
try {
  parser.parse('process.exit(1)', {})
} catch (e) {
  console.error(e.message)  // 输出: "公式禁止包含关键字: process"
}
```

---

## 💾 九、数据库设计（完整ER图与DDL）

### 9.1 ER关系图（文本版）

```
┌──────────────┐       ┌─────────────────────┐       ┌──────────────┐
│    users     │       │  tiktok_ad_accounts  │       │  rule_groups │
├──────────────┤       ├─────────────────────┤       ├──────────────┤
│ PK id        │──┐    │ PK id               │  ┌───│ PK id        │
│ phone (UQ)   │  └───▶│ FK user_id          │  │   │ FK user_id   │
│ password_hash│       │ advertiser_id (UQ)  │  └──▶│ name         │
│ created_at   │       │ access_token        │       │ created_at   │
└──────────────┘       │ refresh_token       │       └──────┬──────┘
                      │ token_expires_at    │              │
                      │ shop_name           │       ┌──────▼──────┐
                      │ status              │       │ group_rule_  │
                      └──────────┬──────────┘       │ bindings    │
                                 │                 ├──────────────┤
                                 │                 │ PK id        │
┌────────────────────────────────▼─────────┐   │ FK group_id   │
│                  rules                   │   │ FK rule_id    │
├──────────────────────────────────────────┤   │ bound_target_ │
│ PK id                                    │   │   type        │
│ FK user_id                               │   │ bound_target_ │
│ name                                     │   │   id          │
│ layer (ENUM)                             │   └──────────────┘
│ schedule_type (ENUM)                     │
│ cron_expression                         │
│ start_hour / end_hour                   │
│ interval_minutes                       │
│ condition_json (JSON) ◄──────────────────────────────────────┐
│ action_json (JSON)                                               │
│ enabled                                                           │
│ priority                                                          │
│ created_at / updated_at                                         │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ 1:N
               ▼
┌──────────────────────────────┐
│    rule_execution_logs      │
├──────────────────────────────┤
│ PK id                       │
│ FK rule_id                  │
│ executed_at                 │
│ advertiser_id               │
│ target_id                   │
│ target_type                 │
│ condition_result (BOOL)     │
│ action_type                 │
│ action_payload (JSON)       │
│ execution_status (ENUM)     │
│ error_message               │
│ api_response (JSON)         │
│ execution_duration_ms       │
└──────────────────────────────┘


┌──────────────────────────────┐
│    ad_metrics_cache         │  ◄── 缓存层（避免频繁调API）
├──────────────────────────────┤
│ PK id                       │
│ advertiser_id               │
│ target_id                   │
│ target_type (ENUM)          │
│ metric_date (DATE)          │
│ spend                       │
│ impressions                 │
│ clicks                      │
│ conversions                 │
│ revenue                     │
│ orders                      │
│ cpa / roi / ctr / cpc / cpm │
│ cached_at                  │
│ UNIQUE(advertiser_id,target │
│   _id,target_type,metric_   │
│   date)                     │
└──────────────────────────────┘
```

### 9.2 完整DDL语句（MySQL 8.0）

```sql
-- ============================================================
-- TK GMV Max 数据库设计（完整版）
-- 字符集: utf8mb4（支持emoji和特殊字符）
-- 排序规则: utf8mb4_unicode_ci（大小写不敏感）
-- ============================================================

-- 1. 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(11) UNIQUE NOT NULL COMMENT '手机号（登录账号）',
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt加密密码',
  nickname VARCHAR(64) DEFAULT '' COMMENT '昵称',
  avatar_url VARCHAR(512) DEFAULT '' COMMENT '头像URL',
  status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户账户表';

-- 2. TikTok广告账户授权表
CREATE TABLE tiktok_ad_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '关联的用户ID',
  advertiser_id VARCHAR(64) NOT NULL COMMENT 'TikTok广告账户ID',
  app_id VARCHAR(64) DEFAULT '' COMMENT 'TikTok App ID',
  app_secret_encrypted TEXT COMMENT '加密存储的App Secret',
  access_token TEXT COMMENT '当前有效的Access Token（有效期24h）',
  refresh_token_encrypted TEXT COMMENT '加密的Refresh Token（有效期1年）',
  token_expires_at TIMESTAMP NULL COMMENT 'Token过期时间',
  shop_name VARCHAR(255) DEFAULT '' COMMENT '店铺名称（便于识别）',
  region VARCHAR(10) DEFAULT 'MY' COMMENT '市场区域（MY/US/UK/PH等）',
  currency VARCHAR(10) DEFAULT 'MYR' COMMENT '货币单位',
  status ENUM('active', 'expired', 'revoked', 'error') DEFAULT 'active',
  last_sync_at TIMESTAMP NULL COMMENT '最后一次同步时间',
  last_error_message TEXT COMMENT '最后一次错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_advertiser (advertiser_id),
  INDEX idx_user_advertiser (user_id, advertiser_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='TikTok广告账户授权表';

-- 3. 规则配置表（核心表！）
CREATE TABLE rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '所属用户ID',
  name VARCHAR(128) NOT NULL COMMENT '规则名称（人类可读）',
  description TEXT COMMENT '规则详细描述',
  
  -- 目标层级
  layer ENUM('SERIES', 'CREATIVE', 'PRODUCT') NOT NULL COMMENT '管理的层级',
  
  -- 调度配置
  schedule_type ENUM('CONTINUOUS', 'ONCE', 'TIME_POINT', 'TIME_RANGE', 'INTERVAL') NOT NULL,
  cron_expression VARCHAR(64) DEFAULT NULL COMMENT 'Cron表达式（TIME_POINT类型使用）',
  start_hour TINYINT UNSIGNED DEFAULT NULL COMMENT '时段开始小时（TIME_RANGE）',
  start_minute TINYINT UNSIGNED DEFAULT 0 COMMENT '时段开始分钟',
  end_hour TINYINT UNSIGNED DEFAULT NULL COMMENT '时段结束小时（TIME_RANGE）',
  end_minute TINYINT UNSIGNED DEFAULT 59 COMMENT '时段结束分钟',
  interval_minutes SMALLINT UNSIGNED DEFAULT NULL COMMENT '间隔分钟数（INTERVAL类型）',
  
  -- 条件（IF部分）- JSON格式存储AST语法树
  condition_json JSON NOT NULL COMMENT '条件AST树',
  
  -- 动作（THEN部分）- JSON格式
  action_json JSON NOT NULL COMMENT '动作定义',
  
  -- 状态控制
  enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用（1=启用 0=禁用）',
  priority INT NOT NULL DEFAULT 0 COMMENT '执行优先级（数字越小越先执行）',
  
  -- 智能生成标记
  is_smart_generated TINYINT(1) DEFAULT 0 COMMENT '是否由智能生成器创建',
  smart_params_json JSON DEFAULT NULL COMMENT '智能生成时的8个输入参数',
  
  -- 绑定目标
  bind_target_type ENUM('ALL', 'CAMPAIGN_LIST', 'ADGROUP_LIST', 'AD_LIST') DEFAULT 'ALL' COMMENT '绑定范围',
  bind_target_ids JSON DEFAULT NULL COMMENT '绑定的具体目标ID列表',
  
  -- 统计
  total_executions INT DEFAULT 0 COMMENT '总执行次数',
  total_matches INT DEFAULT 0 COMMENT '总匹配成功次数',
  total_actions_taken INT DEFAULT 0 COMMENT '总执行动作次数',
  last_executed_at TIMESTAMP NULL COMMENT '最后执行时间',
  last_matched_at TIMESTAMP NULL COMMENT '最后匹配时间',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_enabled (user_id, enabled),
  INDEX idx_schedule_type (schedule_type),
  INDEX idx_layer_priority (layer, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='自动化规则配置表';

-- 4. 规则组表（用于批量管理多条规则）
CREATE TABLE rule_groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(128) NOT NULL COMMENT '规则组名称',
  description TEXT DEFAULT '' COMMENT '规则组用途说明',
  is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认规则组',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='规则组表';

-- 5. 规则组-规则关联表（多对多）
CREATE TABLE group_rule_bindings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  rule_id INT NOT NULL,
  bound_target_type ENUM('CAMPAIGN_ID', 'ADGROUP_ID', 'AD_ID', 'ALL') DEFAULT 'ALL',
  bound_target_ids JSON DEFAULT NULL COMMENT '绑定的目标ID数组',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES rule_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
  UNIQUE KEY uk_group_rule (group_id, rule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='规则组成员关系表';

-- 6. 广告数据缓存表（关键性能优化表！）
CREATE TABLE ad_metrics_cache (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  advertiser_id VARCHAR(64) NOT NULL COMMENT '广告账户ID',
  target_id VARCHAR(64) NOT NULL COMMENT '目标对象ID',
  target_type ENUM('ACCOUNT', 'CAMPAIGN', 'ADGROUP', 'AD', 'PRODUCT') NOT NULL,
  
  -- 时间维度
  metric_date DATE NOT NULL COMMENT '数据日期',
  hour_of_day TINYINT UNSIGNED DEFAULT NULL COMMENT '小时（可选，用于更细粒度）',
  
  -- 原始指标
  spend DECIMAL(12,2) DEFAULT 0 COMMENT '花费',
  impressions BIGINT DEFAULT 0 COMMENT '展示量',
  clicks BIGINT DEFAULT 0 COMMENT '点击量',
  conversions INT DEFAULT 0 COMMENT '转化数',
  revenue DECIMAL(12,2) DEFAULT 0 COMMENT '营收',
  orders INT DEFAULT 0 COMMENT '订单数',
  
  -- 派生指标（冗余存储，避免每次实时计算）
  cpa DECIMAL(10,2) DEFAULT NULL COMMENT '转化成本',
  roi DECIMAL(10,4) DEFAULT NULL COMMENT '投产比',
  roas DECIMAL(10,4) DEFAULT NULL COMMENT '广告回报率',
  ctr DECIMAL(6,4) DEFAULT NULL COMMENT '点击率(%)',
  cpc DECIMAL(10,2) DEFAULT NULL COMMENT '点击成本',
  cpm DECIMAL(10,2) DEFAULT NULL COMMENT '千次展现成本',
  cvr_click DECIMAL(6,4) DEFAULT NULL COMMENT '点击转化率(%)',
  aov DECIMAL(10,2) DEFAULT NULL COMMENT '客单价',
  
  -- GMV Max特有指标
  play_rate DECIMAL(6,4) DEFAULT NULL COMMENT '播放率',
  completion_rate DECIMAL(6,4) DEFAULT NULL COMMENT '完播率',
  engagement_rate DECIMAL(6,4) DEFAULT NULL COMMENT '互动率',
  cart_add_rate DECIMAL(6,4) DEFAULT NULL COMMENT '加购率',
  
  -- 元数据
  data_source ENUM('API_SYNC', 'CALCULATED', 'MANUAL') DEFAULT 'API_SYNC',
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '缓存时间',
  expires_at TIMESTAMP NULL COMMENT '过期时间',
  
  -- 索引
  UNIQUE KEY uk_metric_unique (advertiser_id, target_id, target_type, metric_date),
  INDEX idx_advertiser_date (advertiser_id, metric_date),
  INDEX idx_target_type (target_type, target_id),
  INDEX idx_cached_expires (cached_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='广告指标数据缓存表';

-- 7. 规则执行日志表（审计追踪 + 调试用）
CREATE TABLE rule_execution_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_id INT NOT NULL,
  
  -- 执行时间
  executed_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT '精确到毫秒',
  
  -- 目标信息
  advertiser_id VARCHAR(64) DEFAULT '',
  target_id VARCHAR(64) DEFAULT '' COMMENT '被评估的目标对象ID',
  target_type ENUM('CAMPAIGN', 'ADGROUP', 'AD', 'PRODUCT') DEFAULT 'CAMPAIGN',
  
  -- 条件评估结果
  condition_result TINYINT(1) DEFAULT NULL COMMENT '条件是否匹配（null=未评估）',
  condition_snapshot JSON DEFAULT NULL COMMENT '条件评估时的数据快照',
  
  -- 动作执行详情
  action_type VARCHAR(32) DEFAULT NULL COMMENT '执行的动作类型',
  action_payload JSON DEFAULT NULL COMMENT '动作的完整参数',
  
  -- 执行状态
  execution_status ENUM('SUCCESS', 'FAILED', 'SKIPPED', 'PARTIAL') DEFAULT 'SKIPPED',
  error_message TEXT DEFAULT NULL COMMENT '错误信息（如果有）',
  error_code VARCHAR(64) DEFAULT NULL COMMENT '错误代码',
  
  -- API响应
  api_request_id VARCHAR(128) DEFAULT '' COMMENT 'TikTok API请求ID',
  api_response JSON DEFAULT NULL COMMENT 'API原始响应',
  api_response_code INT DEFAULT NULL COMMENT 'HTTP状态码',
  
  -- 性能指标
  execution_duration_ms INT DEFAULT NULL COMMENT '执行耗时（毫秒）',
  api_call_duration_ms INT DEFAULT NULL COMMENT 'API调用耗时',
  
  -- 影响统计
  budget_before DECIMAL(12,2) DEFAULT NULL COMMENT '操作前预算',
  budget_after DECIMAL(12,2) DEFAULT NULL COMMENT '操作后预算',
  status_before VARCHAR(32) DEFAULT NULL COMMENT '操作前状态',
  status_after VARCHAR(32) DEFAULT NULL COMMENT '操作后状态',
  
  -- 外键
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
  
  -- 索引
  INDEX idx_rule_executed (rule_id, executed_at),
  INDEX idx_advertiser_executed (advertiser_id, executed_at),
  INDEX idx_status_execution (execution_status, executed_at),
  INDEX idx_date_range (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='规则执行日志审计表';

-- 8. 通知消息表
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  rule_id INT DEFAULT NULL COMMENT '触发通知的规则ID（可为空，如系统通知）',
  
  type ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS') DEFAULT 'INFO',
  title VARCHAR(256) NOT NULL,
  message TEXT NOT NULL,
  
  -- 关联数据
  metadata JSON DEFAULT NULL COMMENT '附加的结构化数据',
  
  -- 状态
  is_read TINYINT(1) DEFAULT 0,
  read_at TIMESTAMP NULL,
  
  -- 渠道
  channels JSON DEFAULT NULL COMMENT '发送渠道列表 ["in_app", "email", "discord"]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='通知消息表';

-- 9. 系统配置表（存储用户的8个智能参数等）
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  
  -- 智能规则生成的8个参数
  setting_key VARCHAR(64) NOT NULL,
  setting_value JSON NOT NULL,
  
  -- 版本控制
  version INT DEFAULT 1,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户设置表';
```

---

## 🔟 十、前端界面组件结构（推测还原）

### 10.1 页面路由结构

```
/src
├── pages/
│   ├── Dashboard.vue              # 总览仪表盘（4卡片+图表）
│   ├── Rules/
│   │   ├── RuleList.vue           # 规则列表页（主页面）
│   │   ├── RuleEditor.vue         # 规则编辑器（IF-THEN可视化配置）
│   │   └── SmartGenerator.vue     # 智能规则生成器（8个输入框）
│   ├── Campaigns/
│   │   └── CampaignList.vue       # 广告系列列表+快速操作
│   ├── Creatives/
│   │   └── CreativeGrid.vue       # 素材网格视图（缩略图+数据）
│   ├── Products/
│   │   └── ProductTable.vue       # 商品/SKU表格
│   ├── Reports/
│   │   ├── DailyReport.vue        # 日报（花费/ROI/CPA趋势）
│   │   └── RuleLog.vue            # 规则执行日志查看器
│   ├── Accounts/
│   │   └── AccountManager.vue     # 多账户管理+授权
│   └── Settings/
│       ├── NotificationSettings.vue  # 通知配置
│       └── Profile.vue             # 个人中心
```

### 10.2 核心组件清单

```
/components
├── common/
│   ├── MetricCard.vue           # 指标卡片组件（可复用，显示标题/数值/趋势箭头）
│   ├── StatusBadge.vue          # 状态标签（启用/禁用/异常等）
│   ├── EmptyState.vue           # 空状态占位
│   └── LoadingSpinner.vue       # 加载动画
│
├── rules/
│   ├── ConditionBuilder.vue     # ⭐条件构建器（拖拽式IF编辑器）
│   │   ├── ConditionRow.vue     # 单行条件（字段+运算符+值）
│   │   ├── LogicConnector.vue   # AND/OR 连接器
│   │   └── FieldSelector.vue    # 字段下拉选择器（30+字段）
│   │
│   ├── ActionSelector.vue       # ⭐动作选择器（THEN部分）
│   │   ├── BudgetInput.vue      # 预算输入框
│   │   ├── TargetPicker.vue     # 目标对象选择器
│   │   └── MessageEditor.vue    # 通知文案编辑器
│   │
│   ├── SchedulePicker.vue       # ⭐调度配置器（5种模式切换）
│   │   ├── ContinuousOption.vue
│   │   ├── TimePointOption.vue  # Cron表达式编辑器
│   │   ├── TimeRangeOption.vue  # 时间段滑块
│   │   └── IntervalOption.vue
│   │
│   └── SmartGeneratorForm.vue  # ⭐智能生成器的8个输入表单
│       ├── ParamSlider.vue      # 带预设值的滑块输入
│       ├── ParamTooltip.vue     # 参数说明提示气泡
│       └── GeneratedPreview.vue # 生成的9条规则预览
│
├── dashboard/
│   ├── SpendChart.vue           # 花费趋势折线图
│   ├── RoiGauge.vue             # ROI仪表盘
│   ├── CpaHeatmap.vue           # CPA热力地图
│   └── TopCreativesTable.vue    # Top10素材排行榜
│
└── logs/
    ├── LogFilters.vue           # 日志筛选器（时间/规则/状态/目标）
    ├── LogTimeline.vue          # 时间线展示
    └── LogDetailDrawer.vue      # 详情侧边抽屉
```

### 10.3 智能规则生成器UI原型（文字版线框图）

```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 智能规则生成器                              [高级模式 →]   │
│                                                                 │
│  填入以下8个数值，系统将自动为您生成9条完整的自动化规则         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  基础参数                                                │  │
│  │                                                          │  │
│  │  转化成本上限     [████━━░░░░] ≤ 6 元                     │  │
│  │  ───────────────────────────────────── 低于此值认为健康   │  │
│  │                                                          │  │
│  │  素材花费上限     [████░░░░░░░] ≤ 2 元                     │  │
│  │  ───────────────────────────────────── 测试期止损线       │  │
│  │                                                          │  │
│  │  每日初始预算     [███████░░░░] 30 元                     │  │
│  │  ───────────────────────────────────── 每天早上重置值     │  │
│  │                                                          │  │
│  │  最低预算保底     [██████░░░░░] 20 元                     │  │
│  │  ───────────────────────────────────── 预算不能再低       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  进阶参数                                                │  │
│  │                                                          │  │
│  │  CPA过高阈值     [██████████░] ≥ 15 元  ⚠️ 紧急红线      │  │
│  │                                                          │  │
│  │  消耗率达到      [████████░░░] 80% 时                     │  │
│  │  自动增加预算    [██████░░░░░] + 50 元                    │  │
│  │  ───────────────────────────────────── 防爆款断流机制     │  │
│  │                                                          │  │
│  │  新素材加热预算   [█████░░░░░░] 15 元                     │  │
│  │  取消加热条件    [██░░░░░░░░░] 花费 ≥ 5 元               │  │
│  │  ───────────────────────────────────── 冷启动支持         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📋 即将生成的规则预览（共9条）：                          │  │
│  │                                                          │  │
│  │  ✅ R1: CPA硬控停投          优先级: 🔴 最高              │  │
│  │  ✅ R2: 素材测试止损          优先级: 🟠 高               │  │
│  │  ✅ R3: 日预算初始化          优先级: 🟡 中高             │  │
│  │  ✅ R4: 最低预算保底          优先级: 🟡 中               │  │
│  │  ✅ R5: CPA预警通知          优先级: 🟢 中               │  │
│  │  ✅ R6: 自动扩量防断流        优先级: 🟢 中低             │  │
│  │  ✅ R7: 新素材加热启动        优先级: 🔵 低               │  │
│  │  ✅ R8: 取消加热进入常态      优先级: 🔵 低               │  │
│  │  ✅ R9: 优质素材自动加回      优先级: ⚪ 最低             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│                    [🚀 生成并启用这9条规则]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 十一、安全与风控措施

### 11.1 Token安全管理

```
✅ Access Token 存储策略:
   - 仅存在服务端（从不暴露给前端）
   - 内存缓存 + 数据库加密备份
   - 提前5分钟自动刷新（避免临界失效）
   
✅ Refresh Token 存储策略:
   - AES-256加密后存入数据库
   - 即使数据库泄露也无法直接使用
   
✅ Token失效处理:
   - 自动重试机制（最多3次）
   - 失败时立即通知用户
   - 支持手动刷新按钮
```

### 11.2 操作安全机制

```
✅ 单次操作限额:
   - 单次预算增幅 ≤ ¥500（防误操作巨额损失）
   - 单次预算降幅不限（止损不需要限制）
   - 同时暂停系列数 ≤ 10个（防误触全停）
   
✅ 操作冷却时间:
   - 同一目标两次操作间隔 ≥ 5分钟（防频繁震荡）
   - 全局操作频率 ≤ 60次/小时（遵守API限制）
   
✅ 危险操作二次确认:
   - 暂停所有广告 → 弹窗确认 + 输入"CONFIRM"
   - 删除规则组 → 回收站保留7天（可恢复）
   
✅ 异常行为检测:
   - 短时间内大量异常操作（>20次失败）→ 冻结账户1小时
   - 非活跃时间段突然大批操作 → 要求短信验证码确认
   - 单规则单日执行动作 > 100次 → 发送告警并自动禁用该规则
```

### 11.3 数据安全

```
✅ API调用频率控制:
   - 遵守TikTok Business API Rate Limit
   - 全局令牌桶算法: 10 QPS / 100K QPD
   - 超限时排队等待（非丢弃请求）
   
✅ 敏感数据脱敏:
   - 日志中隐藏Access Token（只显示前8位+***）
   - 导出数据时脱敏手机号（138****1234）
   
✅ 数据备份策略:
   - 规则配置: 每日全量备份（保留30天）
   - 执行日志: 每周归档（保留90天）
   - 用户可一键导出自己的所有配置（JSON格式）
   
✅ 权限隔离:
   - 多租户数据严格分离（WHERE user_id = ?）
   - API请求强制携带advertiser_id校验
   - 角色权限: ADMIN（全权限）/ OPERATOR（只能查看和编辑规则）
```

---

## 📊 十二、运营数据与统计（从网站提取的当前数据）

| 指标 | 当前显示值 | 说明 |
|------|-----------|------|
| 平台总营收（近30天） | $0 | 可能是新上线站点或演示数据 |
| 平台总花费（近30天） | $0 | 同上 |
| 平台总订单（近30天） | 0 | 同上 |
| 管理系列数量（今天） | 0 | 同上 |

**注意**: 以上数据来自网页公开显示区域，可能不代表真实运营数据。

---

## 🎯 十三、如何在Bozone中实现并超越？（战略建议）

### 13.1 你已具备的核心优势对比

| 能力维度 | TK GMV Max | Bozone（你的项目）| 差距/优势 |
|---------|-----------|-----------------|----------|
| **广告数据管理** | ✅ 成熟 | ⚠️ 需开发 | 对齐即可 |
| **店铺订单/GMV** | ❌ 无 | ✅ **已有** | **你的优势** |
| **商品/SKU管理** | ❌ 有限 | ✅ **已有** | **你的优势** |
| **达人/带货数据** | ❌ 无 | ✅ **已有** | **你的优势** |
| **诊断规则引擎** | ❌ 简单版 | ✅ **完整体系** | **巨大优势** |
| **财务核算（真实利润）** | ❌ 只有广告ROI | ✅ **完整** | **巨大优势** |
| **AI工作室（素材库）** | ❌ 无 | ✅ **已有** | **潜在协同** |

### 13.2 建议实施路线图

#### Phase 0: MVP原型（第1周，预计工作量: 3-4天）

| Day | 任务 | 产出物 | 复用现有能力？|
|-----|------|-------|--------------|
| D1-D2 | 安装SDK + Token管理 + 连通性测试 | 能拉取真实广告数据 | 无 |
| D3-D4 | 实现8分钟轮询 + 数据入库（ad_metrics_cache表） | 数据库有完整广告数据 | 复用DB架构 |
| D5 | 前端广告概览页面（Dashboard新增4个卡片） | 能看到今日花费/ROI/CPA | 复用Dashboard风格 |
| D6-D7 | 实现3条核心规则（R1停投/R2移除/R6扩量）| 规则能真正执行 | 复用诊断规则接口 |

#### Phase 1: 完整规则引擎（第2周）

- ✅ 规则编辑器UI（IF-THEN可视化，拖拽式）
- ✅ 5种执行计划全部支持
- ✅ 30+条件字段可用
- ✅ 智能生成器（8→9规则模板）
- ✅ 操作日志查看器
- ✅ 通知系统（站内信+可选Discord/Webhook）

#### Phase 2: 差异化竞争优势（第3-4周，这是你能超越他们的关键！）

| 功能 | 描述 | 他们能做到吗？ |
|------|------|-------------|
| **广告归因到SKU真实利润** | 结合订单数据，计算每个SKU扣除所有成本后的真实净利润 | ❌ **做不到**（无店铺数据）|
| **诊断+广告联动诊断** | "标题不合格的商品即使CPA低也不建议投广告" | ❌ **做不到**（无诊断系统）|
| **达人视频效果分析** | "达人A的视频CTR高 → 自动加大该视频广告预算" | ❌ **做不到**（无达人数据）|
| **GMV Max商品目录同步** | 自动将店铺商品同步到TikTok广告后台 | ⚠️ 可能部分支持 |
| **一键优化建议报告** | 综合诊断+广告数据，输出可操作的优化方案 | ❌ **做不到**（维度单一）|

---

## 📎 附录

### A. TikTok Business API SDK npm包信息

```json
{
  "name": "tiktok-business-api-sdk-official",
  "version": "1.2.1",
  "description": "TikTok Business API JavaScript SDK",
  "repository": "github:tiktok/tiktok-business-api-sdk",
  "license": "MIT",
  "dependencies": {
    "superagent": "^8.x",
    "@apidevtools/json-schema": "^x.x"
  }
}
```

### B. 相关文档索引

| 文档路径 | 内容 |
|---------|------|
| `docs/SDK-API-Full-Catalog.md` | TikTok Shop SDK 104文件完整清单 |
| `docs/SDK-API-Roadmap.md` | 11个选中模块的开发路线图 |
| `docs/Diagnosis-Rules-Standards.md` | 店铺诊断规则体系（15章）|

### C. 术语表

| 术语 | 英文 | 解释 |
|------|------|------|
| GMV Max | Gross Merchandise Value Max | TikTok的智能购物广告产品，可管到商品级别 |
| CPA | Cost Per Action/Acquisition | 转化成本（每获得一个转化/订单的花费）|
| ROI | Return on Investment | 投产比（收入÷花费）|
| ROAS | Return on Ad Spend | 广告回报率（同ROI，电商行业常用）|
| CTR | Click-Through Rate | 点击率（点击÷展示×100%）|
| CPC | Cost Per Click | 点击成本（花费÷点击量）|
| CPM | Cost Per Mille | 千次展示成本（花费÷展示量×1000）|
| CVR | Conversion Rate | 转化率（转化数÷点击×100%）|
| AOV | Average Order Value | 平均订单金额（总营收÷订单数）|
| Campaign | 广告系列 | 广告的最高层级容器 |
| AdGroup | 广告组 | 系列下的分组（可设置出价/定向/预算）|
| Ad/Creative | 广告/创意 | 实际展示给用户的素材（视频/图片）|
| SKU | Stock Keeping Unit | 最小库存单位（具体商品款式）|
| ACO | Automated Creative Optimization | 自动化创意优化（TikTok的智能功能）|

---

> **文档版本**: v1.0
> **创建日期**: 2026-06-08
> **作者**: AI Assistant (基于网站公开信息的逆向工程分析)
> **适用场景**: Bozone ERP 广告模块开发参考 / 竞品分析 / 技术选型
> **免责声明**: 本文档基于公开网站内容的分析与合理推测，部分内部实现细节可能与实际有所出入，仅供参考学习使用。
