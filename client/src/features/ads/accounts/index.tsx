import { KeyRound, Plus, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react'

/**
 * 广告账户中心页面
 * 
 * 功能规划:
 * - TikTok Ads API 账户授权管理
 * - Access Token / Refresh Token 状态显示
 * - 手动刷新 Token
 * - 多账户切换（主账户标记）
 * - OAuth 授权向导引导
 * - API 调用配额使用情况
 * - 最后同步时间记录
 */

export function AdsAccountsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            账户中心
          </h2>
          <p className="text-sm text-slate-500 mt-1">TikTok Business API 授权管理 &amp; 多账户切换</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          授权新账户
        </button>
      </div>

      {/* 账户列表 */}
      <div className="space-y-4">
        {/* 主账户卡片 */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-28 bg-slate-200 rounded" />
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">当前使用中</span>
                </div>
                <div className="h-3.5 w-48 bg-slate-100 rounded mt-1.5" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-8 w-18 bg-slate-100 rounded-lg" />
              <div className="h-8 w-18 bg-slate-100 rounded-lg" />
              <div className="h-8 w-14 bg-slate-100 rounded-lg" />
              <div className="h-8 w-14 bg-slate-100 rounded-lg" />
            </div>
          </div>
          
          {/* 账户详情网格 */}
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
            {[
              'Advertiser ID',
              '市场 / 货币',
              'Token状态',
              '最后同步',
            ].map((label, i) => (
              <div key={i}>
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <div className={`h-4 ${i === 2 ? 'w-36' : i === 3 ? 'w-24' : 'w-28'} bg-slate-200 rounded`} />
              </div>
            ))}
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
            {[
              { label: '管理系列数', val: '4' },
              { label: '管理素材数', val: '12' },
              { label: '今日API调用', val: '156' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400">{stat.label}</div>
                <div className="text-lg font-semibold mt-0.5">{stat.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 第二个账户 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-28 bg-slate-200 rounded" />
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">即将过期</span>
                </div>
                <div className="h-3.5 w-44 bg-slate-100 rounded mt-1.5" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-8 w-18 bg-amber-100 rounded-lg" />
              <div className="h-8 w-18 bg-slate-100 rounded-lg" />
              <div className="h-8 w-14 bg-slate-100 rounded-lg" />
              <div className="h-8 w-14 bg-red-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* 授权指南 */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-medium">{i}</div>
              <div className="h-4 w-72 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="h-9 w-36 bg-blue-100 rounded-lg inline-flex items-center justify-center gap-1.5 text-sm text-blue-700 font-medium">
            <ExternalLink className="h-4 w-4" /> 打开授权向导
          </div>
        </div>
      </div>

      {/* API 配额使用情况 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[
            { label: '今日调用次数', used: 156, limit: 10000, pct: 1.6 },
            { label: 'Rate Limit 剩余', used: 85, limit: 100, pct: 15 },
            { label: 'Token刷新次数', used: 2, limit: 50, pct: 4 },
          ].map((quota, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600">{quota.label}</span>
                <span className="text-slate-400">{quota.used} / {quota.limit}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${quota.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
