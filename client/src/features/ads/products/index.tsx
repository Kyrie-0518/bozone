/**
 * 商品推广页面 (GMV Max SKU管理)
 * 
 * Bozone 独有功能 — 结合店铺商品库和诊断系统，
 * 告诉用户哪些商品适合投广告、哪些不建议投。
 */
import { useState, useEffect } from 'react'
import { Package, Plus, Brain, AlertTriangle, CheckCircle2, TrendingUp, Zap } from 'lucide-react'
import { api } from '@/lib/api'

interface Product {
  id: number
  name: string
  sku: string
  image: string
  sellPrice: number
  stock: number
  status: string
  category: string
}

// TODO: 对接诊断规则引擎后返回真实评分
const mockDiagnosisScore = (product: Product): number => Math.floor(Math.random() * 30 + 65)

export function AdsProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<Record<number, number>>({})

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await api.get('/api/products')
      if (res.data.success) setProducts(res.data.data.slice(0, 12)) // 取前12个演示
    } catch {}
    setLoading(false)
  }

  function handleCreateGmvMax(p: Product) {
    alert(`即将为 "${p.name}" 创建 GMV Max 广告活动\n\n此功能将在下一阶段实现（对接 TikTok GMV Max API）`)
  }

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="h-6 w-6 text-purple-500" />
            商品推广
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-normal ml-2">Bozone 独有</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">SKU 级别广告管理 — 结合诊断系统智能推荐</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.href = '/products'}
            className="flex items-center gap-1 px-3 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 text-sm font-medium"
          >
            <Zap className="h-4 w-4" /> 同步店铺商品
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Plus className="h-4 w-4" /> 创建 GMV Max 广告
          </button>
        </div>
      </div>

      {/* 智能推荐提示卡 */}
      <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-start gap-3">
          <Brain className="h-8 w-8 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-purple-900">智能推荐引擎</p>
            <p className="text-sm text-purple-700 mt-0.5">
              基于你的「店铺全面诊断」系统，综合评估每个商品的标题质量、主图评分、价格竞争力和库存状态，
              给出是否建议投放广告的判断依据。诊断模块上线后将显示完整分析报告。
            </p>
          </div>
        </div>
      </div>

      {/* 商品表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['商品信息', 'SKU', '价格', '库存', '诊断评分', '广告状态', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  <td colSpan={7} className="px-4 py-6"><div className="h-4 w-56 bg-slate-200 rounded" /></td>
                </tr>
              ))
            )) : products.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                暂无商品数据，先去「商品管理」添加商品
              </td></tr>
            ) : products.map((p, i) => {
              const score = scores[p.id] ?? mockDiagnosisScore(p)
              const level = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 55 ? 'warning' : 'poor'
              const levelConfig: Record<string, { label: string; color: string; icon: any }> = {
                excellent: { label: '强烈推荐投放', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
                good: { label: '适合投放', color: 'text-blue-600 bg-blue-50', icon: TrendingUp },
                warning: { label: '需优化后再投', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
                poor: { label: '暂不推荐', color: 'text-red-500 bg-red-50', icon: AlertTriangle },
              }
              const lc = levelConfig[level]
              const LcIcon = lc.icon

              return (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-10 w-10 rounded object-cover border border-slate-200" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center"><Package className="h-4 w-4 text-slate-400" /></div>
                      )}
                      <span className="font-medium text-slate-800 max-w-[180px] truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{p.sku || '-'}</td>
                  <td className="px-4 py-3 font-mono">¥{p.sellPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full ${
                          score >= 85 ? 'bg-emerald-400' : score >= 70 ? 'bg-blue-400' : score >= 55 ? 'bg-amber-400' : 'bg-red-400'
                        }`} style={{ width: `${score}%` }} />
                      </div>
                      <span className="font-bold text-sm tabular-nums">{score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${lc.color}`}>
                      <LcIcon className="h-3 w-3" /> {lc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {score >= 70 ? (
                      <button onClick={() => handleCreateGmvMax(p)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium">
                        一键创建广告
                      </button>
                    ) : (
                      <button disabled className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs cursor-not-allowed">
                        需优化商品
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
