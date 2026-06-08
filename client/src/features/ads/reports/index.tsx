/**
 * 数据报表页面 — 广告数据分析
 */
import { useState } from 'react'
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function AdsReportsPage() {
  const [activeTab, setActiveTab] = useState('daily')
  const startDate = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]
  })
  const endDate = useState(() => new Date().toISOString().split('T')[0])

  // Mock 数据用于演示布局（对接 API 后替换）
  const mockDailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return { date: d.toLocaleDateString('zh-CN'), spend: Math.floor(Math.random() * 300 + 50), revenue: Math.floor(Math.random() * 800 + 100), impressions: Math.floor(Math.random() * 50000 + 10000), clicks: Math.floor(Math.random() * 2000 + 200), conversions: Math.floor(Math.random() * 50 + 1) }
  })

  const totalSpend = mockDailyData.reduce((s, d) => s + d.spend, 0)
  const totalRevenue = mockDailyData.reduce((s, d) => s + d.revenue, 0)
  const totalConversions = mockDailyData.reduce((s, d) => s + d.conversions, 0)

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-teal-500" /> 数据报表
        </h2>
        <div className="flex items-center gap-3">
          {/* Tab切换 */}
          {['daily', 'weekly', 'custom'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>{{ daily: '日报', weekly: '周报', custom: '自定义' }[tab]}</button>
          ))}
          <input type="date" value={startDate} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none" />
          <span className="text-slate-400">~</span>
          <input type="date" value={endDate} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none" />
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm"><Download className="h-4 w-4" /> 导出Excel</button>
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总花费', value: `¥${totalSpend.toFixed(0)}`, change: '+12%', up: true },
          { label: '总收入', value: `¥${totalRevenue.toFixed(0)}`, change: '+18%', up: true },
          { label: '总转化', value: String(totalConversions), change: '+8%', up: true },
          { label: 'ROAS', value: `${(totalRevenue / Math.max(totalSpend, 1)).toFixed(2)}x`, change: '', up: totalRevenue > totalSpend * 2 },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">{m.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{m.value}</p>
            {m.change && (
              <p className={`text-xs mt-1 ${m.up ? 'text-emerald-600' : 'text-red-500'} flex items-center gap-1`}>
                {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {m.change} vs 上期
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 趋势图区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 花费趋势 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">📊 花费与收入趋势</h3>
          <div className="h-52 flex items-end gap-1.5">
            {mockDailyData.map((d, i) => {
              const maxVal = Math.max(...mockDailyData.map(x => Math.max(x.spend, x.revenue)))
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                  <div className="w-full relative h-36 flex flex-col-reverse gap-0.5" title={`${d.date}: ¥${d.spend} 花费 / ¥${d.revenue} 收入`}>
                    <div className="bg-blue-200/80 rounded-t transition-all group-hover:bg-blue-300 min-h-[2px]" style={{ height: `${(d.spend / maxVal) * 100}%` }} />
                    <div className="bg-emerald-200/80 rounded-b transition-all group-hover:bg-emerald-300 min-h-[2px]" style={{ height: `${(d.revenue / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{d.date.slice(5)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full" /> 花费</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full" /> 收入</span>
          </div>
        </div>

        {/* Top 系列 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">🔥 系列表现排行</h3>
          <div className="space-y-3">
            {[...mockDailyData].sort((a, b) => b.roi - a.roi).slice(0, 5).map((d, i) => {
              const roi = (d.revenue / Math.max(d.spend, 1)).toFixed(2)
              const widthPct = Math.min((d.spend / totalSpend) * 100, 100)
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-slate-400 truncate">{d.date}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-blue-500/70 rounded-full transition-all" style={{ width: `${widthPct}%` }} />
                  </div>
                  <span className="w-14 text-right font-mono text-slate-600">¥{d.spend}</span>
                  <span className={`w-12 text-right font-mono font-bold ${Number(roi) >= 2 ? 'text-emerald-600' : Number(roi) > 0 ? 'text-amber-600' : 'text-red-500'}`}>{roi}x</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['日期', '花费', '收入', '曝光量', '点击量', 'CTR', '转化数', 'CPA', 'ROAS'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockDailyData.reverse().map((d, i) => {
              const ctr = d.impressions ? (d.clicks / d.impressions * 100).toFixed(2) : '0'
              const cpa = d.conversion ? (d.spend / d.conversion).toFixed(2) : '-'
              const roas = d.spend ? (d.revenue / d.spend).toFixed(2) : '-'

              return (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{d.date}</td>
                  <td className="px-4 py-3 font-mono">¥{d.spend.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-emerald-600">¥{d.revenue.toFixed(2)}</td>
                  <td className="px-4 py-3">{d.impressions?.toLocaleString()}</td>
                  <td className="px-4 py-3">{d.clicks?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{ctr}%</td>
                  <td className="px-4 py-3">{d.conversions}</td>
                  <td className="px-4 py-3 font-mono">{cpa}</td>
                  <td className="px-4 py-3 font-mono font-bold">{roas}x</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
