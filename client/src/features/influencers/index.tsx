import { useState } from 'react'
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Send,
  Package,
  TrendingUp,
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Video,
} from 'lucide-react'
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
import {
  AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

// ── Types ──
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

// ── Mock Data ──
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

export function InfluencersPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [batchMsgOpen, setBatchMsgOpen] = useState(false)
  const [newInfluencer, setNewInfluencer] = useState({
    name: '', tiktokId: '', followers: 0, country: '', whatsapp: '', product: '', commissionRate: 15, notes: '',
  })

  const filtered = mockInfluencers.filter((inf) =>
    inf.name.toLowerCase().includes(search.toLowerCase()) || inf.tiktokId.toLowerCase().includes(search.toLowerCase())
  )

  const addInfluencer = () => {
    setDialogOpen(false)
    setNewInfluencer({ name: '', tiktokId: '', followers: 0, country: '', whatsapp: '', product: '', commissionRate: 15, notes: '' })
  }

  const formatFollowers = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString()

  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>达人BD</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              TikTok 达人全链路管理 · 建联 → 寄样 → 带货 → 结算
            </p>
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

        <Tabs defaultValue='roster' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='roster'><Users className='mr-1.5 h-4 w-4' />达人列表</TabsTrigger>
            <TabsTrigger value='samples'><Package className='mr-1.5 h-4 w-4' />寄样管理</TabsTrigger>
            <TabsTrigger value='performance'><BarChart3 className='mr-1.5 h-4 w-4' />带货效果</TabsTrigger>
            <TabsTrigger value='settlement'><DollarSign className='mr-1.5 h-4 w-4' />佣金结算</TabsTrigger>
          </TabsList>

          {/* ── 达人列表 ── */}
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

          {/* ── 寄样管理 ── */}
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

          {/* ── 带货效果 ── */}
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

          {/* ── 佣金结算 ── */}
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
      </Main>
    </>
  )
}
