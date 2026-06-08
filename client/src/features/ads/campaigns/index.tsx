/**
 * 广告系列管理页面
 * 
 * 支持从 TikTok API 拉取真实数据，或使用本地数据库 fallback
 */
import { useState, useEffect } from 'react'
import { Layers, Plus, RefreshCw, Search, Eye, Pause, Play, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'

interface Campaign {
  id?: number | string
  campaign_id?: string
  campaign_name?: string
  name?: string
  objective?: string
  budget_mode?: string
  budget?: number
  spent?: number
  impressions?: number
  clicks?: number
  status?: string
  operation_status?: string
  roas?: number
}

export function AdsCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [source, setSource] = useState('')

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns(params?: Record<string, string>) {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ ...params, q: search, status: statusFilter }).toString()
      const res = await api.get(`/api/ads/campaigns?${qs}`)
      if (res.data.success) {
        setCampaigns(res.data.data || [])
        setSource(res.data.source || '')
      }
    } catch {}
    setLoading(false)
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: '投放中', color: 'bg-emerald-100 text-emerald-700', icon: Play },
    paused: { label: '已暂停', color: 'bg-amber-100 text-amber-700', icon: Pause },
    draft: { label: '草稿', color: 'bg-slate-100 text-slate-600', icon: () => null },
  }

  const filtered = campaigns.filter(c => {
    const name = (c.campaign_name || c.name || '').toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (statusFilter && (c.operation_status || c.status) !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-500" /> 广告系列
          {source === 'tiktok_api' && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-normal">API实时</span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索系列..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-300 outline-none w-48" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
            <option value="">全部状态</option>
            <option value="active">投放中</option>
            <option value="paused">已暂停</option>
            <option value="draft">草稿</option>
          </select>
          <button onClick={() => loadCampaigns()} disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="刷新">
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['系列名称', '状态', '预算', '花费', 'ROI', '展示', '点击', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  <td colSpan={8} className="px-4 py-6"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
                </tr>
              ))
            ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">暂无广告系列</td></tr>
            ) : filtered.map((c, i) => {
              const st = statusConfig[c.operation_status || c.status || ''] || statusConfig.draft
              const StIcon = st.icon
              const roi = c.roas ?? (c.spent && c.spent > 0 ? (c.spent / Math.max(0, c.budget || 1)) : undefined)

              return (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{c.campaign_name || c.name || '-'}</span>
                    <span className="text-[11px] text-slate-400 ml-2 font-mono">{c.campaign_id || `#${c.id}`}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                      {StIcon && <StIcon className="h-3 w-3" />} {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">¥{(c.budget || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono">¥{(c.spent || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono ${Number(roi || 0) >= 2 ? 'text-emerald-600 font-bold' : Number(roi || 0) > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {(roi || 0).toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{(c.impressions || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{(c.clicks || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-slate-100 rounded" title="查看"><Eye className="h-4 w-4 text-slate-400" /></button>
                      <button className="p-1.5 hover:bg-slate-100 rounded" title="编辑"><Pencil className="h-4 w-4 text-slate-400" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      {!loading && campaigns.length > 0 && (
        <div className="text-sm text-slate-500 flex justify-between px-1">
          <span>共 {filtered.length}/{campaigns.length} 个系列</span>
          <span>总花费: ¥{campaigns.reduce((s, c) => s + (c.spent || 0), 0).toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}
