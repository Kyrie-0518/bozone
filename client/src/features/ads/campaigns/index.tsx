import { useState, useMemo } from 'react'
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
  Megaphone,
  Plus,
  Search,
  Filter,
  Pause,
  Play,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react'

// Types
interface AdCampaign {
  id: string
  name: string
  campaignId: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  objective: string
  budgetType: 'daily' | 'lifetime'
  budget: number
  spent: number
  // Metrics
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  costPerConversion: number
  roas: number
  cpm: number
  // Dates
  startDate: string
  endDate?: string
}

const mockCampaigns: AdCampaign[] = [
  {
    id: '1', name: 'MY-Flash-Sale-June', campaignId: 'C001',
    status: 'active', objective: 'CONVERSIONS',
    budgetType: 'daily', budget: 200, spent: 167.80,
    impressions: 45200, clicks: 1280, ctr: 2.83,
    conversions: 64, costPerConversion: 2.62, roas: 4.2, cpm: 3.71,
    startDate: '2026-06-01'
  },
  {
    id: '2', name: 'Beauty-Collection-Q2', campaignId: 'C002',
    status: 'active', objective: 'TRAFFIC',
    budgetType: 'daily', budget: 150, spent: 123.50,
    impressions: 67800, clicks: 2150, ctr: 3.17,
    conversions: 42, costPerConversion: 2.94, roas: 3.1, cpm: 1.82,
    startDate: '2026-05-20'
  },
  {
    id: '3', name: 'Electronics-Promo-Raya', campaignId: 'C003',
    status: 'paused', objective: 'CONVERSIONS',
    budgetType: 'lifetime', budget: 3000, spent: 2890.40,
    impressions: 234000, clicks: 6700, ctr: 2.86,
    conversions: 412, costPerConversion: 7.01, roas: 2.8, cpm: 12.35,
    startDate: '2026-04-15', endDate: '2026-06-05'
  },
  {
    id: '4', name: 'New-Customer-Acquisition', campaignId: 'C004',
    status: 'active', objective: 'REACH',
    budgetType: 'daily', budget: 100, spent: 87.20,
    impressions: 89000, clicks: 1890, ctr: 2.12,
    conversions: 28, costPerConversion: 3.11, roas: 5.4, cpm: 0.98,
    startDate: '2026-06-03'
  }
]

export default function AdsCampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [objectiveFilter, setObjectiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('spent')

  const { data: apiData, isLoading: loading } = useQuery({
    queryKey: ['ads-campaigns'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/ads/campaigns')
        if (res.ok) return await res.json()
      } catch {}
      return null
    }
  })

  const campaigns = useMemo(() => {
    const source = Array.isArray(apiData?.campaigns) && apiData.campaigns.length > 0 ? apiData.campaigns : mockCampaigns
    return source.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (objectiveFilter !== 'all' && c.objective !== objectiveFilter) return false
      if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !c.campaignId.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    }).sort((a, b) => {
      switch (sortBy) {
        case 'roas': return b.roas - a.roas
        case 'impressions': return b.impressions - a.impressions
        case 'conversions': return b.conversions - a.conversions
        default: return b.spent - a.spent
      }
    })
  }, [apiData, searchTerm, statusFilter, objectiveFilter, sortBy])

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0)
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const avgRoas = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length : 0

  function getStatusBadge(status: AdCampaign['status']) {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">投放中</Badge>
      case 'paused': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">已暂停</Badge>
      case 'completed': return <Badge className="bg-slate-100 text-slate-600 border-slate-200">已完成</Badge>
      default: return <Badge variant="secondary">草稿</Badge>
    }
  }

  function getObjectiveLabel(obj: string) {
    const map: Record<string, string> = { CONVERSIONS: '转化', TRAFFIC: '流量', REACH: '覆盖', AWARENESS: '品牌认知' }
    return map[obj] || obj
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-blue-600" />
            广告系列管理
          </h1>
          <p className="text-slate-500 mt-1">管理所有 TikTok 广告系列 &mdash; 实时数据追踪</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 创建广告系列
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-slate-500">总预算</p><p className="text-xl font-bold text-slate-900">
              RM{totalBudget.toLocaleString()}
            </p></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-lg"><TrendingUp className="w-5 h-5 text-red-500" /></div>
            <div><p className="text-xs text-slate-500">已花费</p><p className="text-xl font-bold text-red-600">
              RM{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 rounded-lg"><TrendingUp className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-xs text-slate-500">平均ROAS</p><p className="text-xl font-bold text-violet-600">{avgRoas.toFixed(2)}</p></div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-lg"><ArrowUpRight className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-slate-500">总转化</p><p className="text-xl font-bold text-emerald-600">{totalConversions}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="搜索广告系列..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">投放中</SelectItem>
                <SelectItem value="paused">暂停</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
            <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部目标</SelectItem>
                <SelectItem value="CONVERSIONS">转化</SelectItem>
                <SelectItem value="TRAFFIC">流量</SelectItem>
                <SelectItem value="REACH">覆盖</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="spent">按花费排序</SelectItem>
                <SelectItem value="roas">按ROAS排序</SelectItem>
                <SelectItem value="impressions">按曝光排序</SelectItem>
                <SelectItem value="conversions">按转化排序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>广告系列</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>目标</TableHead>
                <TableHead className="text-right">预算/已花</TableHead>
                <TableHead className="text-right">曝光量</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">转化</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    <td colSpan={10} className="px-4 py-6"><div className="h-4 w-40 bg-slate-200 rounded" /></td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">暂无广告系列</p>
                    <p className="text-sm text-slate-400 mt-1">创建你的第一个 TikTok 广告系列</p>
                  </TableCell>
                </TableRow>
              ) : campaigns.map(campaign => (
                <TableRow key={campaign.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 text-sm leading-tight">{campaign.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">ID: {campaign.campaignId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{getObjectiveLabel(campaign.objective)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      <span className="text-slate-900 font-medium">RM{campaign.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-slate-400"> / RM{campaign.budget.toLocaleString()}</span>
                      <div className="mt-0.5 w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${campaign.spent / campaign.budget > 0.8 ? 'bg-red-400' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, (campaign.spent / campaign.budget) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-700">{campaign.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      campaign.ctr >= 2.5 ? 'text-emerald-600 bg-emerald-50' :
                      campaign.ctr >= 1.5 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
                    }`}>
                      {campaign.ctr}%
                      {campaign.ctr >= 2.5 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">{campaign.conversions}</TableCell>
                  <TableCell className="text-right text-slate-700">
                    RM{campaign.costPerConversion.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${
                      campaign.roas >= 4 ? 'text-emerald-600' :
                      campaign.roas >= 2 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {campaign.roas.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {campaign.status === 'active' ? (
                        <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"><Pause className="w-3.5 h-3.5" /></Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"><Play className="w-3.5 h-3.5" /></Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-700"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
