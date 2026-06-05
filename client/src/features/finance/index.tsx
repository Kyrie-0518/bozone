import { useState } from 'react'
import { Banknote, Plus, Trash2, TrendingUp, DollarSign, Calculator, RefreshCw } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ── Types ──
interface CostItem {
  id: string
  name: string
  type: 'fixed' | 'percentage' | 'per_order' | 'per_kg'
  value: number
  applyTo: 'all' | 'shop' | 'product'
  autoCalculated: boolean
}

interface OrderProfit {
  id: string
  orderNo: string
  revenue: number
  purchaseCost: number
  platformFee: number
  influencerFee: number
  adFee: number
  shippingFee: number
  otherFee: number
  netProfit: number
  margin: number
}

// ── Mock Data ──
const mockCostItems: CostItem[] = [
  { id: '1', name: 'TikTok佣金', type: 'percentage', value: 5, applyTo: 'all', autoCalculated: false },
  { id: '2', name: '达人佣金', type: 'percentage', value: 15, applyTo: 'product', autoCalculated: false },
  { id: '3', name: '跨境物流(每kg)', type: 'per_kg', value: 18, applyTo: 'all', autoCalculated: false },
  { id: '4', name: '包装费', type: 'per_order', value: 1.5, applyTo: 'all', autoCalculated: false },
  { id: '5', name: '广告费分摊', type: 'percentage', value: 8, applyTo: 'all', autoCalculated: false },
  { id: '6', name: '退货损耗', type: 'percentage', value: 2, applyTo: 'all', autoCalculated: false },
]

const mockOrderProfits: OrderProfit[] = [
  { id: '1', orderNo: '5833133557869...', revenue: 33.27, purchaseCost: 8.50, platformFee: 1.66, influencerFee: 4.99, adFee: 2.66, shippingFee: 3.35, otherFee: 1.50, netProfit: 10.61, margin: 31.9 },
  { id: '2', orderNo: '5837850537980...', revenue: 67.50, purchaseCost: 19.60, platformFee: 3.38, influencerFee: 10.13, adFee: 5.40, shippingFee: 11.35, otherFee: 1.50, netProfit: 16.14, margin: 23.9 },
  { id: '3', orderNo: '5837787679949...', revenue: 33.75, purchaseCost: 8.50, platformFee: 1.69, influencerFee: 5.06, adFee: 2.70, shippingFee: 3.35, otherFee: 1.50, netProfit: 10.95, margin: 32.4 },
  { id: '4', orderNo: '5837778806180...', revenue: 85.92, purchaseCost: 38.40, platformFee: 4.30, influencerFee: 12.89, adFee: 6.87, shippingFee: 5.16, otherFee: 1.50, netProfit: 16.80, margin: 19.6 },
  { id: '5', orderNo: '5837690012456...', revenue: 24.62, purchaseCost: 6.20, platformFee: 1.23, influencerFee: 3.69, adFee: 1.97, shippingFee: 3.87, otherFee: 1.50, netProfit: 6.16, margin: 25.0 },
  { id: '6', orderNo: '5837543289012...', revenue: 38.70, purchaseCost: 11.50, platformFee: 1.94, influencerFee: 5.81, adFee: 3.10, shippingFee: 4.50, otherFee: 1.50, netProfit: 10.35, margin: 26.7 },
]

