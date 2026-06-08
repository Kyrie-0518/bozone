import { useState, useMemo } from 'react'
import {
  Users,
  Plus,
  Search,
  Send,
  Package,
  DollarSign,
  BarChart3,
  Globe2,
  TrendingUp,
  Eye,
  Star,
  Video,
  ShoppingBag,
  UserCheck,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '@/lib/api'

// ── Types (TikTok API) ──
interface TkCreator {
  creatorOpenId: string
  username: string
  nickname: string
  avatar?: { url?: string }
  selectionRegion?: string
  bioDescription?: string
  followerCount: number
  ecVideoCount?: number
  ecLiveCount?: number
  avgEcVideoViewCount?: number
  avgEcLiveUv?: number
  ecVideoEngagementRate?: number
  gmv?: { amount?: number; currency?: string; range?: { formatted?: string } }
  videoGmv?: { amount?: number; currency?: string; range?: { formatted?: string } }
  liveGmv?: { amount?: number; currency?: string; range?: { formatted?: string } }
  unitsSoldRange?: { formatted?: string }
  topFollowerDemographics?: Array<{ gender?: string; ageGroup?: string; region?: string }>
  categoryIds?: string[]
}

interface CreatorPerformance {
  creatorOpenId: string
  username: string
  nickname: string
  avatar?: { url?: string }
  bioDescription?: string
  selectionRegion?: string
  profileTtUri?: string
  followerCount: number
  followerAge?: Array<{ ageRange: string; percentage: number }>
  followerGender?: Array<{ gender: string; percentage: number }>
  followerLocation?: Array<{ region: string; percentage: number }>
  gmv?: { amount: number; currency: string; range: { formatted: string } }
  videoGmv?: { amount: number; currency: string; range: { formatted: string } }
  liveGmv?: { amount: number; currency: string; range: { formatted: string } }
  gpm?: number
  videoGpm?: number
  liveGpm?: number
  unitsSold?: number
  unitsSoldRange?: { formatted: string }
  ecVideoCount: number
  ecLiveCount: number
  avgEcVideoPlayCount: number
  avgEcVideoLikeCount: number
  avgEcVideoCommentCount: number
  avgEcVideoShareCount: number
  avgEcLiveUv: number
  ecVideoEngagementRate: number
  ecLiveEngagementRate: number
  brandCollaborationCount?: number
  topCollaboratedBrandIds?: string[]
  promotedProductNum?: number
  avgCommissionRate?: number
  rating?: number
  categoryGmvDistribution?: Array<{ categoryId: string; categoryName?: string; gmv: number }>
  contentGmvDistribution?: Array<{ contentType: string; gmv: number }>
  pps?: number
  postRate?: number
}

// ── Local Types (existing CRUD) ──
type InfluencerStatus = 'pending' | 'contacted' | 'sample_sent' | 'cooperating' | 'terminated'
type SampleStatus = 'requested' | 'approved' | 'shipped' | 'delivered' | 'video_received' | 'rejected'

interface Influencer {
  id: string; name: string; tiktokId: string; followers: number; country: string
  whatsapp?: string; product?: string; commissionRate: number; status: InfluencerStatus
  notes?: string; lastContact: string
}

interface SampleRequest {
  id: string; influencerName: string; product: string; quantity: number
  requestDate: string; status: SampleStatus; trackingNo?: string; estimatedDelivery?: string
  videoUrl?: string; notes?: string
}

interface PerformanceRecord {
  id: string; influencerName: string; product: string; videoUrl: string
  videoViews: number; gmv: number; orders: number; commission: number
  date: string; roi: number
}

interface CommissionSettlement {
  id: string; influencerName: string; period: string; totalGMV: number
  totalOrders: number; commissionRate: number; commissionAmount: number
  status: 'pending' | 'paid'; paidDate?: string
}

// ── Mock Data (local CRUD — will be replaced by real API later) ──
const mockInfluencers: Influencer[] = [
  { id: '1', name: 'Sarah Beauty', tiktokId: '@sarahbeauty_my', followers: 125000, country: '马来西亚', whatsapp: '+60 12-345-6789', product: '冰箱除味剂', commissionRate: 15, status: 'cooperating', notes: '头部达人，带货能力强', lastContact: '2026-05-28' },
  { id: '2', name: 'CleanHome MY', tiktokId: '@cleanhome_my', followers: 85000, country: '马来西亚', commissionRate: 12, status: 'sample_sent', lastContact: '2026-05-27' },
  { id: '3', name: 'TechLife PH', tiktokId: '@techlife_ph', followers: 42000, country: '菲律宾', commissionRate: 10, status: 'contacted', lastContact: '2026-05-26' },
  { id: '4', name: 'HomeTips SG', tiktokId: '@hometips_sg', followers: 31000, country: '新加坡', whatsapp: '+65 9123-4567', commissionRate: 18, status: 'pending', notes: '主页风格匹配，优先建联', lastContact: '2026-05-25' },
  { id: '5', name: 'MomReview MY', tiktokId: '@momreview_my', followers: 68000, country: '马来西亚', product: '洗衣机清洁片', commissionRate: 15, status: 'cooperating', lastContact: '2026-05-28' },
  { id: '6', name: 'DailyVlog VN', tiktokId: '@dailyvlog_vn', followers: 95000, country: '越南', commissionRate: 12, status: 'terminated', notes: '合作效果差，ROI低于预期', lastContact: '2026-05-10' },
]

const mockSampleRequests: SampleRequest[] = [
  { id: 's1', influencerName: 'CleanHome MY', product: '多功能清洁膏', quantity: 2, requestDate: '2026-05-27', status: 'shipped', trackingNo: 'SF7890123456', estimatedDelivery: '2026-06-02' },
  { id: 's2', influencerName: 'TechLife PH', product: '冰箱除味剂', quantity: 1, requestDate: '2026-05-26', status: 'approved' },
  { id: 's3', influencerName: 'Sarah Beauty', product: '除味蛋', quantity: 3, requestDate: '2026-05-20', status: 'video_received', videoUrl: 'https://tiktok.com/@sarah/video/123' },
  { id: 's4', influencerName: 'MomReview MY', product: '洗衣机清洁片', quantity: 2, requestDate: '2026-05-18', status: 'delivered', trackingNo: 'SF7890123457', estimatedDelivery: '2026-05-25' },
  { id: 's5', influencerName: 'HomeTips SG', product: '厨房清洁剂', quantity: 1, requestDate: '2026-05-28', status: 'requested' },
  { id: 's6', influencerName: 'DailyVlog VN', product: '除味棒', quantity: 1, requestDate: '2026-05-08', status: 'rejected', notes: '达人已终止合作' },
]

const mockPerformances: PerformanceRecord[] = [
  { id: 'p1', influencerName: 'Sarah Beauty', product: '冰箱除味剂', videoUrl: 'https://tiktok.com/@sarah/video/123', videoViews: 125000, gmv: 8500, orders: 320, commission: 1275, date: '2026-05-25', roi: 3.2 },
  { id: 'p2', influencerName: 'Sarah Beauty', product: '多功能清洁膏', videoUrl: 'https://tiktok.com/@sarah/video/456', videoViews: 98000, gmv: 6200, orders: 210, commission: 930, date: '2026-05-20', roi: 2.8 },
  { id: 'p3', influencerName: 'MomReview MY', product: '洗衣机清洁片', videoUrl: 'https://tiktok.com/@mom/video/789', videoViews: 56000, gmv: 3400, orders: 130, commission: 510, date: '2026-05-22', roi: 2.1 },
  { id: 'p4', influencerName: 'MomReview MY', product: '冰箱除味剂', videoUrl: 'https://tiktok.com/@mom/video/012', videoViews: 42000, gmv: 2800, orders: 95, commission: 420, date: '2026-05-18', roi: 1.9 },
  { id: 'p5', influencerName: 'CleanHome MY', product: '多功能清洁膏', videoUrl: 'https://tiktok.com/@clean/video/345', videoViews: 32000, gmv: 1800, orders: 62, commission: 216, date: '2026-05-15', roi: 1.5 },
]

const mockSettlements: CommissionSettlement[] = [
  { id: 'c1', influencerName: 'Sarah Beauty', period: '2026-05', totalGMV: 14700, totalOrders: 530, commissionRate: 15, commissionAmount: 2205, status: 'paid', paidDate: '2026-05-28' },
  { id: 'c2', influencerName: 'MomReview MY', period: '2026-05', totalGMV: 6200, totalOrders: 225, commissionRate: 15, commissionAmount: 930, status: 'pending' },
  { id: 'c3', influencerName: 'CleanHome MY', period: '2026-05', totalGMV: 1800, totalOrders: 62, commissionRate: 12, commissionAmount: 216, status: 'pending' },
]

// ── Performance Trend ──
const perfTrend = Array.from({ length: 30 }, (_, i) => ({
  date: `5/${i + 1}`,
  gmv: Math.round(200 + Math.sin(i * 0.5) * 400 + i * 30 + (Math.random() - 0.5) * 200),
  orders: Math.round(5 + Math.sin(i * 0.5) * 15 + i * 0.8 + (Math.random() - 0.5) * 5),
}))

// ── Configs ──
const statusConfig: Record<InfluencerStatus, { label: string; variant: 'secondary' | 'outline' | 'default' | 'destructive' }> = {
  pending: { label: '待建联', variant: 'secondary' },
  contacted: { label: '已建联', variant: 'outline' },
  sample_sent: { label: '已寄样', variant: 'default' },
  cooperating: { label: '合作中', variant: 'default' },
  terminated: { label: '已终止', variant: 'destructive' },
}

const sampleStatusConfig: Record<SampleStatus, { label: string; variant: 'secondary' | 'outline' | 'default' | 'destructive' }> = {
  requested: { label: '待审核', variant: 'secondary' },
  approved: { label: '已通过', variant: 'outline' },
  shipped: { label: '已发货', variant: 'default' },
  delivered: { label: '已签收', variant: 'default' },
  video_received: { label: '已产出', variant: 'default' },
  rejected: { label: '已拒绝', variant: 'destructive' },
}

const settlementStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
  pending: { label: '待结算', variant: 'secondary' },
  paid: { label: '已结算', variant: 'default' },
}

