import { Download, Calendar } from 'lucide-react'

/**
 * 数据报表页面
 * 
 * 功能规划:
 * - 日报/周报/自定义日期范围
 * - 花费 vs 收入趋势面积图
 * - ROAS 趋势折线图
 * - 系列表现排行榜柱状图
 * - 详细数据表格（可导出Excel）
 * - 多维度分析（按Campaign/AdGroup/Ad/Product）
 */

export function AdsReportsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            数据报表
          </h2>
          <p className="text-sm text-slate-500 mt-1">多维度广告数据分析与报表导出</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <Download className="h-4 w-4" />
          导出 Excel
        </button>
      </div>

      {/* 时间范围切换 + 维度选择 */}
      <div className="flex items-center gap-3">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {['日报', '周报', '自定义'].map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${i === 0 ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input type="date" defaultValue="2026-06-01" className="text-sm border border-slate-200 rounded-md px-2 py-1" />
          <span className="text-slate-400">~</span>
          <input type="date" defaultValue="2026-06-08" className="text-sm border border-slate-200 rounded-md px-2 py-1" />
        </div>
        <select className="text-sm border border-slate-200 rounded-md px-2 py-1 ml-2">
          <option>维度: 全部</option>
          <option>按系列</option>
          <option>按广告组</option>
          <option>按素材</option>
          <option>按商品</option>
        </select>
      </div>

      {/* 图表区域骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 面积图 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[340px] animate-pulse">
          <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
          <div className="h-[270px] bg-slate-100 rounded-lg" />
        </div>
        {/* 折线图 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[340px] animate-pulse">
          <div className="h-5 w-28 bg-slate-200 rounded mb-4" />
          <div className="h-[270px] bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* 排行榜样板 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-5 w-5 rounded-full bg-slate-200" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded mb-1.5" style={{ width: `${90 - i * 10}%` }} />
                <div className="h-3 bg-slate-100 rounded" style={{ width: `${60 - i * 5}%` }} />
              </div>
              <div className="h-5 w-14 bg-blue-100 rounded text-right" />
              <div className="h-5 w-12 bg-green-100 rounded text-right" />
            </div>
          ))}
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {['日期', '系列', '花费', '展示', '点击', 'CTR', 'CPA', 'ROI'].map((th) => (
                <th key={th} className="px-4 py-3 font-medium text-slate-600 text-{th === '系列' ? 'left' : 'right'}">{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <tr key={i} className="border-b border-slate-50 animate-pulse">
                <td className="px-4 py-2.5"><div className="h-3.5 w-18 bg-slate-200 rounded" /></td>
                <td className="px-4 py-2.5"><div className="h-3.5 w-24 bg-slate-200 rounded" /></td>
                <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-12 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-200 rounded inline-block" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