const trendData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}日`,
  revenue: Math.round(3000 + Math.sin(i * 0.4) * 1200 + i * 80 + (Math.random() - 0.5) * 600),
  profit: Math.round(800 + Math.sin(i * 0.4) * 400 + i * 20 + (Math.random() - 0.5) * 200),
}))

const costTypeLabels: Record<CostItem['type'], string> = {
  fixed: '固定金额',
  percentage: '百分比',
  per_order: '每单',
  per_kg: '每公斤',
}

export function FinancePage() {
  const [costItems, setCostItems] = useState<CostItem[]>(mockCostItems)
  const [newItem, setNewItem] = useState<Partial<CostItem>>({
    name: '', type: 'percentage', value: 0, applyTo: 'all', autoCalculated: false,
  })
  const [rate, setRate] = useState(1.548)
  const [dialogOpen, setDialogOpen] = useState(false)

  const addCostItem = () => {
    if (!newItem.name || !newItem.value) return
    setCostItems([...costItems, { ...newItem, id: Date.now().toString(), value: Number(newItem.value), autoCalculated: false } as CostItem])
    setNewItem({ name: '', type: 'percentage', value: 0, applyTo: 'all' })
    setDialogOpen(false)
  }

  const removeCostItem = (id: string) => {
    setCostItems(costItems.filter((c) => c.id !== id))
  }

  const totals = mockOrderProfits.reduce(
    (acc, o) => ({
      revenue: acc.revenue + o.revenue,
      cost: acc.cost + o.purchaseCost + o.platformFee + o.influencerFee + o.adFee + o.shippingFee + o.otherFee,
      profit: acc.profit + o.netProfit,
    }),
    { revenue: 0, cost: 0, profit: 0 }
  )

  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold tracking-tight'>财务核算</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            费用配置 · 利润核算 · 多币种汇率 · 趋势分析
          </p>
        </div>

        <Tabs defaultValue='profit' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='profit'>
              <Calculator className='mr-1.5 h-4 w-4' />
              利润核算
            </TabsTrigger>
            <TabsTrigger value='cost-config'>
              <DollarSign className='mr-1.5 h-4 w-4' />
              费用项配置
            </TabsTrigger>
            <TabsTrigger value='exchange'>
              <RefreshCw className='mr-1.5 h-4 w-4' />
              汇率管理
            </TabsTrigger>
          </TabsList>

          {/* ── 利润核算 Tab ── */}
          <TabsContent value='profit' className='space-y-6'>
            {/* Summary Cards */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>总收入</CardTitle>
                  <Banknote className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold tabular-nums'>¥{totals.revenue.toFixed(2)}</div>
                  <p className='text-xs text-muted-foreground'>= MYR {(totals.revenue / rate).toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>总成本</CardTitle>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold tabular-nums text-destructive'>¥{totals.cost.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>净利润</CardTitle>
                  <TrendingUp className='h-4 w-4 text-emerald-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold tabular-nums text-emerald-500'>¥{totals.profit.toFixed(2)}</div>
                  <p className='text-xs text-muted-foreground'>
                    利润率 {((totals.profit / totals.revenue) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>收支趋势 · 近30天</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id='revGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#D97706' stopOpacity={0.12} />
                        <stop offset='95%' stopColor='#D97706' stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id='profGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#059669' stopOpacity={0.12} />
                        <stop offset='95%' stopColor='#059669' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                    <XAxis dataKey='day' tick={{ fontSize: 11 }} interval={6} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Area type='monotone' dataKey='revenue' stroke='#D97706' strokeWidth={2} fill='url(#revGrad)' name='收入 ¥' />
                    <Area type='monotone' dataKey='profit' stroke='#059669' strokeWidth={2} fill='url(#profGrad)' name='利润 ¥' />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Profit Table */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle>订单利润明细</CardTitle>
                  <CardDescription>汇率: 1 MYR = ¥{rate.toFixed(4)}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['订单号', '收入(¥)', '采购成本', '平台佣金', '达人佣金', '广告费', '物流费', '其他', '净利润', '利润率'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockOrderProfits.map((o) => (
                        <tr key={o.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-2.5 text-sm text-primary font-medium tabular-nums'>{o.orderNo}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums'>¥{o.revenue.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums text-destructive'>-¥{o.purchaseCost.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums text-destructive'>-¥{o.platformFee.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums text-destructive'>-¥{o.influencerFee.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums text-destructive'>-¥{o.adFee.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums text-destructive'>-¥{o.shippingFee.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums text-destructive'>-¥{o.otherFee.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm font-semibold tabular-nums text-emerald-500'>¥{o.netProfit.toFixed(2)}</td>
                          <td className='px-3 py-2.5 text-sm tabular-nums'>{o.margin}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 费用项配置 Tab ── */}
          <TabsContent value='cost-config' className='space-y-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle>费用项配置</CardTitle>
                  <CardDescription>自定义费用模板，利润核算时自动套用</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size='sm'>
                      <Plus className='mr-1.5 h-4 w-4' />
                      添加费用项
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-[450px]'>
                    <DialogHeader>
                      <DialogTitle>添加费用项</DialogTitle>
                      <DialogDescription>配置核算时自动计算的新费用项</DialogDescription>
                    </DialogHeader>
                    <div className='grid gap-4 py-4'>
                      <div className='grid gap-2'>
                        <Label>费用名称</Label>
                        <Input
                          placeholder='如: 仓储费、保险费...'
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='grid gap-2'>
                          <Label>计费方式</Label>
                          <Select
                            value={newItem.type}
                            onValueChange={(v) => setNewItem({ ...newItem, type: v as CostItem['type'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='fixed'>固定金额</SelectItem>
                              <SelectItem value='percentage'>百分比(%)</SelectItem>
                              <SelectItem value='per_order'>每单</SelectItem>
                              <SelectItem value='per_kg'>每公斤</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='grid gap-2'>
                          <Label>数值</Label>
                          <Input
                            type='number'
                            placeholder='0'
                            step='0.01'
                            value={newItem.value || ''}
                            onChange={(e) => setNewItem({ ...newItem, value: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className='grid gap-2'>
                        <Label>适用范围</Label>
                        <Select
                          value={newItem.applyTo}
                          onValueChange={(v) => setNewItem({ ...newItem, applyTo: v as CostItem['applyTo'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>全部店铺</SelectItem>
                            <SelectItem value='shop'>指定店铺</SelectItem>
                            <SelectItem value='product'>指定商品</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant='outline' onClick={() => setDialogOpen(false)}>取消</Button>
                      <Button onClick={addCostItem}>添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className='p-0'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      {['费用名称', '计费方式', '数值', '适用范围', '自动计算', '操作'].map((h) => (
                        <th key={h} className='px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {costItems.map((item) => (
                      <tr key={item.id} className='border-b'>
                        <td className='px-4 py-3 text-sm font-medium'>{item.name}</td>
                        <td className='px-4 py-3 text-sm'>{costTypeLabels[item.type]}</td>
                        <td className='px-4 py-3 text-sm tabular-nums'>
                          {item.type === 'percentage' ? `${item.value}%` : item.type === 'per_kg' ? `¥${item.value}/kg` : item.type === 'per_order' ? `¥${item.value}/单` : `¥${item.value}`}
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          <Badge variant='outline'>
                            {item.applyTo === 'all' ? '全部' : item.applyTo === 'shop' ? '按店铺' : '按商品'}
                          </Badge>
                        </td>
                        <td className='px-4 py-3'>
                          <Badge variant={item.autoCalculated ? 'default' : 'secondary'}>
                            {item.autoCalculated ? '自动' : '手动'}
                          </Badge>
                        </td>
                        <td className='px-4 py-3'>
                          <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => removeCostItem(item.id)}>
                            <Trash2 className='h-3.5 w-3.5 text-destructive' />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 汇率管理 Tab ── */}
          <TabsContent value='exchange'>
            <Card>
              <CardHeader>
                <CardTitle>汇率管理</CardTitle>
                <CardDescription>管理多币种汇率，利润统一换算为RMB</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='max-w-md space-y-4'>
                  <div className='flex items-end gap-4'>
                    <div className='grid gap-2 flex-1'>
                      <Label>1 MYR =</Label>
                      <Input
                        type='number'
                        step='0.0001'
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                      />
                    </div>
                    <div className='grid gap-2 flex-1'>
                      <Label>人民币 (RMB)</Label>
                      <Input disabled value={`¥ ${rate.toFixed(4)}`} />
                    </div>
                  </div>
                  <div className='rounded-lg border p-4 bg-muted/30'>
                    <p className='text-sm text-muted-foreground'>
                      换算示例: MYR 100.00 = ¥ {(100 * rate).toFixed(2)}
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      未来版本将支持自动获取实时汇率
                    </p>
                  </div>
                  <Button>保存汇率</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
