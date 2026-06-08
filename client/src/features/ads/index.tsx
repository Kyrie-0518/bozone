import { useState } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import {
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
  Percent,
  Search,
  Download,
  Play,
  ExternalLink,
  BarChart3,
  Zap,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from 'recharts'

// ── Types ──
type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft'
type AdObjective = 'conversion' | 'traffic' | 'awareness'

interface Campaign {
  id: string
  name: string
  objective: AdObjective
  status: CampaignStatus
  budget: number
  spent: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cpa: number
  revenue: number
  roas: number
  startDate: string
  endDate?: string
  product?: string
}

interface AdCreative {
  id: string
  campaignId: string
  campaignName: string
  name: string
  type: 'image' | 'video'
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cpa: number
  spend: number
  revenue: number
  roas: number
}

// ── Mock Data ──
const mockCampaigns: Campaign[] = [
  { id: '1', name: '冰箱除味剂-转化推广', objective: 'conversion', status: 'active', budget: 5000, spent: 3240.50, impressions: 125000, clicks: 3750, ctr: 3.0, conversions: 342, cpa: 9.47, revenue: 8240.00, roas: 2.54, startDate: '2026-05-15', product: '冰箱除味剂' },
  { id: '2', name: '多功能清洁膏-流量推广', objective: 'traffic', status: 'active', budget: 3000, spent: 1850.20, impressions: 89000, clicks: 5340, ctr: 6.0, conversions: 178, cpa: 10.39, revenue: 4200.00, roas: 2.27, startDate: '2026-05-20', product: '多功能清洁膏' },
  { id: '3', name: '洗衣机清洁片-品牌曝光', objective: 'awareness', status: 'paused', budget: 2000, spent: 520.80, impressions: 45000, clicks: 900, ctr: 2.0, conversions: 28, cpa: 18.60, revenue: 560.00, roas: 1.08, startDate: '2026-05-22', product: '洗衣机清洁片' },
  { id: '4', name: '除味蛋-爆品冲量', objective: 'conversion', status: 'active', budget: 8000, spent: 6780.00, impressions: 210000, clicks: 8400, ctr: 4.0, conversions: 756, cpa: 8.97, revenue: 18200.00, roas: 2.68, startDate: '2026-05-10', product: '除味蛋' },
  { id: '5', name: 'Summer Sale 大促', objective: 'conversion', status: 'completed', budget: 10000, spent: 9980.00, impressions: 320000, clicks: 11200, ctr: 3.5, conversions: 980, cpa: 10.18, revenue: 23500.00, roas: 2.35, startDate: '2026-05-01', endDate: '2026-05-20', product: '多品' },
]

const mockCreatives: AdCreative[] = [
  { id: 'c1', campaignId: '1', campaignName: '冰箱除味剂-转化推广', name: '除味剂使用场景A.mp4', type: 'video', impressions: 56000, clicks: 1680, ctr: 3.0, conversions: 152, cpa: 8.80, spend: 1337.60, revenue: 3650.00, roas: 2.73 },
  { id: 'c2', campaignId: '1', campaignName: '冰箱除味剂-转化推广', name: '除味剂产品展示图.jpg', type: 'image', impressions: 42000, clicks: 1050, ctr: 2.5, conversions: 98, cpa: 9.50, spend: 931.00, revenue: 2350.00, roas: 2.52 },
  { id: 'c3', campaignId: '4', campaignName: '除味蛋-爆品冲量', name: '除味蛋开箱测评.mp4', type: 'video', impressions: 85000, clicks: 3825, ctr: 4.5, conversions: 356, cpa: 8.20, spend: 2919.20, revenue: 8300.00, roas: 2.84 },
  { id: 'c4', campaignId: '4', campaignName: '除味蛋-爆品冲量', name: '除味蛋达人素材混剪.mp4', type: 'video', impressions: 72000, clicks: 2880, ctr: 4.0, conversions: 245, cpa: 9.30, spend: 2278.50, revenue: 5600.00, roas: 2.46 },
  { id: 'c5', campaignId: '2', campaignName: '多功能清洁膏-流量推广', name: '清洁膏多场景图.jpg', type: 'image', impressions: 51000, clicks: 3060, ctr: 6.0, conversions: 102, cpa: 10.50, spend: 1071.00, revenue: 2450.00, roas: 2.29 },
  { id: 'c6', campaignId: '5', campaignName: 'Summer Sale 大促', name: '大促主视觉视频.mp4', type: 'video', impressions: 180000, clicks: 6300, ctr: 3.5, conversions: 550, cpa: 9.80, spend: 5390.00, revenue: 12900.00, roas: 2.39 },
]

// 30 days trend
const trendData = Array.from({ length: 30 }, (_, i) => {
  const d = i + 1
  return {
    date: `5/${d}`,
    spend: Math.round(800 + Math.sin(d * 0.5) * 400 + d * 30 + (Math.random() - 0.5) * 200),
    revenue: Math.round(2000 + Math.sin(d * 0.5) * 1000 + d * 60 + (Math.random() - 0.5) * 400),
    roas: +(1.8 + Math.sin(d * 0.3) * 0.6 + Math.random() * 0.4).toFixed(2),
  }
})

// ── Configs ──
const statusConfig: Record<CampaignStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: '投放中', variant: 'default' },
  paused: { label: '已暂停', variant: 'secondary' },
  completed: { label: '已完成', variant: 'outline' },
  draft: { label: '草稿', variant: 'secondary' },
}

