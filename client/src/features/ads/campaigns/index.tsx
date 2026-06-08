import { Plus, RefreshCw, Search, Filter } from 'lucide-react'

/** 广告系列管理页面 (Campaign Level) */

export function AdsCampaignsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            广告系列
          </h2>
          <p className="text-sm text-slate-500 mt-1">Campaign 级别的广告管理与操作</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <RefreshCw className="h-4 w-4" />
            同步TikTok数据
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            创建系列
          </button>
        </div>
      </div>

      {/* 搜索筛选栏 */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <input placeholder="搜索系列名称..." className="flex-1 bg-transparent outline-none text-sm" />
        <Filter className="h-4 w-4 text-slate-400" />
        <select className="text-sm bg-transparent outline-none border-none">
          <option>全部状态</option>
          <option>投放中</option>
          <option>已暂停</option>
          <option>草稿</option>
          <option>已完成</option>
        </select>
      </div>

      {/* 数据表格骨架 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-600">系列名称</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">预算</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">已花费</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">ROI</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">转化数</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((i) => (
              <tr key={i} className="border-b border-slate-50 animate-pulse">
                <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                <td className="px-4 py-3"><div className="h-5 w-14 bg-slate-200 rounded-full" /></td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-12 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-12 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-10 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-8 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-3 text-center"><div className="h-5 w-5 bg-slate-200 rounded-full mx-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
          共 N 个系列 &nbsp; 投放中: X &nbsp; 暂停: Y &nbsp; 总花费: ¥Z
        </div>
      </div>
    </div>
  )
}
