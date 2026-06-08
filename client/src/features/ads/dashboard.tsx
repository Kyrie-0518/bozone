/**
 * 广告概览页面 — 真实数据版本
 * 
 * 功能：
 * - 5个核心指标卡片（花费/展示/点击/转化/ROAS）
 * - 时间范围切换（今日/7日/30日）
 * - 花费趋势图 + ROAS趋势图
 * - 账户选择器（多账户支持）
 */
import { useState, useEffect } from 'react'
import { Megaphone, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'

interface SummaryData {
  spend?: number
  impressions?: number
  clicks?: number
  conversion?: number
  revenue?: number
  orders?: number
  ctr?: number
  cpc?: number
  cpa?: number
  roas?: number
}

interface DailyRow {
  stat_time_day?: string
  spend?: number
  impressions?: number
  clicks?: number
  conversion?: number
  revenue?: number
}

interface AdAccount {
  id: number
  advertiserId: string
  displayName: string
  status: string
}

function formatNum(n: number | undefined): string {
  if (!n) return '0'
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`
  return n.toFixed(n % 1 === 0 ? 0 : 1)
}

function formatCurrency(n: number | undefined): string {
  if (!n) return '¥0'
  if (n >= 10000) return `¥${(n / 1000).toFixed(1)}K`
  return `¥${n.toFixed(2)}`
}

const MetricCard = ({
  label, value, icon: Icon, trend, color,
}: {
  label: string; value: string; icon: any; trend?: 'up' | 'down' | 'flat'; color: string;
}) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
    <div className="flex items-center justify-between mb-3">
      <span className="text-slate-500 text-sm font-medium">{label}</span>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div className="text-2xl font-bold text-slate-800">{value}</div>
    {trend && (
      <div className={`mt-2 text-sm flex items-center gap-1 ${
        trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
      }`}>
        {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
        {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
        {trend === 'flat' && <Minus className="h-3.5 w-3.5" />}
        <span>{trend === 'up' ? '较昨日上升' : trend === 'down' ? '较昨日下降' : '持平'}</span>
      </div>
    )}
  </div>
)

export function AdsDashboardPage() {
  const [days, setDays] = useState(7)
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [summary, setSummary] = useState<SummaryData>({})
  const [dailyData, setDailyData] = useState<DailyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 加载账户列表 + 概览数据
  useEffect(() => {
    loadAll()
  }, [days, selectedAccountId])

  async function loadAll() {
    setLoading(true)
    try {
      // 并行加载账户列表和仪表盘数据
      const [accRes, dashRes] = await Promise.all([
        api.get('/api/ads/accounts'),
        api.get(`/api/ads/dashboard?days=${days}${selectedAccountId ? `&advertiserId=${selectedAccountId}` : ''}`)
      ])

      if (accRes.data.success) {
        const list = accRes.data.data.accounts || []
        setAccounts(list)
        // 自动选中第一个活跃账户
        if (!selectedAccountId && list.length > 0) {
          setSelectedAccountId(list[0].advertiserId)
          return // 会触发重新 useEffect
        }
      }

      if (dashRes.data.success) {
        setSummary(dashRes.data.data.summary || {})
        setDailyData(dashRes.data.data.dailyData || [])
        setError(dashRes.data.data.message || '')
      } else {
        setError(dashRes.data.error || '加载失败')
      }
    } catch (e: any) {
      setError(e.message || '网络错误')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-blue-500" />
            广告概览
          </h2>
          <p className="text-sm text-slate-500 mt-1">TikTok 广告投放效果总览</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 时间范围 */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {[1, 7, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  days === d ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {d === 1 ? '今日' : d === 7 ? '近7天' : '近30天'}
              </button>
            ))}
          </div>
          {/* 账户选择 */}
          {accounts.length > 0 && (
            <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
              className="rounded-lg border-slate-200 bg-white px-3 py-1.5 text-sm"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.advertiserId}>{a.displayName || a.advertiserId}</option>
              ))}
            </select>
          )}
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      {error && !summary.spend && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">{error}</p>
            <p className="text-sm text-amber-600 mt-1">
              请前往「🔑 账户中心」授权你的 TikTok 广告账号，授权后即可在此查看真实广告数据。
            </p>
          </div>
        </div>
      )}

      {/* 5指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="总花费" value={formatCurrency(summary.spend)} icon={Megaphone}
          color="text-red-500" trend={summary.spend ? 'up' : undefined} />
        <MetricCard label="曝光量" value={formatNum(summary.impressions)} icon={() => (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        )} color="text-blue-500" />
        <MetricCard label="点击量" value={formatNum(summary.clicks)} icon={() => (
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M22.707 2.293a1 1 0 00-1.414 0l-1.586 1.586a1 1 0 101.414 1.414l1.586-1.586a1 1 0 000-1.414zM10 13a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
        )} color="text-indigo-500" />
        <MetricCard label="转化数" value={formatNum(summary.conversion)} icon={() => (
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )} color="text-emerald-500" />
        <MetricCard label="ROAS" value={summary.roas ? `${summary.roas.toFixed(2)}x` : '-'} icon={TrendingUp}
          color={(summary.roas ?? 0) >= 2 ? 'text-emerald-500' : (summary.roas ?? 0) > 0 ? 'text-amber-500' : 'text-slate-400'}
          trend={(summary.roas ?? 0) >= 2 ? 'up' : (summary.roas ?? 0) > 0 ? 'flat' : undefined} />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 花费趋势 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">花费趋势</h3>
          <div className="h-48 flex items-end gap-1">
            {dailyData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">暂无数据</div>
            ) : dailyData.slice(-14).map((d, i) => {
              const maxSpend = Math.max(...dailyData.map(x => x.spend || 0), 1)
              const h = Math.max(((d.spend || 0) / maxSpend) * 100, 2)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-blue-100 rounded-t" style={{ height: `${h}%`, minHeight: 2 }} />
                  <span className="text-[10px] text-slate-400">{(d.stat_time_day || '').slice(5)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ROAS趋势 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">ROAS / CPA 趋势</h3>
          <div className="space-y-3">
            {dailyData.slice(-7).map((d, i) => {
              const roas = d.revenue && d.spend ? d.revenue / d.spend : 0
              const cpa = d.conversion ? (d.spend || 0) / d.conversion : 0
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 w-16">{d.stat_time_day?.slice(5)}</span>
                  <div className="flex-1 mx-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${roas >= 2 ? 'bg-emerald-400' : roas > 0 ? 'bg-amber-400' : 'bg-red-300'}`}
                        style={{ width: `${Math.min(roas * 25, 100)}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-mono">{roas.toFixed(1)}x</span>
                  </div>
                  <span className="w-14 text-right text-xs font-mono text-slate-400">¥{cpa.toFixed(1)}</span>
                </div>
              )
            })}
            {dailyData.length === 0 && <div className="text-center text-slate-400 text-sm py-8">暂无数据</div>}
          </div>
        </div>
      </div>

      {/* 底部统计 */}
      {(summary.clicks || 0) > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">关键效率指标</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'CTR (点击率)', value: summary.ctr ? `${summary.ctr.toFixed(2)}%` : '-', sub: `${formatNum(summary.clicks)} / ${formatNum(summary.impressions)}` },
              { label: 'CPC (点击成本)', value: formatCurrency(summary.cpc), sub: '每次点击成本' },
              { label: 'CPA (转化成本)', value: formatCurrency(summary.cpa), sub: '每个转化成本' },
              { label: '订单数', value: String(summary.orders || 0), sub: `收入 ${formatCurrency(summary.revenue)}` },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className="text-2xl font-bold text-slate-800">{m.value}</div>
                <div className="text-sm text-slate-500 mt-1">{m.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
