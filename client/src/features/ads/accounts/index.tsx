/**
 * 广告账户中心 — 授权管理 + 多账户切换
 * 
 * 功能：
 * - 显示所有已授权的广告账户（Token状态、最后同步时间）
 * - 新增授权（填写 AppID/AppSecret/RefreshToken）
 * - 测试连通性
 * - 删除/解绑
 */
import { useState, useEffect } from 'react'
import { KeyRound, Plus, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

interface AdAccount {
  id: number
  advertiser_id: string
  display_name: string
  region: string
  currency: string
  status: string
  last_synced_at: string | null
  token_expires_at: string | null
  hasToken: boolean
  tokenStatus: string
}

export function AdsAccountsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<Record<string, any>>({})

  useEffect(() => { loadAccounts() }, [])

  async function loadAccounts() {
    setLoading(true)
    try {
      const res = await api.get('/api/ads/accounts')
      if (res.data.success) setAccounts(res.data.data)
    } catch {}
    setLoading(false)
  }

  /** 测试连接 */
  async function testConnection(id: number) {
    setTestingId(id)
    setTestResult({})
    try {
      const res = await api.post(`/api/ads/accounts/${id}/test`)
      setTestResult(res.data)
      if (res.data.success) loadAccounts() // 刷新状态
    } catch (e: any) {
      setTestResult({ success: false, error: e.message })
    }
    setTestingId(null)
  }

  /** 新增授权 */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const body: Record<string, string> = {}
    for (const [k, v] of formData.entries()) body[k] = v as string

    try {
      await api.post('/api/ads/accounts', body)
      setShowForm(false)
      loadAccounts()
      ;(e.target as HTMLFormElement).reset()
    } catch (e: any) {
      alert(e.response?.data?.error || '添加失败')
    }
  }

  /** 删除账户 */
  async function handleDelete(id: number) {
    if (!confirm('确定要解绑此广告账户吗？')) return
    await api.delete(`/api/ads/accounts/${id}`)
    loadAccounts()
  }

  const statusMap: Record<string, { icon: any; color: string; label: string }> = {
    active: { icon: CheckCircle2, color: 'text-emerald-500', label: '运行中' },
    expired: { icon: XCircle, color: 'text-red-500', label: '已过期' },
    error: { icon: XCircle, color: 'text-red-500', label: '异常' },
    revoked: { icon: XCircle, color: 'text-slate-400', label: '已撤销' },
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-violet-500" />
            广告账户中心
          </h2>
          <p className="text-sm text-slate-500 mt-1">管理 TikTok Business Platform 广告账户授权</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> 授权新账户
        </button>
      </div>

      {/* 授权表单 */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-800 mb-4">添加 TikTok 广告账户授权</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Advertiser ID *</label>
              <input name="advertiserId" required placeholder="如: ABC123DEF456"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-200 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">App ID *</label>
              <input name="appId" required placeholder="从 TikTok Business Platform 获取"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">App Secret *</label>
              <input name="appSecret" type="password" required placeholder="应用密钥"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Refresh Token *</label>
              <input name="refreshToken" required placeholder="OAuth 授权获取的刷新令牌"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">显示名称</label>
              <input name="displayName" placeholder="如 MY-Shop-001"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">市场区域</label>
              <select name="region" defaultValue="MY"
                className="w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
                <option value="MY">马来西亚 (MY)</option>
                <option value="US">美国 (US)</option>
                <option value="UK">英国 (UK)</option>
                <option value="VN">越南 (VN)</option>
                <option value="TH">泰国 (TH)</option>
                <option value="PH">菲律宾 (PH)</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm">取消</button>
              <button type="submit"
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">保存并授权</button>
            </div>
          </form>
          <p className="mt-3 text-xs text-slate-400">
            提示：在 TikTok Business Platform 
            (<a href="https://business-api.tiktok.com" target="_blank" rel="noopener" className="underline text-violet-500">
              business-api.tiktok.com <ExternalLink className="inline h-3 w-3" />
            </a>)
            创建应用后获取 App ID / Secret 和 Refresh Token。
          </p>
        </div>
      )}

      {/* 账户卡片列表 */}
      <div className="space-y-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 animate-pulse">
                <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
                <div className="h-3 w-64 bg-slate-100 rounded" />
              </div>
            ))
          ) : accounts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300">
            <KeyRound className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">暂无广告账户</p>
            <p className="text-sm text-slate-400 mt-1">点击上方"授权新账户"开始配置</p>
          </div>
        ) : accounts.map(acc => {
          const st = statusMap[acc.status] || statusMap.active
          const StatusIcon = st.icon
          const isTesting = testingId === acc.id

          return (
            <div key={acc.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${acc.status === 'active' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    <StatusIcon className={`h-5 w-5 ${st.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{acc.display_name || acc.advertiser_id}</h3>
                    <p className="text-sm text-slate-500 font-mono mt-0.5">Advertiser ID: {acc.advertiser_id}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{acc.region} · {acc.currency}</span>
                      <span>·</span>
                      <span>{acc.tokenStatus}</span>
                      {acc.last_synced_at && (
                        <>
                          <span>·</span>
                          <span>同步: {new Date(acc.last_synced_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右侧操作区 */}
                <div className="flex items-center gap-2">
                  <button onClick={() => testConnection(acc.id)} disabled={isTesting}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? '测试中...' : '测试连接'}
                  </button>
                  <button onClick={() => handleDelete(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 测试结果 */}
              {testResult[acc.id] && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  testResult[acc.id]?.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {testResult[acc.id]?.message || testResult[acc.id]?.error || JSON.stringify(testResult[acc.id])}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
