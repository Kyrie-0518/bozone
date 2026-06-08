import { Megaphone, RefreshCw } from 'lucide-react'

/**
 * 广告概览页面 — 升级版
 * 
 * 功能规划:
 * - 5个核心指标卡片（总花费/曝光/点击/转化/ROAS）
 * - 花费vs收入趋势图
 * - ROAS趋势图
 * - Top5爆款系列排行
 * - CPA异常预警列表
 * - 规则引擎快速状态
 */
export function AdsDashboardPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            广告概览
          </h2>
          <p className="text-sm text-slate-500 mt-1">TikTok Ads 全局数据总览</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <RefreshCw className="h-4 w-4" />
            同步数据
          </button>
        </div>
      </div>

      {/* TODO: 指标卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
            <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-7 w-24 bg-slate-200 rounded mb-1" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* TODO: 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[320px] animate-pulse">
          <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
          <div className="h-[240px] bg-slate-100 rounded" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[320px] animate-pulse">
          <div className="h-5 w-28 bg-slate-200 rounded mb-4" />
          <div className="h-[240px] bg-slate-100 rounded" />
        </div>
      </div>

      {/* TODO: 排行榜 + 预警区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[280px] animate-pulse">
          <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[280px] animate-pulse">
          <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="h-8 w-8 bg-amber-200 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 bg-amber-200 rounded" />
                  <div className="h-3 w-20 bg-amber-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 规则引擎状态卡片 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <Megaphone className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-900">规则引擎快速状态</span>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {['启用规则: 9条', '今日执行: 234次', '成功动作: 18次', '异常: 0次'].map((label, i) => (
            <div key={i} className="bg-white/70 rounded-lg p-3 border border-blue-100">
              <div className="h-4 w-full bg-blue-200 rounded mb-1.5" />
              <div className="h-3 w-2/3 bg-blue-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
