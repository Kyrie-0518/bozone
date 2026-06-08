import { Package, Plus, RefreshCw, Search } from 'lucide-react'

/**
 * 商品推广页面 (Product/SKU Level) — GMV Max 特有功能
 * 
 * ⭐ 这是 TK GMV Max 做不到的能力！因为他们没有店铺商品数据。
 * 
 * 功能规划:
 * - SKU级别的GMV Max广告管理
 * - 商品诊断评分联动（标题/图片/价格/库存综合打分）
 * - "建议投放"/"不建议投放"的智能推荐
 * - 单品ROI追踪和花费控制
 * - 一键创建GMV Max广告
 * - 从店铺商品库同步到广告后台
 */

export function AdsProductsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            商品推广
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            GMV Max SKU级广告管理 · 结合诊断系统的智能推荐
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Bozone独有</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <RefreshCw className="h-4 w-4" />
            同步店铺商品
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors">
            <Plus className="h-4 w-4" />
            设置自动同步
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <input placeholder="搜索商品名称或SKU..." className="flex-1 bg-transparent outline-none text-sm" />
        <select className="text-sm bg-transparent outline-none border-none">
          <option>全部状态</option>
          <option>在投</option>
          <option>未投</option>
          <option>高利润</option>
          <option>低ROAS</option>
        </select>
      </div>

      {/* 智能推荐卡片（差异化亮点） */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-5 animate-pulse">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-purple-600 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-56 bg-purple-200 rounded" />
            <div className="h-4 w-full bg-purple-100 rounded" />
            <div className="h-9 w-36 bg-white/60 border border-purple-200 rounded-lg mt-2" />
          </div>
        </div>
      </div>

      {/* 数据表格骨架 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-600">商品信息</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">诊断评分</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">广告状态</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">花费</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">订单</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">ROAS</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((i) => (
              <tr key={i} className="border-b border-slate-50 animate-pulse">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-slate-200 rounded-lg shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="h-6 w-10 bg-green-200 rounded mx-auto" />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="h-5 w-14 bg-slate-200 rounded-full mx-auto" />
                </td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-12 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-8 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-10 bg-slate-200 rounded inline-block" /></td>
                <td className="px-4 py-3 text-center"><div className="h-6 w-6 bg-slate-200 rounded-full mx-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
