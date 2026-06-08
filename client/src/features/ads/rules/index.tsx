/**
 * 规则引擎管理页面
 * 
 * 核心差异化功能 — IF-THEN 自动化规则管理
 * 当前版本：展示界面 + 规则模板说明
 * 下一步：对接后端规则执行引擎
 */
import { useState } from 'react'
import { Bot, Plus, Brain, Play, Pause, Settings2, FileText, Clock, Shield, Zap, Target } from 'lucide-react'

interface Rule {
  id: string
  name: string
  layer: 'SERIES' | 'CREATIVE' | 'PRODUCT' | string
  scheduleType: string
  priority: number
  enabled: boolean
  condition: string
  action: string
  todayExecutions?: number
  todaySuccesses?: number
}

const presetRules: Rule[] = [
  { id: 'R1', name: 'CPA硬控停投', layer: 'CREATIVE', scheduleType: 'CONTINUOUS', priority: 1, enabled: true,
    condition: '今日CPA ≥ 15元', action: '暂停该创意', todayExecutions: 3, todaySuccesses: 3 },
  { id: 'R2', name: '移除无效素材', layer: 'CREATIVE', scheduleType: 'CONTINUOUS', priority: 2, enabled: true,
    condition: '花费 ≥ 2元 AND 订单 = 0', action: '从系列移除', todayExecutions: 12, todaySuccesses: 8 },
  { id: 'R6', name: '爆款自动扩量', layer: 'SERIES', scheduleType: 'CONTINUOUS', priority: 6, enabled: true,
    condition: '消耗率 ≥ 80% AND ROI ≥ 2.0', action: '预算 +50元', todayExecutions: 5, todaySuccesses: 5 },
  { id: 'R9', name: '优质素材加回', layer: 'CREATIVE', scheduleType: 'CONTINUOUS', priority: 9, enabled: true,
    condition: '近7天有单 且 CPA < 6元', action: '重新加入投放', todayExecutions: 0, todaySuccesses: 0 },
]

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  SERIES: { label: '保护型', color: 'bg-red-100 text-red-700', icon: Shield },
  CREATIVE: { label: '清理型', color: 'bg-blue-100 text-blue-700', icon: Target },
  PRODUCT: { label: '优化型', color: 'bg-emerald-100 text-emerald-700', icon: Zap },
}

export function AdsRulesPage() {
  const [rules] = useState(presetRules)
  const [showGenerator, setShowGenerator] = useState(false)

  const enabledCount = rules.filter(r => r.enabled).length
  const totalExecs = rules.reduce((s, r) => s + (r.todayExecutions || 0), 0)
  const totalSuccess = rules.reduce((s, r) => s + (r.todaySuccesses || 0), 0)

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-500" /> 规则引擎
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-normal ml-2">核心功能</span>
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGenerator(!showGenerator)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showGenerator ? 'bg-slate-800 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            <Brain className="h-4 w-4" /> 🧠 智能生成(填8个数)
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="h-4 w-4" /> 新建规则
          </button>
        </div>
      </div>

      {/* 智能生成器 */}
      {showGenerator && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-indigo-200">
          <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-500" /> 智能规则生成器
          </h3>
          <p className="text-sm text-indigo-700 mb-4">填入8个数值，自动生成9条完整规则</p>

          <div className="grid grid-cols-4 gap-4 mb-4">
            {[{ k: 'max_cpa', l: '转化成本上限', p: '≤6 元' },
              { k: 'max_creative_spend', l: '素材花费上限', p: '≤2 元' },
              { k: 'daily_budget', l: '每日初始预算', p: '30 元' },
              { k: 'min_budget', l: '最低预算保底', p: '20 元' },
              { k: 'high_cpa', l: 'CPA过高阈值 ⚠️', p: '≥15元' },
              { k: 'consume_rate', l: '消耗率达', p: '80%' },
              { k: 'warmup_budget', l: '新素材加热预算', p: '15元' },
              { k: 'warmup_cancel', l: '取消加热条件', p: '≥5元' },
            ].map(({ k, l, p }) => (
              <div key={k} className="bg-white/60 rounded-lg p-3">
                <label className="block text-xs font-medium text-indigo-700 mb-1">{l}</label>
                <input type="number" placeholder={p}
                  className="w-full rounded border-indigo-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 ring-indigo-200/30" />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-indigo-200/50">
            <span className="text-xs text-indigo-500">即将生成 9 条规则</span>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              onClick={() => { alert('规则引擎将在下一阶段实现，当前为演示模式') }}
            >
              <Brain className="h-4 w-4 inline mr-1" /> 生成并启用全部规则
            </button>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '启用规则', value: String(enabledCount), sub: `共${rules.length}条`, icon: Bot, color: 'text-indigo-500 bg-indigo-50' },
          { label: '今日执行', value: String(totalExecs), sub: '次自动检查', icon: Clock, color: 'text-blue-500 bg-blue-50' },
          { label: '成功动作', value: String(totalSuccess), sub: `成功率 ${totalExecs > 0 ? ((totalSuccess / totalExecs) * 100).toFixed(0) : 0}%`, icon: Play, color: 'text-emerald-500 bg-emerald-50' },
          { label: '异常拦截', value: String(totalExecs - totalSuccess), sub: '需要关注', icon: Pause, color: 'text-amber-500 bg-amber-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{card.label}</span>
              {(() => { const Ic = card.icon; return <Ic className={`h-4 w-4 ${card.color.split(' ')[1]}`} /> })()}
            </div>
            <div className="text-2xl font-bold text-slate-800">{card.value}</div>
            <div className="text-xs text-slate-400">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* 规则列表 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 px-1">启用的规则</h3>
        {rules.map(rule => {
          const tc = typeConfig[rule.layer as keyof typeof typeConfig] || typeConfig.CREATIVE
          const TcIcon = tc.icon

          return (
            <div key={rule.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tc.color}`}>
                      <TcIcon className="h-3 w-3" /> {rule.name}
                    </span>
                    <span className="text-[11px] text-slate-400">[{rule.id}]</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 font-mono bg-slate-50 rounded px-3 py-2 inline-block">
                    IF {rule.condition} THEN {rule.action}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
                  <span>{tc.label}层</span>
                  <span>优先级: {rule.priority}</span>
                  <span>执行: {rule.todayExecutions}次 / 成功: {rule.todaySuccesses}次</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 说明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <FileText className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-amber-800">规则引擎将在下一阶段完整实现</p>
          <p className="text-amber-700 mt-0.5">
            当前展示预设规则模板。完整功能包括：可视化条件编辑器、5种调度模式（持续/一次/时间点/时段/间隔），
            30+条件字段、操作日志查看、规则组批量绑定。
          </p>
        </div>
      </div>
    </div>
  )
}
