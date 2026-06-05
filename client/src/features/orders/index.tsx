import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Download, RefreshCw, Loader2, PackageOpen,
  ShoppingCart, Truck, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { api } from '@/lib/api'

// ── Status config (TikTok standard + Chinese labels) ──
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  UNPAID:           { label: '待付款', color: 'bg-slate-100 text-slate-700', icon: <Clock className='h-3.5 w-3.5' /> },
  ON_HOLD:          { label: '审核中', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle className='h-3.5 w-3.5' /> },
  AWAITING_SHIPMENT:{ label: '待发货', color: 'bg-blue-100 text-blue-700', icon: <PackageOpen className='h-3.5 w-3.5' /> },
  PARTIALLY_SHIPPING:{ label: '部分发货', color: 'bg-blue-100 text-blue-700', icon: <Truck className='h-3.5 w-3.5' /> },
  AWAITING_COLLECTION:{ label: '待取件', color: 'bg-cyan-100 text-cyan-700', icon: <PackageOpen className='h-3.5 w-3.5' /> },
  IN_TRANSIT:       { label: '运输中', color: 'bg-indigo-100 text-indigo-700', icon: <Truck className='h-3.5 w-3.5' /> },
  DELIVERED:         { label: '已签收', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className='h-3.5 w-3.5' /> },
  COMPLETED:         { label: '已完成', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className='h-3.5 w-3.5' /> },
  CANCELLED:         { label: '已取消', color: 'bg-red-100 text-red-700', icon: <AlertCircle className='h-3.5 w-3.5' /> },
  RETURN_REQUESTED:  { label: '退货申请', color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className='h-3.5 w-3.5' /> },
  RETURN_IN_PROGRESS:{ label: '退货中', color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className='h-3.5 w-3.5' /> },
}

const statusMap: Record<string, string> = {
  '待付款': 'UNPAID', '审核中': 'ON_HOLD', '待发货': 'AWAITING_SHIPMENT',
  '部分发货': 'PARTIALLY_SHIPPING', '待取件': 'AWAITING_COLLECTION',
  '运输中': 'IN_TRANSIT', '已签收': 'DELIVERED', '已完成': 'COMPLETED',
  '已取消': 'CANCELLED', '退货申请': 'RETURN_REQUESTED', '退货中': 'RETURN_IN_PROGRESS',
}
const allStatuses = Object.keys(statusMap)

