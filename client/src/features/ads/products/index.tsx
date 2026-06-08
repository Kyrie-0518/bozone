import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

// Types
interface AdProduct {
  id: string
  name: string
  productId: string
  image?: string
  category: string
  status: string
  // Metrics
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cost: number
  revenue: number
  roas: number
  cpa: number
  // Bozone diagnosis score
  diagnosisScore: number | null
  diagnosisIssues: string[]
}

const mockProducts: AdProduct[] = [
  {
    id: '1', name: 'LED Ring Light Pro 10"', productId: 'P001',
    image: '', category: '电子配件', status: 'active',
    impressions: 45200, clicks: 1280, ctr: 2.83,
    conversions: 86, cost: 384.50, revenue: 1290.00,
    roas: 3.36, cpa: 4.47,
    diagnosisScore: 85, diagnosisIssues: ['CPA偏高 - 建议优化落地页']
  },
  {
    id: '2', name: 'Wireless Bluetooth Earbuds V5', productId: 'P002',
    image: '', category: '电子产品', status: 'active',
    impressions: 67800, clicks: 2150, ctr: 3.17,
    conversions: 142, cost: 526.80, revenue: 2130.00,
    roas: 4.04, cpa: 3.71,
    diagnosisScore: 92, diagnosisIssues: []
  },
  {
    id: '3', name: 'Portable Mini Fan USB Rechargeable', productId: 'P003',
    image: '', category: '家居用品', status: 'paused',
    impressions: 23400, clicks: 520, ctr: 2.22,
    conversions: 18, cost: 156.40, revenue: 270.00,
    roas: 1.73, cpa: 8.69,
    diagnosisScore: 42, diagnosisIssues: ['ROAS过低(1.73)', 'CTR低于行业均值', '转化率偏低']
  },
  {
    id: '4', name: 'Makeup Brush Set 15pcs Premium', productId: 'P004',
    image: '', category: '美妆工具', status: 'active',
    impressions: 89100, clicks: 3420, ctr: 3.84,
    conversions: 228, cost: 820.10, revenue: 3420.00,
    roas: 4.17, cpa: 3.60,
    diagnosisScore: 95, diagnosisIssues: []
  },
  {
    id: '5', name: 'Phone Stand Holder Adjustable', productId: 'P005',
    image: '', category: '手机配件', status: 'active',
    impressions: 31500, clicks: 890, ctr: 2.82,
    conversions: 56, cost: 212.50, revenue: 840.00,
    roas: 3.95, cpa: 3.79,
    diagnosisScore: 78, diagnosisIssues: ['曝光量有提升空间']
  }
]

export default function AdsProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('roas')

  // Fetch real data from API
  const { data: apiData, isLoading: loading } = useQuery({
    queryKey: ['ads-products'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/ads/products')
        if (res.ok) return await res.json()
      } catch {}
      return null
    }
  })

  const products = useMemo(() => {
    const source = Array.isArray(apiData?.products) && apiData.products.length > 0 ? apiData.products : mockProducts
    return source
      .filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !p.productId.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'cost': return b.cost - a.cost
          case 'conversions': return b.conversions - a.conversions
          case 'roas': return b.roas - a.roas
          default: return b.impressions - a.impressions
        }
      })
  }, [apiData, searchTerm, statusFilter, sortBy])

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const avgRoas = products.length > 0 ? products.reduce((s, p) => s + p.roas, 0) / products.length : 0

  function getScoreColor(score: number | null) {
    if (!score) return 'bg-slate-200 text-slate-500'
    if (score >= 85) return 'bg-emerald-100 text-emerald-700 border-emerald-300'
    if (score >= 65) return 'bg-amber-100 text-amber-700 border-amber-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            商品推广管理
          </h1>
          <p className="text-slate-500 mt-1">追踪广告投放商品表现 &mdash; Bozone 独有诊断评分</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          推广新商品
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-slate-500">推广商品</p><p className="text-xl font-bold text-slate-900">{products.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">总GMV</p><p className="text-xl font-bold text-emerald-600">RM{totalRevenue.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-lg"><Star className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">平均ROAS</p><p className="text-xl font-bold text-violet-600">{avgRoas.toFixed(2)}</p></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-slate-500">需关注</p><p className="text-xl font-bold text-amber-600">{products.filter(p => (p.diagnosisScore ?? 0) < 70).length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="搜索商品名称或ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">投放中</SelectItem>
                <SelectItem value="paused">已暂停</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="impressions">按曝光排序</SelectItem>
                <SelectItem value="cost">按花费排序</SelectItem>
                <SelectItem value="conversions">按转化排序</SelectItem>
                <SelectItem value="roas">按ROAS排序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>商品信息</TableHead>
                <TableHead className="text-right">曝光量</TableHead>
                <TableHead className="text-right">点击率</TableHead>
                <TableHead className="text-right">花费</TableHead>
                <TableHead className="text-right">GMV</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-center">诊断评分</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    <td colSpan={8} className="px-4 py-6"><div className="h-4 w-56 bg-slate-200 rounded" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">暂无推广商品数据</p>
                    <p className="text-sm text-slate-400 mt-1">添加商品到广告系列或检查筛选条件</p>
                  </TableCell>
                </TableRow>
              ) : products.map(product => (
                <TableRow key={product.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm leading-tight">{product.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{product.productId} &middot; {product.category}</p>
                      </div>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={
                        product.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        product.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''
                      }>
                        {product.status === 'active' ? '投放中' : product.status === 'paused' ? '已暂停' : '已归档'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-700">
                    {product.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      product.ctr >= 3 ? 'text-emerald-600 bg-emerald-50' : product.ctr >= 2 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
                    }`}>
                      {product.ctr}%
                      {product.ctr >= 3 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    RM{product.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    RM{product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${product.roas >= 3 ? 'text-emerald-600' : product.roas >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                      {product.roas.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.diagnosisScore !== null ? (
                      <Badge variant="outline" className={`${getScoreColor(product.diagnosisScore)} border`}>
                        {product.diagnosisScore >= 85 ? <Star className="w-3 h-3 mr-1 inline" /> : <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                        {product.diagnosisScore}
                      </Badge>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs">详情</Button>
                      <Button size="sm" variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 text-xs gap-0.5">
                        <Zap className="w-3 h-3" /> GMV Max
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diagnosis Tips */}
      {products.some(p => (p.diagnosisScore ?? 0) < 70) && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Bozone 诊断建议</p>
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {products.filter(p => (p.diagnosisScore ?? 0) < 70).map(p => (
                    <li key={p.id}>
                      <strong>{p.name}</strong>: {p.diagnosisIssues.join('; ') || '整体表现良好'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
