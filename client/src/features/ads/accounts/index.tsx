/**
 * 广告账户中心 — 一键 OAuth 授权 + 多账户管理
 *
 * 两种授权方式：
 *   1. 一键授权（推荐）：点击按钮跳转 TikTok Business Platform 授权页面
 *   2. 手动填写：填入 AppID/AppSecret/RefreshToken（备用方案）
 */
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from '@tanstack/react-router'
import {
  KeyRound, Plus, CheckCircle2, XCircle, Clock,
  ExternalLink, RefreshCw, Trash2, ArrowRight,
  AlertCircle, Loader2, ShieldCheck, Settings2,
} from 'lucide-react'
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
  const [searchParams] = useSearchParams()
  const navigate = { to: '/ads/accounts' as const }
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<Record<string, any>>({})

  // 从 URL 参数读取授权结果
  const authResult = searchParams.get('auth')
  const authMessage = searchParams.get('message')
  const authAccount = searchParams.get('account')

  // 清理 URL 参数（避免刷新重复提示）
  useEffect(() => {
    if (authResult) {
      window.history.replaceState({}, '', '/ads/accounts')
    }
  }, [])

  useEffect(() => { loadAccounts() }, [])

  async function loadAccounts() {
    setLoading(true)
    try {
      const res = await api.get('/api/ads/accounts')
      if (res.data.success) setAccounts(res.data.data)
    } catch {}
    setLoading(false)
  }

  /** 一键授权 — 跳转 TikTok Business Platform */
  async function handleOAuthAuthorize() {
    setAuthLoading(true)
    try {
      const res = await api.post('/api/ads/auth-url')
      if (res.data.success && res.data.authUrl) {
        window.location.href = res.data.authUrl
      } else {
        alert(res.data.error || '生成授权链接失败，请检查后端配置')
        console.error('[Ads Auth]', res.data.configStatus)
      }
    } catch (e: any) {
      alert(e.response?.data?.error || e.message || '生成授权链接失败')
    } finally {
      setAuthLoading(false)
    }
  }

  /** 测试连接 */
  async function testConnection(id: number) {
    setTestingId(id)
    setTestResult({})
    try {
      const res = await api.post(`/api/ads/accounts/${id}/test`)
      setTestResult({ [id]: res.data })
      if (res.data.success) loadAccounts()
    } catch (e: any) {
      setTestResult({ [id]: { success: false, error: e.message } })
    }
    setTestingId(null)
  }

  /** 手动新增授权 */
  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const body: Record<string, string> = {}
    for (const [k, v] of formData.entries()) body[k] = v as string

    try {
      await api.post('/api/ads/accounts', body)
      setShowManualForm(false)
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

  // ── Status Config ──
  const statusMap: Record<string, { icon: any; color: string; label: string; bg: string }> = {
    active:     { icon: CheckCircle2, color: 'text-emerald-600', label: '运行中', bg: 'bg-emerald-50' },
    expired:    { icon: XCircle,    color: 'text-red-500',    label: '已过期', bg: 'bg-red-50' },
    error:      { icon: XCircle,    color: 'text-red-500',    label: '异常',   bg: 'bg-red-50' },
    revoked:    { icon: XCircle,    color: 'text-slate-400',  label: '已撤销', bg: 'bg-slate-50' },
  }

  return (
    <div className="space-y-6">
      {/* ── 标题栏 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-violet-500" />
            广告账户中心
          </h2>
          <p className="text-sm text-slate-500 mt-1">管理 TikTok Business Platform 广告账户授权</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Settings2 className="h-4 w-4" /> 手动添加
          </button>
          <button
            onClick={handleOAuthAuthorize}
            disabled={authLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 text-sm font-medium transition-colors"
          >
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            一键授权
            {!authLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── 授权结果提示条 ── */}
      {authResult === 'success' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">授权成功！</p>
            <p className="text-xs text-emerald-600">{authAccount ? `广告主 ${authAccount}` : ''} 已成功绑定</p>
          </div>
          <button onClick={() => loadAccounts()}
            className="ml-auto text-xs text-emerald-700 underline hover:text-emerald-900">刷新列表</button>
        </div>
      )}
      {authResult === 'error' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">授权失败</p>
            <p className="text-xs text-red-600">{decodeURIComponent(authMessage || '未知错误')}</p>
          </div>
        </div>
      )}

      {/* ── 一键授权说明卡片 ── */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-white rounded-lg shadow-sm">
            <ShieldCheck className="h-6 w-6 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 mb-1">TikTok Ads OAuth 一键授权</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              点击「一键授权」按钮，跳转到 TikTok Business Platform 官方授权页面。
              登录并确认授权后，系统自动获取 Access Token 并绑定广告账户。
              无需手动复制粘贴 App ID / Secret / Refresh Token。
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                <a href="https://business-api.tiktok.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-violet-600">
                  business-api.tiktok.com
                </a>
              </span>
              <span>·</span>
              <span>支持范围：advertiser_info / campaign_management / reporting / dsp_management</span>
            </div>
          </div>
        </div>

        {/* 快速授权步骤 */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { step: 1, title: '点击一键授权', desc: '跳转 TikTok 官方登录页' },
            { step: 2, title: '登录并确认', desc: '选择要授权的广告账户' },
            { step: 3, title: '完成绑定', desc: '自动返回本页面，Token 自动保存' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-2.5 bg-white/70 rounded-lg p-3">
              <span className="flex-shrink-0 w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold">{s.step}</span>
              <div>
                <p className="text-sm font-medium text-slate-700">{s.title}</p>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 手动填写表单（折叠） ── */}
      {showManualForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-slate-400" />
            手动添加广告账户（备用方案）
          </h3>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Advertiser ID *</label>
              <input name="advertiserId" required placeholder="如: ABC123DEF456"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-200 px-3 py-2 text-sm outline-none transition-colors" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">显示名称</label>
              <input name="displayName" placeholder="如 MY-Shop-001"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-200 px-3 py-2 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">App ID *</label>
              <input name="appId" required placeholder="从 TikTok Business Platform 获取"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-200 px-3 py-2 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">App Secret *</label>
              <input name="appSecret" type="password" required placeholder="应用密钥"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-200 px-3 py-2 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Refresh Token *</label>
              <input name="refreshToken" required placeholder="OAuth 授权获取的刷新令牌"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-200 px-3 py-2 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">市场区域</label>
              <select name="region" defaultValue="MY"
                className="w-full rounded-lg border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-200 px-3 py-2 text-sm outline-none">
                <option value="MY">马来西亚 (MY)</option>
                <option value="US">美国 (US)</option>
                <option value="UK">英国 (UK)</option>
                <option value="VN">越南 (VN)</option>
                <option value="TH">泰国 (TH)</option>
                <option value="PH">菲律宾 (PH)</option>
                <option value="SG">新加坡 (SG)</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowManualForm(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm transition-colors">取消</button>
              <button type="submit"
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-medium transition-colors">保存账户</button>
            </div>
          </form>
        </div>
      )}

      {/* ── 账户列表 ── */}
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
            <p className="text-sm text-slate-400 mt-1">点击上方「一键授权」开始绑定，或使用手动添加方式</p>
          </div>
        ) : accounts.map(acc => {
          const st = statusMap[acc.status] || statusMap.active
          const StatusIcon = st.icon
          const isTesting = testingId === acc.id

          // 计算剩余有效期
          const expiresAt = acc.token_expires_at ? new Date(acc.token_expires_at).getTime() : 0
          const daysLeft = expiresAt > 0 ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000)) : 0

          return (
            <div key={acc.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${st.bg}`}>
                    <StatusIcon className={`h-5 w-5 ${st.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{acc.display_name || acc.advertiser_id}</h3>
                    <p className="text-sm text-slate-500 font-mono mt-0.5">Advertiser ID: {acc.advertiser_id}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                      <span>{acc.region} · {acc.currency}</span>
                      <span>·</span>
                      <span className={`font-medium ${acc.hasToken ? 'text-emerald-600' : 'text-red-500'}`}>
                        {acc.tokenStatus}
                      </span>
                      {daysLeft > 0 && daysLeft <= 7 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600"><Clock className="inline h-3 w-3 mr-0.5" />{daysLeft}天后过期</span>
                        </>
                      )}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? '测试中...' : '测试连接'}
                  </button>
                  <button onClick={() => handleDelete(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="解绑此账户"
                  >
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