const countries = ['马来西亚', '菲律宾', '新加坡', '泰国', '越南', '印尼']
const regions = ['MY', 'PH', 'SG', 'TH', 'VN', 'ID']

// ── Helpers ──
function formatFollowers(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function InfluencersPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [batchMsgOpen, setBatchMsgOpen] = useState(false)
  const [newInfluencer, setNewInfluencer] = useState({
    name: '', tiktokId: '', followers: 0, country: '', whatsapp: '', product: '', commissionRate: 15, notes: '',
  })

  // AS-001: TikTok search state
  const [tkSearch, setTkSearch] = useState('')
  const [tkRegion, setTkRegion] = useState('')
  const [tkFollowerMin, setTkFollowerMin] = useState<string>('')
  const [selectedCreator, setSelectedCreator] = useState<TkCreator | null>(null)

  // AS-001: Query TikTok marketplace creators
  const { data: tkSearchResult, isLoading: tkLoading, error: tkError } = useQuery({
    queryKey: ['influencers-tiktok-search', tkSearch, tkRegion, tkFollowerMin],
    queryFn: () => api.get('/api/influencers/tiktok/search', {
      params: {
        keyword: tkSearch || undefined,
        region: tkRegion || undefined,
        followerMin: tkFollowerMin ? Number(tkFollowerMin) : undefined,
      },
    }).then((r: any) => r.data),
    enabled: true, // Always load on mount, auto-refetch on filter change
    staleTime: 2 * 60_000, // cache 2 min
  })

  // AS-002: Query selected creator's performance detail
  const { data: creatorPerf, isLoading: perfLoading } = useQuery({
    queryKey: ['creator-perf', selectedCreator?.creatorOpenId],
    queryFn: () => api.get(`/api/influencers/tiktok/${selectedCreator!.creatorOpenId}/performance`)
      .then((r: any) => r.data),
    enabled: !!selectedCreator?.creatorOpenId,
    staleTime: 5 * 60_000,
  })

  const filtered = useMemo(() =>
    mockInfluencers.filter((inf) =>
      inf.name.toLowerCase().includes(search.toLowerCase()) || inf.tiktokId.toLowerCase().includes(search.toLowerCase())
    ), [search])

  const addInfluencer = () => {
    setDialogOpen(false)
    setNewInfluencer({ name: '', tiktokId: '', followers: 0, country: '', whatsapp: '', product: '', commissionRate: 15, notes: '' })
  }

  const creators = tkSearchResult?.creators || []

  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        {/* ═══ Header ═══ */}
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-purple-200'>
              <Users className='h-5 w-5 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-slate-800'>达人BD</h1>
              <p className='text-xs text-muted-foreground mt-0.5'>TikTok 达人全链路管理 · 发现 → 建联 → 寄样 → 带货 → 结算</p>
            </div>
          </div>
          <div className='flex gap-2'>
            <Dialog open={batchMsgOpen} onOpenChange={setBatchMsgOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Send className='mr-1.5 h-4 w-4' />
                  批量建联
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                  <DialogTitle>批量建联</DialogTitle>
                  <DialogDescription>选择达人并发送邀约消息</DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label>选择达人（可多选）</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder='选择达人' /></SelectTrigger>
                      <SelectContent>
                        {mockInfluencers.filter(i => i.status === 'pending').map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.name} ({i.tiktokId})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <Label>邀约模板</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder='选择模板' /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value='template1'>合作邀约 - 标准版</SelectItem>
                        <SelectItem value='template2'>合作邀约 - 高佣金版</SelectItem>
                        <SelectItem value='template3'>样品寄送邀请</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <Label>消息内容</Label>
                    <Textarea
                      rows={4}
                      defaultValue='Hi {达人名}，我是 Bozone 的运营，看到你的内容风格和我们产品很匹配。我们正在寻找 TikTok 达人合作推广，佣金比例 {佣金}%，有兴趣聊聊吗？'
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={() => setBatchMsgOpen(false)}>取消</Button>
                  <Button onClick={() => setBatchMsgOpen(false)}>发送</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size='sm'>
                  <Plus className='mr-1.5 h-4 w-4' />
                  添加达人
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[550px]'>
                <DialogHeader>
                  <DialogTitle>登记新达人</DialogTitle>
                  <DialogDescription>记录达人基本信息与合作意向</DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'><Label>达人姓名</Label><Input placeholder='姓名' value={newInfluencer.name} onChange={(e) => setNewInfluencer({ ...newInfluencer, name: e.target.value })} /></div>
                    <div className='grid gap-2'><Label>TikTok ID</Label><Input placeholder='@username' value={newInfluencer.tiktokId} onChange={(e) => setNewInfluencer({ ...newInfluencer, tiktokId: e.target.value })} /></div>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'><Label>粉丝数</Label><Input type='number' value={newInfluencer.followers || ''} onChange={(e) => setNewInfluencer({ ...newInfluencer, followers: Number(e.target.value) })} /></div>
                    <div className='grid gap-2'><Label>国家</Label><Select value={newInfluencer.country} onValueChange={(v) => setNewInfluencer({ ...newInfluencer, country: v })}><SelectTrigger><SelectValue placeholder='选择国家' /></SelectTrigger><SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'><Label>WhatsApp</Label><Input placeholder='+60 ...' value={newInfluencer.whatsapp} onChange={(e) => setNewInfluencer({ ...newInfluencer, whatsapp: e.target.value })} /></div>
                    <div className='grid gap-2'><Label>关联产品</Label><Input placeholder='产品名称' value={newInfluencer.product} onChange={(e) => setNewInfluencer({ ...newInfluencer, product: e.target.value })} /></div>
                  </div>
                  <div className='grid gap-2'><Label>佣金比例 (%)</Label><Input type='number' value={newInfluencer.commissionRate} onChange={(e) => setNewInfluencer({ ...newInfluencer, commissionRate: Number(e.target.value) })} /></div>
                  <div className='grid gap-2'><Label>备注</Label><Textarea rows={2} value={newInfluencer.notes} onChange={(e) => setNewInfluencer({ ...newInfluencer, notes: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={() => setDialogOpen(false)}>取消</Button>
                  <Button onClick={addInfluencer}>保存</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue='discover' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='discover'><Globe2 className='mr-1.5 h-4 w-4' />达人发现</TabsTrigger>
            <TabsTrigger value='roster'><Users className='mr-1.5 h-4 w-4' />达人列表</TabsTrigger>
            <TabsTrigger value='samples'><Package className='mr-1.5 h-4 w-4' />寄样管理</TabsTrigger>
            <TabsTrigger value='performance'><BarChart3 className='mr-1.5 h-4 w-4' />带货效果</TabsTrigger>
            <TabsTrigger value='settlement'><DollarSign className='mr-1.5 h-4 w-4' />佣金结算</TabsTrigger>
          </TabsList>

          {/* ════════ AS-001: TikTok 达人发现 ════════ */}
          <TabsContent value='discover' className='space-y-4'>
            {/* Search & Filter Bar */}
            <Card className='border-slate-200/60 shadow-sm'>
              <CardContent className='p-4'>
                <div className='flex flex-wrap items-center gap-3'>
                  <div className='relative flex-1 min-w-[220px] max-w-md'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      placeholder='搜索达人用户名或昵称...'
                      className='pl-9 h-9 bg-white border-slate-200/80 focus:border-blue-400'
                      value={tkSearch}
                      onChange={(e) => setTkSearch(e.target.value)}
                    />
                  </div>
                  <Select value={tkRegion} onValueChange={setTkRegion}>
                    <SelectTrigger className='w-[140px] h-9'><SelectValue placeholder='全部地区' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>全部地区</SelectItem>
                      {regions.map(r => (
                        <SelectItem key={r} value={r}>
                          {{ MY: '🇲🇾 马来西亚', PH: '🇵🇭 菲律宾', SG: '🇸🇬 新加坡', TH: '🇹🇭 泰国', VN: '🇻🇳 越南', ID: '🇮🇩 印尼' }[r] || r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className='relative min-w-[140px]'>
                    <Input
                      placeholder='最小粉丝数'
                      className='h-9 pr-16 bg-white border-slate-200/80'
                      type='number'
                      value={tkFollowerMin}
                      onChange={(e) => setTkFollowerMin(e.target.value)}
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>fans</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Grid */}
            {tkLoading ? (
              <div className='flex items-center justify-center py-20 text-muted-foreground'>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' /> 正在搜索 TikTok 达人市场...
              </div>
            ) : tkError ? (
              <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                <Globe2 className='mb-3 h-12 w-12 opacity-40' />
                <p className='font-medium'>搜索失败</p>
                <p className='text-sm mt-1'>请确保已连接 TikTok Shop 且有 AffiliateSeller 权限</p>
              </div>
            ) : creators.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                <Users className='mb-3 h-12 w-12 opacity-40' />
                <p className='font-medium'>暂无搜索结果</p>
                <p className='text-sm mt-1'>尝试调整关键词或筛选条件</p>
              </div>
            ) : (
              <>
                <p className='text-sm text-muted-foreground'>
                  找到 <span className='font-semibold text-slate-700'>{creators.length}</span> 位达人
                  · 数据来源：TikTok Creator Marketplace（近30天）
                </p>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  {creators.map((creator) => (
                    <Card key={creator.creatorOpenId} className='transition-all hover:shadow-lg cursor-pointer group border-slate-200/60'
                      onClick={() => setSelectedCreator(creator)}>
                      <CardHeader className='pb-3'>
                        <div className='flex items-start gap-3'>
                          {creator.avatar?.url ? (
                            <img src={creator.avatar.url} alt={creator.nickname} className='h-12 w-12 rounded-full object-cover shrink-0 border-2 border-slate-200 group-hover:border-blue-300 transition-colors' loading='lazy' />
                          ) : (
                            <div className='h-12 w-12 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0'>
                              <UserCheck className='h-6 w-6 text-violet-400' />
                            </div>
                          )}
                          <div className='min-w-0 flex-1'>
                            <CardTitle className='text-base leading-tight line-clamp-1'>{creator.nickname || creator.username}</CardTitle>
                            <p className='text-xs font-mono text-muted-foreground truncate'>@{creator.username}</p>
                            {creator.selectionRegion && (
                              <Badge variant='outline' className='mt-1 text-[10px] px-1.5 py-0'>
                                {{ MY: '🇲🇾', PH: '🇵🇭', SG: '🇸🇬', TH: '🇹🇭', VN: '🇻🇳', ID: '🇮🇩' }[creator.selectionRegion] || ''}{creator.selectionRegion}
                              </Badge>
                            )}
                          </div>
                          <Eye className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0' />
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Key metrics row */}
                        <div className='grid grid-cols-3 gap-y-2 mb-3 text-center'>
                          <div className='rounded-lg bg-blue-50/60 p-2'>
                            <p className='text-[11px] text-blue-600 font-medium'>粉丝</p>
                            <p className='text-sm font-bold tabular-nums text-blue-700'>{formatFollowers(creator.followerCount)}</p>
                          </div>
                          <div className='rounded-lg bg-emerald-50/60 p-2'>
                            <p className='text-[11px] text-emerald-600 font-medium'>GMV</p>
                            <p className='text-sm font-bold tabular-nums text-emerald-700'>{creator.gmv?.range?.formatted || `RM${creator.gmv?.amount?.toFixed(0) || '—'}`}</p>
                          </div>
                          <div className='rounded-lg bg-orange-50/60 p-2'>
                            <p className='text-[11px] text-orange-600 font-medium'>均播</p>
                            <p className='text-sm font-bold tabular-nums text-orange-700'>{formatNumber(creator.avgEcVideoViewCount || 0)}</p>
                          </div>
                        </div>

                        {/* Secondary info */}
                        <div className='flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500'>
                          <span>视频 <strong className='text-slate-700'>{creator.ecVideoCount || 0}</strong></span>
                          <span>直播 <strong className='text-slate-700'>{creator.ecLiveCount || 0}</strong></span>
                          {creator.unitsSoldRange?.formatted && <span>销量 <strong className='text-slate-700'>{creator.unitsSoldRange.formatted}</strong></span>}
                          {creator.videoGmv?.range?.formatted && <span>视频GMV <strong className='text-slate-700'>{creator.videoGmv.range.formatted}</strong></span>}
                        </div>

                        <div className='mt-3 pt-2 border-t border-slate-100 text-[10px] text-center text-muted-foreground'>
                          点击查看完整画像 →
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ════════ 本地达人列表 (CRUD) ════════ */}
          <TabsContent value='roster'>
            <div className='mb-4'>
              <div className='relative max-w-sm'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input placeholder='搜索达人...' className='pl-9' value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filtered.map((inf) => (
                <Card key={inf.id} className='transition-shadow hover:shadow-md'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div><CardTitle className='text-base'>{inf.name}</CardTitle><p className='text-sm text-muted-foreground font-mono'>{inf.tiktokId}</p></div>
                      <Badge variant={statusConfig[inf.status].variant}>{statusConfig[inf.status].label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 gap-y-2 text-sm mb-3'>
                      <div className='text-muted-foreground'>粉丝</div><div className='text-right font-medium tabular-nums'>{formatFollowers(inf.followers)}</div>
                      <div className='text-muted-foreground'>国家</div><div className='text-right'>{inf.country}</div>
                      {inf.product && (<><div className='text-muted-foreground'>产品</div><div className='text-right'>{inf.product}</div></>)}
                      <div className='text-muted-foreground'>佣金</div><div className='text-right font-medium'>{inf.commissionRate}%</div>
                    </div>
                    {inf.notes && <div className='rounded-md bg-muted/50 p-2 text-xs text-muted-foreground mb-2'>{inf.notes}</div>}
                    <div className='pt-2 border-t text-[11px] text-muted-foreground'>最近联系: {inf.lastContact}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ════════ 寄样管理 ════════ */}
          <TabsContent value='samples'>
            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['达人', '产品', '数量', '申请日期', '运单号', '预计送达', '状态', '备注'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockSampleRequests.map((s) => (
                        <tr key={s.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-3 text-sm font-medium'>{s.influencerName}</td>
                          <td className='px-3 py-3 text-sm'>{s.product}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{s.quantity}</td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{s.requestDate}</td>
                          <td className='px-3 py-3 text-sm font-mono tabular-nums text-muted-foreground'>{s.trackingNo || '—'}</td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{s.estimatedDelivery || '—'}</td>
                          <td className='px-3 py-3'><Badge variant={sampleStatusConfig[s.status].variant}>{sampleStatusConfig[s.status].label}</Badge></td>
                          <td className='px-3 py-3 text-sm text-muted-foreground max-w-[120px] truncate'>{s.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ 带货效果 ════════ */}
          <TabsContent value='performance' className='space-y-6'>
            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader><CardTitle>达人带货 GMV 趋势</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width='100%' height={250}>
                    <AreaChart data={perfTrend}>
                      <defs>
                        <linearGradient id='gmvGrad' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#D97706' stopOpacity={0.12} /><stop offset='95%' stopColor='#D97706' stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                      <XAxis dataKey='date' tick={{ fontSize: 11 }} interval={6} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Area type='monotone' dataKey='gmv' stroke='#D97706' strokeWidth={2} fill='url(#gmvGrad)' name='GMV ¥' />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>达人带货视频列表</CardTitle></CardHeader>
                <CardContent className='p-0'>
                  <div className='overflow-x-auto'>
                    <table className='w-full'><thead><tr className='border-b bg-muted/50'>
                      {['达人', '产品', '播放量', 'GMV', '订单', '佣金', '日期', 'ROI'].map(h => <th key={h} className='px-3 py-2 text-xs font-semibold text-muted-foreground'>{h}</th>)}
                    </tr></thead><tbody>
                      {mockPerformances.map(p => (
                        <tr key={p.id} className='border-b hover:bg-muted/30 text-sm'>
                          <td className='px-3 py-2 font-medium'>{p.influencerName}</td>
                          <td className='px-3 py-2'>{p.product}</td>
                          <td className='px-3 py-2 tabular-nums'>{(p.videoViews/1000).toFixed(1)}K</td>
                          <td className='px-3 py-2 tabular-nums font-semibold'>¥{p.gmv.toLocaleString()}</td>
                          <td className='px-3 py-2 tabular-nums'>{p.orders}</td>
                          <td className='px-3 py-2 tabular-nums text-destructive'>¥{p.commission}</td>
                          <td className='px-3 py-2 text-muted-foreground'>{p.date}</td>
                          <td className={`px-3 py-2 font-semibold tabular-nums ${p.roi >= 2 ? 'text-emerald-500' : 'text-amber-500'}`}>{p.roi.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ════════ 佣金结算 ════════ */}
          <TabsContent value='settlement'>
            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['达人', '结算周期', '总GMV', '总订单', '佣金比例', '佣金金额', '状态', '结算日期'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockSettlements.map((c) => (
                        <tr key={c.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-3 text-sm font-medium'>{c.influencerName}</td>
                          <td className='px-3 py-3 text-sm'>{c.period}</td>
                          <td className='px-3 py-3 text-sm tabular-nums font-medium'>¥{c.totalGMV.toLocaleString()}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{c.totalOrders}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{c.commissionRate}%</td>
                          <td className='px-3 py-3 text-sm tabular-nums font-semibold text-destructive'>¥{c.commissionAmount.toLocaleString()}</td>
                          <td className='px-3 py-3'><Badge variant={settlementStatusConfig[c.status].variant}>{settlementStatusConfig[c.status].label}</Badge></td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{c.paidDate || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ════════ AS-002: Creator Detail Sheet (Performance Portrait) ════════ */}
        <Sheet open={!!selectedCreator} onOpenChange={(o) => !o && setSelectedCreator(null)}>
          <SheetContent className='sm:max-w-xl overflow-y-auto'>
            {selectedCreator && (
              <>
                <SheetHeader>
                  <div className='flex items-center gap-3'>
                    {selectedCreator.avatar?.url ? (
                      <img src={selectedCreator.avatar.url} alt={selectedCreator.nickname} className='h-14 w-14 rounded-full object-cover border-2 border-purple-200' />
                    ) : (
                      <div className='h-14 w-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center'>
                        <UserCheck className='h-7 w-7 text-white' />
                      </div>
                    )}
                    <div>
                      <SheetTitle>{selectedCreator.nickname || selectedCreator.username}</SheetTitle>
                      <SheetDescription className='font-mono text-xs'>@{selectedCreator.username}</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className='mt-6 space-y-5'>
                  {perfLoading && (
                    <div className='flex items-center gap-2 py-8 text-muted-foreground'>
                      <Loader2 className='h-4 w-4 animate-spin' /> 加载达人详细画像...
                    </div>
                  )}

                  {!perfLoading && creatorPerf && (
                    <>
                      {/* Basic Info Card */}
                      <div className='rounded-xl border border-slate-200/60 p-4 bg-gradient-to-b from-slate-50 to-transparent'>
                        <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                          <UserCheck className='h-4 w-4 text-blue-500' /> 基本信息
                        </h4>
                        <div className='grid grid-cols-2 gap-3'>
                          {[
                            ['昵称', creatorPerf.nickname],
                            ['用户名', `@${creatorPerf.username}`],
                            ['区域', creatorPerf.selectionRegion || '—'],
                            ['简介', creatorPerf.bioDescription || '—'],
                            ['粉丝', formatFollowers(creatorPerf.followerCount)],
                            ['视频数', String(creatorPerf.ecVideoCount)],
                            ['直播数', String(creatorPerf.ecLiveCount)],
                            ...(creatorPerf.rating !== 0 ? [['评分', `${creatorPerf.rating.toFixed(1)}/10`]] : []),
                          ].map(([label, val], i) => (
                            <div key={i} className={`rounded-lg p-2.5 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-blue-50/30'}`}>
                              <p className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>{label}</p>
                              <p className='text-sm font-medium text-slate-800 line-clamp-1'>{val as string}</p>
                            </div>
                          ))}
                        </div>
                        {creatorPerf.profileTtUri && (
                          <a href={`https://www.tiktok.com/${creatorPerf.username}`} target='_blank' rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-700 transition-colors'>
                            <ExternalLink className='h-3 w-3' /> 访问 TikTok 主页
                          </a>
                        )}
                      </div>

                      {/* GMV & Revenue Card */}
                      {(creatorPerf.gmv || creatorPerf.videoGmv || creatorPerf.liveGmv) && (
                        <div className='rounded-xl border border-emerald-200/60 p-4 bg-gradient-to-b from-emerald-50/50 to-transparent'>
                          <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                            <TrendingUp className='h-4 w-4 text-emerald-500' /> GMV 表现（近30天）
                          </h4>
                          <div className='grid grid-cols-2 gap-3'>
                            {[
                              ['总 GMV', creatorPerf.gmv?.amount, creatorPerf.gmv?.currency, 'text-emerald-700'],
                              ['视频 GMV', creatorPerf.videoGmv?.amount, creatorPerf.videoGmv?.currency, 'text-blue-700'],
                              ['直播 GMV', creatorPerf.liveGmv?.amount, creatorPerf.liveGmv?.currency, 'text-purple-700'],
                              ['销量', creatorPerf.unitsSold, null, 'text-slate-700'],
                              ['GPM', creatorPerf.gpm, null, 'text-orange-700'],
                              ['视频 GPM', creatorPerf.videoGpm, null, 'text-indigo-700'],
                              ['直播 GPM', creatorPerf.liveGpm, null, 'text-pink-700'],
                              ['平均客单价', creatorPerf.avgGmvPerBuyer, null, 'text-teal-700'],
                            ].filter(([, v]) => v !== undefined && v !== 0).map(([label, val, curr, color], i) => (
                              <div key={i} className='rounded-lg p-2.5 bg-white/60'>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>{label}</p>
                                <p className={`text-sm font-bold tabular-nums ${color}`}>{curr === undefined
                                  ? formatNumber(val as number)
                                  : `${curr}${(val as number).toLocaleString()}`
                                }</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Performance Card */}
                      <div className='rounded-xl border border-blue-200/60 p-4 bg-gradient-to-b from-blue-50/50 to-transparent'>
                        <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                          <Video className='h-4 w-4 text-blue-500' /> 内容表现
                        </h4>
                        <div className='grid grid-cols-2 gap-3'>
                          {[
                            ['平均播放', formatNumber(creatorPerf.avgEcVideoPlayCount)],
                            ['平均点赞', formatNumber(creatorPerf.avgEcVideoLikeCount)],
                            ['平均评论', formatNumber(creatorPerf.avgEcVideoCommentCount)],
                            ['平均分享', formatNumber(creatorPerf.avgEcVideoShareCount)],
                            ['视频互动率', `${(creatorPerf.ecVideoEngagementRate * 100).toFixed(1)}%`],
                            ['直播 UV', formatNumber(creatorPerf.avgEcLiveUv)],
                            ['直播互动率', `${(creatorPerf.ecLiveEngagementRate * 100).toFixed(1)}%`],
                            ['合作品牌数', String(creatorPerf.brandCollaborationCount || 0)],
                          ].map(([label, val], i) => (
                            <div key={i} className='rounded-lg p-2.5 bg-white/60'>
                              <p className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>{label}</p>
                              <p className='text-sm font-bold tabular-nums text-slate-800'>{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Collaboration & Commission Card */}
                      {(creatorPerf.avgCommissionRate || creatorPerf.promotedProductNum || creatorPerf.pps !== undefined) && (
                        <div className='rounded-xl border border-purple-200/60 p-4 bg-gradient-to-b from-purple-50/50 to-transparent'>
                          <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                            <ShoppingBag className='h-4 w-4 text-purple-500' /> 合作信息
                          </h4>
                          <div className='grid grid-cols-2 gap-3'>
                            {[
                              ['平均佣金率', `${creatorPerf.avgCommissionRate?.toFixed(1) || '—'}%`],
                              ['推广商品数', String(creatorPerf.promotedProductNum || 0)],
                              ['推广评分 PPS', creatorPerf.pps !== undefined ? creatorPerf.pps.toFixed(1) : '—'],
                              ['样品发布率', creatorPerf.postRate !== undefined ? `${(creatorPerf.postRate * 100).toFixed(0)}%` : '—'],
                            ].map(([label, val], i) => (
                              <div key={i} className='rounded-lg p-2.5 bg-white/60'>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5'>{label}</p>
                                <p className='text-sm font-bold tabular-nums text-slate-800'>{val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follower Demographics */}
                      {(creatorPerf.followerGender?.length || creatorPerf.followerAge?.length || creatorPerf.followerLocation?.length) && (
                        <div className='rounded-xl border border-cyan-200/60 p-4 bg-gradient-to-b from-cyan-50/50 to-transparent'>
                          <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                            <Star className='h-4 w-4 text-cyan-500' /> 粉丝画像
                          </h4>
                          <div className='space-y-3'>
                            {creatorPerf.followerGender?.length > 0 && (
                              <div>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5'>性别分布</p>
                                <div className='flex gap-2'>
                                  {creatorPerf.followerGender.map((fg, i) => (
                                    <div key={i} className='flex-1 rounded-lg bg-white/60 p-2 text-center'>
                                      <p className='text-xs font-medium text-slate-700'>{fg.gender || '其他'}</p>
                                      <p className='text-sm font-bold tabular-nums text-cyan-600'>{(fg.percentage * 100).toFixed(0)}%</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {creatorPerf.followerAge?.length > 0 && (
                              <div>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5'>年龄分布</p>
                                <div className='flex gap-1 flex-wrap'>
                                  {creatorPerf.followerAge.slice(0, 5).map((fa, i) => (
                                    <Badge key={i} variant='outline' className='text-[10px]'>
                                      {fa.ageRange}: {(fa.percentage * 100).toFixed(0)}%
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {creatorPerf.followerLocation?.length > 0 && (
                              <div>
                                <p className='text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5'>地域分布</p>
                                <div className='flex gap-1 flex-wrap'>
                                  {creatorPerf.followerLocation.slice(0, 5).map((fl, i) => (
                                    <Badge key={i} variant='outline' className='text-[10px]'>
                                      {fl.region}: {(fl.percentage * 100).toFixed(0)}%
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Category Distribution */}
                      {creatorPerf.categoryGmvDistribution?.length > 0 && (
                        <div className='rounded-xl border border-amber-200/60 p-4 bg-gradient-to-b from-amber-50/50 to-transparent'>
                          <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                            <ShoppingBag className='h-4 w-4 text-amber-500' /> 类目 GMV 分布
                          </h4>
                          <div className='space-y-2'>
                            {creatorPerf.categoryGmvDistribution.map((cat, i) => (
                              <div key={i} className='flex items-center justify-between py-1.5 border-b border-amber-100/50 last:border-0'>
                                <span className='text-sm text-slate-700'>{cat.categoryName || cat.categoryId}</span>
                                <span className='text-sm font-semibold tabular-nums text-amber-700'>
                                  RM{cat.gmv.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!perfLoading && !creatorPerf && (
                    <div className='py-8 text-center text-sm text-muted-foreground'>
                      <p>无法加载达人详情数据</p>
                      <p className='text-xs mt-1'>可能需要 AffiliateSeller 权限或达人未公开数据</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </Main>
    </>
  )
}
