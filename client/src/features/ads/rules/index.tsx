import { Bot, Plus, Brain, Pencil } from 'lucide-react'

/**
 * 规则引擎管理页面 — ⭐ 核心差异化功能
 * 
 * 对标 TK GMV Max 的全部自动化能力，并增强：
 * - IF-THEN 可视化规则编辑器
 * - 智能生成器（填8个数→生成9条规则）
 * - 规则执行日志查看
 * - 规则组批量管理
 * - 5种执行计划模式
 * - 30+条件字段
 * 
 * 核心价值: 让用户实现 7×24小时无人值守的自动化广告管理
 */

export function AdsRulesPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            🤖 规则引擎
          </h2>
          <p className="text-sm text-slate-500 mt-1">IF-THEN 自动化规则 · 实现7×24小时无人值守广告管理</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
            <Brain className="h-4 w-4" />
            智能生成(填8个数)
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            新建规则
          </button>
        </div>
      </div>

      {/* 规则总览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '启用规则', value: '9', icon: Bot },
          { label: '今日执行', value: '234', sub: '次' },
          { label: '成功动作', value: '18', sub: '次' },
          { label: '异常拦截', value: '0', sub: '次' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-16 bg-slate-200 rounded" />
              <card.icon className="h-4 w-4 text-slate-300" />
            </div>
            <div className="h-7 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* 规则分类统计 */}
      <div className="flex gap-3 text-sm">
        {[
          { label: '保护型', count: 3, color: 'bg-red-100 text-red-700' },
          { label: '扩量型', count: 2, color: 'bg-green-100 text-green-700' },
          { label: '清理型', count: 2, color: 'bg-amber-100 text-amber-700' },
          { label: '通知型', count: 2, color: 'bg-blue-100 text-blue-700' },
        ].map((tag, i) => (
          <span key={i} className={`${tag.color} px-3 py-1 rounded-full`}>
            {tag.label}: {tag.count}个
          </span>
        ))}
      </div>

      {/* 启用的规则列表 */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-700 px-1">启用的规则</h3>
        
        {/* R1: CPA硬控停投 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-red-400" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded text-xs" />
                <div className="h-4 w-16 bg-slate-100 rounded text-xs" />
              </div>
              <div className="h-3 w-72 bg-slate-100 rounded text-xs" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>

        {/* R2: 移除无效素材 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-orange-400" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded text-xs" />
                <div className="h-4 w-16 bg-slate-100 rounded text-xs" />
              </div>
              <div className="h-3 w-64 bg-slate-100 rounded text-xs" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>

        {/* R6: 自动扩量 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-green-400" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded text-xs" />
                <div className="h-4 w-16 bg-slate-100 rounded text-xs" />
              </div>
              <div className="h-3 w-60 bg-slate-100 rounded text-xs" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
              <div className="h-7 w-14 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 规则组区域 */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700 px-1 mb-2">规则组</h3>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-slate-300" />
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded text-xs" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-7 w-16 bg-slate-200 rounded-lg" />
              <div className="h-7 w-14 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
