import { ImagePlus, Plus, Upload, Search, Filter } from 'lucide-react'

/**
 * 创意素材管理页面 (Creative Level)
 * 
 * 功能规划:
 * - 素材网格视图（视频缩略图 + 效果数据）
 * - 上传新素材到 TikTok Ads
 * - 加热状态管理（冷启动加热 / 取消加热）
 * - 状态标签：投放中/暂停/加热中/已移除
 * - 效果指标：播放量/CTR/CPA/转化数/花费/ROAS
 * - 批量操作：启用/暂停/移除
 */

export function AdsCreativesPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            创意素材
          </h2>
          <p className="text-sm text-slate-500 mt-1">Ad / Creative 级别的素材管理与效果监控</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <ImagePlus className="h-4 w-4" />
            智能生成规则
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Upload className="h-4 w-4" />
            上传素材
          </button>
        </div>
      </div>

      {/* 搜索筛选栏 */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <input placeholder="搜索素材..." className="flex-1 bg-transparent outline-none text-sm" />
        <Filter className="h-4 w-4 text-slate-400" />
        <select className="text-sm bg-transparent outline-none border-none">
          <option>全部</option>
          <option>投放中</option>
          <option>已暂停</option>
          <option>🔥 加热中</option>
          <option>已移除</option>
        </select>
      </div>

      {/* 状态说明条 */}
      <div className="flex items-center gap-4 text-xs text-slate-500 bg-blue-50/50 rounded-lg px-4 py-2">
        <span className="font-medium">状态:</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"/>投放中 = 正常运行</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"/>加热中 = 新素材测试期</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1"/>已暂停</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"/>已移除 = 不达标被淘汰</span>
      </div>

      {/* 网格视图骨架 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
            {/* 缩略图 */}
            <div className="aspect-video bg-slate-200" />
            <div className="p-4 space-y-2.5">
              {/* 名称 */}
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              {/* 状态标签 */}
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
              {/* 指标行 */}
              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                <div><div className="h-3 w-12 bg-slate-100 rounded mb-1" /><div className="h-3 w-10 bg-slate-100 rounded"/></div>
                <div><div className="h-3 w-10 bg-slate-100 rounded mb-1" /><div className="h-3 w-8 bg-slate-100 rounded"/></div>
                <div><div className="h-3 w-10 bg-slate-100 rounded mb-1" /><div className="h-3 w-12 bg-slate-100 rounded"/></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