export function OrdersPage() {
  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const qc = useQueryClient()

  // Load shops for filter
  const { data: shopsData } = useQuery({ queryKey: ['shops'], queryFn: () => api.shops.list() })
  const shops = shopsData?.shops || []

  // Load orders from API
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', search, statusFilter, shopFilter],
    queryFn: () => api.orders.list(search, statusFilter !== 'all' ? statusFilter : '', shopFilter !== 'all' ? shopFilter : ''),
  })
  const orders = ordersData?.data || []

  const syncMutation = useMutation({
    mutationFn: () => api.sync.orders(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }) },
  })

  // ── Computed stats ──
  const stats = useMemo(() => {
    const total = orders.length
    const revenue = orders.reduce((s, o) => s + (Number(o.actualAmount) || 0), 0)
    const pending = orders.filter(o => ['UNPAID','AWAITING_SHIPMENT'].includes(o.status)).length
    const inTransit = orders.filter(o => ['IN_TRANSIT','PARTIALLY_SHIPPING'].includes(o.status).length)
    return { total, revenue, pending, inTransit }
  }, [orders])

  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch /><ConfigDrawer /><ProfileDropdown />
      </Header>

      <Main>
        {/* ═══ Header ═══ */}
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-200'>
              <ShoppingCart className='h-5 w-5 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-slate-800'>订单管理</h1>
              <p className='text-xs text-muted-foreground mt-0.5'>共 {isLoading ? '...' : orders.length.toLocaleString()} 条订单 · 实时同步 TikTok Shop</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' /> : <RefreshCw className='mr-1.5 h-3.5 w-3.5' />}
              同步订单
            </Button>
            <Button variant='outline' size='sm'><Download className='mr-1.5 h-3.5 w-3.5' />导出</Button>
          </div>
        </div>

        {/* ═══ Stat Cards ═══ */}
        <div className='mb-5 grid grid-cols-4 gap-3'>
          {[
            { label: '总订单数', value: stats.total.toLocaleString(), sub: `待处理 ${stats.pending}`, color: 'from-blue-500 to-blue-600', bg: 'blue-50', icon: ShoppingCart },
            { label: '总营收', value: `¥${stats.revenue.toFixed(0)}`, sub: 'MYR 原币种合计', color: 'from-emerald-500 to-emerald-600', bg: 'emerald-50', icon: CheckCircle2 },
            { label: '待处理', value: String(stats.pending), sub: `${((stats.pending / Math.max(stats.total,1)) * 100).toFixed(0)}%`, color: 'from-amber-500 to-amber-600', bg: 'amber-50', icon: Clock },
            { label: '配送中', value: String(stats.inTransit), sub: '物流进行中', color: 'from-indigo-500 to-indigo-600', bg: 'indigo-50', icon: Truck },
          ].map((stat, i) => (
            <Card key={i} className={`border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${stat.bg}`}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>{stat.label}</span>
                  <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className='h-3.5 w-3.5 text-white' />
                  </div>
                </div>
                <p className='text-xl font-bold tabular-nums text-slate-800'>{stat.value}</p>
                <p className='text-[11px] text-muted-foreground mt-0.5'>{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══ Filters Bar ═══ */}
        <div className='mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50/80 p-3 border border-slate-200/60'>
          <div className='relative flex-1 min-w-[200px] max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
            <Input placeholder='搜索订单号 / 买家名...' className='pl-9 h-9 bg-white border-slate-200/80 focus:border-blue-400' value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={shopFilter} onValueChange={setShopFilter}>
            <SelectTrigger className='h-9 w-[140px] bg-white border-slate-200/80'><SelectValue placeholder='全部店铺' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>🏪 全部店铺</SelectItem>
              {shops.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{(s.name || s.shopId).slice(0, 12)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='h-9 w-[130px] bg-white border-slate-200/80'><SelectValue placeholder='全部状态' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>📊 全部状态</SelectItem>
              {allStatuses.map(s => {
                const cfg = statusConfig[statusMap[s] || '']
                return <SelectItem key={s} value={s}>{cfg?.label || s}</SelectItem>
              })}
            </SelectContent>
          </Select>
        </div>

        {/* ═══ Table ═══ */}
        <Card className='border-slate-200/60 shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            {isLoading ? (
              <div className='flex items-center justify-center py-20 text-muted-foreground'>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' /> 加载订单数据...
              </div>
            ) : orders.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                <PackageOpen className='mb-3 h-12 w-12 opacity-40' />
                <p className='font-medium'>暂无订单数据</p>
                <p className='text-sm mt-1'>点击「同步订单」从 TikTok Shop 拉取最新订单</p>
                <Button variant='outline' size='sm' className='mt-4' onClick={() => syncMutation.mutate()}>
                  <RefreshCw className='mr-1.5 h-3.5 w-3.5' /> 立即同步
                </Button>
              </div>
            ) : (
              <table className='w-full'>
                <thead>
                  <tr className='bg-slate-50/80 border-b border-slate-200/60'>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>订单号</th>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>买家 / 店铺</th>
                    <th className='px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500'>状态</th>
                    <th className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500'>金额</th>
                    <th className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500'>运费</th>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>物流</th>
                    <th className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500'>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => {
                    const cfg = statusConfig[o.status] || statusConfig['IN_TRANSIT']
                    return (
                      <tr key={o.id} className='group border-b border-slate-100/50 transition-colors hover:bg-blue-50/30 cursor-pointer' onClick={() => setSelectedOrder(o)}>
                        <td className='px-4 py-3'>
                          <span className='font-mono text-xs text-blue-600 font-medium'>{(o.orderNo || '').slice(-14)}</span>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='text-sm font-medium text-slate-700 max-w-[140px] truncate'>{o.buyerName || '—'}</div>
                          <div className='text-[11px] text-muted-foreground'>{shops.find(s => s.id === o.shopId)?.name?.slice(0,10) || ''}</div>
                        </td>
                        <td className='px-4 py-3'>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${cfg?.color || 'bg-gray-100 text-gray-700'}`}>
                            {cfg?.icon}{cfg?.label || o.status}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <span className='font-semibold text-slate-800 tabular-nums'>{Number(o.actualAmount || 0).toFixed(2)}</span>
                          <span className='text-[10px] text-muted-foreground ml-1'>{o.currency || 'MYR'}</span>
                        </td>
                        <td className='px-4 py-3 text-right tabular-nums text-slate-600 text-sm'>{Number(o.shippingFee || 0).toFixed(2)}</td>
                        <td className='px-4 py-3'>
                          <span className='text-[11px] text-slate-500'>{o.logisticsStatus || o.carrier || '—'}</span>
                          {o.trackingNo && <span className='block text-[10px] text-blue-500 font-mono mt-0.5 max-w-[120px] truncate'>{o.trackingNo}</span>}
                        </td>
                        <td className='px-4 py-3 text-right text-[11px] text-slate-500 whitespace-nowrap'>
                          {o.orderTime ? new Date(o.orderTime).toLocaleDateString('zh-CN', { month:'short', day:'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* ═══ Order Detail Sheet ═══ */}
        <Sheet open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
          <SheetContent className='sm:max-w-xl'>
            {selectedOrder && (
              <>
                <SheetHeader>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center'>
                      <ShoppingCart className='h-5 w-5 text-white' />
                    </div>
                    <div>
                      <SheetTitle>订单详情</SheetTitle>
                      <SheetDescription className='font-mono text-xs'>{selectedOrder.orderNo}</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className='mt-6 space-y-5'>
                  {/* Status & Basic Info */}
                  <div className='grid grid-cols-2 gap-3'>
                    {[
                      ['店铺', shops.find((s: any) => s.id === selectedOrder.shopId)?.name || '—'],
                      ['状态', selectedOrder.status],
                      ['买家', selectedOrder.buyerName || '—'],
                      ['下单时间', selectedOrder.orderTime ? new Date(selectedOrder.orderTime).toLocaleString('zh-CN') : '—'],
                      ['承运商', selectedOrder.carrier || '—'],
                      ['运单号', selectedOrder.trackingNo || '—'],
                    ].map(([label, val], i) => (
                      <div key={i} className={`rounded-lg p-3 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-blue-50/30'}`}>
                        <p className='text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5'>{label}</p>
                        <p className='text-sm font-medium text-slate-800'>{val as string}</p>
                      </div>
                    ))}
                  </div>

                  {/* Payment Summary Card */}
                  <div className='rounded-xl border border-slate-200/60 p-4 bg-gradient-to-b from-slate-50 to-transparent'>
                    <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                      <span className='h-1.5 w-1.5 rounded-full bg-emerald-500'></span> 支付明细
                    </h4>
                    <div className='space-y-2 text-sm'>
                      {[
                        ['商品总额', `${selectedOrder.itemTotal?.toFixed(2) || '0.00'} ${selectedOrder.currency || 'MYR'}`],
                        ['运费', `-${selectedOrder.shippingFee?.toFixed(2) || '0.00'} ${selectedOrder.currency || 'MYR'}`],
                        ['平台优惠', `-${selectedOrder.discount?.toFixed(2) || '0.00'} ${selectedOrder.currency || 'MYR'}`, true],
                        ['税费', `${selectedOrder.taxes?.toFixed(2) || '0.00'} ${selectedOrder.currency || 'MYR'}`],
                      ]                      .map(([label, val], i) => (
                        <div key={i} className='flex justify-between items-center py-1.5 border-b border-slate-100/50 last:border-0'>
                          <span className='text-slate-500'>{label}</span>
                          <span className={`tabular-nums font-medium ${label === '平台优惠' ? 'text-destructive' : 'text-slate-700'}`}>{val as string}</span>
                        </div>
                      ))}
                      <div className='flex justify-between items-center pt-2 border-t-2 border-t-slate-200 mt-1'>
                        <span className='font-bold text-slate-800'>实付金额</span>
                        <span className='text-lg font-bold tabular-nums text-blue-600'>
                          ¥{selectedOrder.actualAmount?.toFixed(2)} {selectedOrder.currency || 'MYR'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.remark && (
                    <div className='rounded-lg border border-amber-200/60 bg-amber-50/30 p-3 text-sm'>
                      <span className='text-amber-700 font-medium'>备注：</span>
                      <span className='text-slate-700 ml-1'>{selectedOrder.remark}</span>
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