const objectiveConfig: Record<AdObjective, string> = {
  conversion: '转化量',
  traffic: '流量',
  awareness: '品牌曝光',
}

// ── Component ──
export function AdsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const location = useLocation()
  const isExactAdsPath = location.pathname === '/ads'

  const totals = mockCampaigns.reduce((acc, c) => ({
    spend: acc.spend + c.spent,
    impressions: acc.impressions + c.impressions,
    clicks: acc.clicks + c.clicks,
    conversions: acc.conversions + c.conversions,
    revenue: acc.revenue + c.revenue,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 })

  const totalROAS = totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : '0'
  const totalCTR = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(1) : '0'
  const totalCPA = totals.conversions > 0 ? (totals.spend / totals.conversions).toFixed(2) : '0'

  const filteredCampaigns = mockCampaigns.filter((c) => {
    if (search && !c.name.includes(search) && !c.product?.includes(search)) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString()

  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>



      <Main>
        {isExactAdsPath && (
        <>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>广告管理</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              TikTok Ads 投放效果监控 · 素材分析 · 广告费归因（API接入预留）
            </p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm'>
              <Download className='mr-1.5 h-4 w-4' />
              导出报表
            </Button>
            <Button size='sm' disabled>
              <Play className='mr-1.5 h-4 w-4' />
              新建广告
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>总花费</CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums text-destructive'>¥{totals.spend.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>曝光</CardTitle>
              <Eye className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums'>{formatNum(totals.impressions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>点击</CardTitle>
              <MousePointer className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums'>{formatNum(totals.clicks)}</div>
              <p className='text-xs text-muted-foreground'>CTR {totalCTR}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>转化</CardTitle>
              <ShoppingCart className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums'>{formatNum(totals.conversions)}</div>
              <p className='text-xs text-muted-foreground'>CPA ¥{totalCPA}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>ROAS</CardTitle>
              <Percent className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold tabular-nums ${Number(totalROAS) >= 2 ? 'text-emerald-500' : Number(totalROAS) >= 1 ? 'text-amber-500' : 'text-destructive'}`}>
                {totalROAS}
              </div>
              <p className='text-xs text-muted-foreground'>收入 ¥{totals.revenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue='campaigns'>
          <TabsList className='mb-4'>
            <TabsTrigger value='campaigns'>
              <TrendingUp className='mr-1.5 h-4 w-4' />
              广告系列
            </TabsTrigger>
            <TabsTrigger value='creatives'>
              <Zap className='mr-1.5 h-4 w-4' />
              创意素材
            </TabsTrigger>
            <TabsTrigger value='trend'>
              <BarChart3 className='mr-1.5 h-4 w-4' />
              趋势分析
            </TabsTrigger>
          </TabsList>

          {/* ── 广告系列 Tab ── */}
          <TabsContent value='campaigns'>
            <div className='mb-4 flex flex-wrap items-center gap-3'>
              <div className='relative w-64'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input placeholder='搜索广告系列...' className='pl-9' value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-28'>
                  <SelectValue placeholder='状态' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部状态</SelectItem>
                  <SelectItem value='active'>投放中</SelectItem>
                  <SelectItem value='paused'>已暂停</SelectItem>
                  <SelectItem value='completed'>已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['广告系列', '目标', '产品', '预算', '花费', '曝光', '点击', 'CTR', '转化', 'CPA', 'ROAS', '状态'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map((c) => (
                        <tr key={c.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-3 text-sm font-medium max-w-[180px] truncate'>{c.name}</td>
                          <td className='px-3 py-3'>
                            <Badge variant='outline'>{objectiveConfig[c.objective]}</Badge>
                          </td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{c.product}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>¥{c.budget.toLocaleString()}</td>
                          <td className='px-3 py-3 text-sm tabular-nums text-destructive'>¥{c.spent.toLocaleString()}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{formatNum(c.impressions)}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{formatNum(c.clicks)}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{c.ctr}%</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{c.conversions}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>¥{c.cpa.toFixed(2)}</td>
                          <td className={`px-3 py-3 text-sm font-semibold tabular-nums ${c.roas >= 2 ? 'text-emerald-500' : c.roas >= 1 ? 'text-amber-500' : 'text-destructive'}`}>
                            {c.roas.toFixed(2)}
                          </td>
                          <td className='px-3 py-3'>
                            <Badge variant={statusConfig[c.status].variant}>
                              {statusConfig[c.status].label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 创意素材 Tab ── */}
          <TabsContent value='creatives'>
            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['素材名称', '所属广告', '类型', '曝光', '点击', 'CTR', '转化', 'CPA', '花费', 'ROAS'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockCreatives.map((cr) => (
                        <tr key={cr.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-3 text-sm font-medium max-w-[200px] truncate'>{cr.name}</td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{cr.campaignName}</td>
                          <td className='px-3 py-3'>
                            <Badge variant={cr.type === 'video' ? 'default' : 'secondary'}>
                              {cr.type === 'video' ? '视频' : '图片'}
                            </Badge>
                          </td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{formatNum(cr.impressions)}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{formatNum(cr.clicks)}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{cr.ctr}%</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{cr.conversions}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>¥{cr.cpa.toFixed(2)}</td>
                          <td className='px-3 py-3 text-sm tabular-nums text-destructive'>¥{cr.spend.toLocaleString()}</td>
                          <td className={`px-3 py-3 text-sm font-semibold tabular-nums ${cr.roas >= 2 ? 'text-emerald-500' : cr.roas >= 1 ? 'text-amber-500' : 'text-destructive'}`}>
                            {cr.roas.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 趋势分析 Tab ── */}
          <TabsContent value='trend'>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>花费 vs 收入趋势</CardTitle>
                  <CardDescription>近30天广告花费与广告收入对比</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id='adSpendGrad' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#DC2626' stopOpacity={0.1} />
                          <stop offset='95%' stopColor='#DC2626' stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id='adRevGrad' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#059669' stopOpacity={0.1} />
                          <stop offset='95%' stopColor='#059669' stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                      <XAxis dataKey='date' tick={{ fontSize: 11 }} interval={6} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Area type='monotone' dataKey='spend' stroke='#DC2626' strokeWidth={2} fill='url(#adSpendGrad)' name='花费 ¥' />
                      <Area type='monotone' dataKey='revenue' stroke='#059669' strokeWidth={2} fill='url(#adRevGrad)' name='收入 ¥' />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ROAS 趋势</CardTitle>
                  <CardDescription>近30天广告投入产出比变化</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                      <XAxis dataKey='date' tick={{ fontSize: 11 }} interval={6} />
                      <YAxis tick={{ fontSize: 11 }} domain={[1, 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Line type='monotone' dataKey='roas' stroke='#D97706' strokeWidth={2} dot={false} name='ROAS' />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className='mt-2 text-center text-xs text-muted-foreground'>
                    虚线 = 盈亏平衡线 (ROAS 1.0)
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* API Integration Notice */}
        <Card className='mt-6 border-dashed'>
          <CardContent className='flex items-center gap-4 py-4'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
              <ExternalLink className='h-5 w-5 text-muted-foreground' />
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium'>TikTok Ads API 接入预留</p>
              <p className='text-xs text-muted-foreground'>
                当前数据为模拟数据。接入 TikTok Ads API 后将自动同步：广告花费、展示、点击、转化、ROAS 等核心指标，并自动归因到对应订单和SKU。
              </p>
            </div>
            <Button variant='outline' size='sm' disabled>
              配置 API
            </Button>
          </CardContent>
        </Card>
        </>
        )}
        <Outlet />
      </Main>
    </>
  )
}
