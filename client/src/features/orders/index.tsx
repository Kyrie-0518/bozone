import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Download, RefreshCw, Loader2, PackageOpen,
  ShoppingCart, Truck, AlertCircle, CheckCircle2, Clock,
  Eye, Receipt,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { api } from '@/lib/api'

// ── Status config (TikTok standard + Chinese labels) ──
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  UNPAID:           { label: '待付款', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Clock className='h-3 w-3' /> },
  ON_HOLD:          { label: '审核中', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle className='h-3 w-3' /> },
  AWAITING_SHIPMENT:{ label: '待发货', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <PackageOpen className='h-3 w-3' /> },
  PARTIALLY_SHIPPING:{ label: '部分发货', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Truck className='h-3 w-3' /> },
  AWAITING_COLLECTION:{ label: '待取件', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <PackageOpen className='h-3 w-3' /> },
  IN_TRANSIT:       { label: '运输中', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <Truck className='h-3 w-3' /> },
  DELIVERED:         { label: '已签收', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className='h-3 w-3' /> },
  COMPLETED:         { label: '已完成', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className='h-3 w-3' /> },
  CANCELLED:         { label: '已取消', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className='h-3 w-3' /> },
  RETURN_REQUESTED:  { label: '退货申请', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <AlertCircle className='h-3 w-3' /> },
  RETURN_IN_PROGRESS:{ label: '退货中', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <AlertCircle className='h-3 w-3' /> },
}

// ── Tab filter config ──
const statusTabs = [
  { key: 'all',        label: '全部',       statusKeys: [] },
  { key: 'UNPAID',     label: '待支付',     statusKeys: ['UNPAID'] },
  { key: 'PENDING',    label: '待发货',     statusKeys: ['AWAITING_SHIPMENT','ON_HOLD','PARTIALLY_SHIPPING'] },
  { key: 'SHIPPED',    label: '已发货',     statusKeys: ['IN_TRANSIT','AWAITING_COLLECTION'] },
  { key: 'COMPLETED',  label: '已完结',     statusKeys: ['COMPLETED','DELIVERED'] },
  { key: 'CANCELLED',  label: '申请取消',   statusKeys: ['CANCELLED'] },
  { key: 'RETURN',     label: '申请退款',   statusKeys: ['RETURN_REQUESTED','RETURN_IN_PROGRESS'] },
]

export function OrdersPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const qc = useQueryClient()

  // Load shops
  const { data: shopsData } = useQuery({ queryKey: ['shops'], queryFn: () => api.shops.list() })
  const shops = shopsData?.shops || []

  // Load orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', search, activeTab],
    queryFn: () => api.orders.list(search, activeTab === 'all' ? '' : activeTab, ''),
  })
  const orders = ordersData?.data || []

  const syncMutation = useMutation({
    mutationFn: () => api.sync.orders(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }) },
  })

  // O-004: Fetch price detail from TikTok when order selected
  const { data: priceDetail, isLoading: priceLoading } = useQuery({
    queryKey: ['order-price-detail', selectedOrder?.id],
    queryFn: () => api.get(`/orders/${selectedOrder.id}/price-detail`).then((r: any) => r.data),
    enabled: !!selectedOrder,
    staleTime: 5 * 60_000, // cache 5 min
  })

  // ── Computed stats ──
  const stats = useMemo(() => {
    const todayPending = orders.filter(o => ['UNPAID'].includes(o.status)).length
    const cancelReq   = orders.filter(o => ['CANCELLED'].includes(o.status)).length
    const returnReq   = orders.filter(o => ['RETURN_REQUESTED','RETURN_IN_PROGRESS'].includes(o.status)).length
    const dailyCancel = orders.filter(o => ['CANCELLED'].includes(o.status)).length
    const completed   = orders.filter(o => ['COMPLETED','DELIVERED'].includes(o.status)).length
    return { todayPending, cancelReq, returnReq, dailyCancel, completed }
  }, [orders])

  return (
    <>
      <Header>
        <div className='me-auto' />
        <ThemeSwitch /><ConfigDrawer /><ProfileDropdown />
      </Header>

      <Main>
        {/* ═══ Header ═══ */}
        <div className='mb-5 flex flex-wrap items-center justify-between gap-4'>
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
              刷新
            </Button>
            <Button variant='outline' size='sm'><Download className='mr-1.5 h-3.5 w-3.5' />AI 导入</Button>
          </div>
        </div>

        {/* ═══ Stat Cards — 5 white cards with colored values ═══ */}
        <div className='mb-5 grid grid-cols-5 gap-3'>
          {[
            { label: '今日待发货', value: String(stats.todayPending), color: 'text-blue-600' },
            { label: '申请取消',   value: String(stats.cancelReq),   color: 'text-amber-500' },
            { label: '退货退款',   value: String(stats.returnReq),   color: 'text-red-500' },
            { label: '日动取消',   value: String(stats.dailyCancel), color: 'text-red-500' },
            { label: '已完结',     value: String(stats.completed),   color: 'text-emerald-500' },
          ].map((stat, i) => (
            <Card key={i} className='border-slate-200/60 shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-4'>
                <p className='text-[11px] font-medium text-muted-foreground mb-1'>{stat.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══ Status Tabs + Search Bar ═══ */}
        <div className='mb-4 space-y-3'>
          {/* Horizontal tab buttons with red badges */}
          <div className='flex flex-wrap items-center gap-2'>
            {statusTabs.map(tab => {
              const isActive = activeTab === tab.key
              let count = 0
              if (tab.key !== 'all') {
                if (tab.key === 'UNPAID') count = orders.filter(o => o.status === 'UNPAID').length
                else if (tab.key === 'PENDING') count = orders.filter(o => tab.statusKeys.includes(o.status)).length
                else if (tab.key === 'SHIPPED') count = orders.filter(o => tab.statusKeys.includes(o.status)).length
                else if (tab.key === 'COMPLETED') count = orders.filter(o => tab.statusKeys.includes(o.status)).length
                else if (tab.key === 'CANCELLED') count = orders.filter(o => o.status === 'CANCELLED').length
                else if (tab.key === 'RETURN') count = orders.filter(o => tab.statusKeys.includes(o.status)).length
              }
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className='ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none'>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search row with 🔍 button + 📤 export */}
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex-1 min-w-[240px] max-w-sm'>
              <Input
                placeholder='搜索订单号 / 买家名称'
                className='h-9 pr-20 bg-white border-slate-200/80 focus:border-blue-400'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).form?.requestSubmit(); } }}
              />
              <button
                className='absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors'
              >
                <Search className='h-3.5 w-3.5' /> 搜索
              </button>
            </div>
            <SelectBox placeholder='全部店铺' options={['HomeLife Co','FreshGuard']} />
            <Button variant='outline' size='sm' className='gap-1.5'><Download className='h-3.5 w-3.5' />导出</Button>
          </div>
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
                <p className='text-sm mt-1'>点击「刷新」从 TikTok Shop 拉取最新订单</p>
                <Button variant='outline' size='sm' className='mt-4' onClick={() => syncMutation.mutate()}>
                  <RefreshCw className='mr-1.5 h-3.5 w-3.5' /> 立即同步
                </Button>
              </div>
            ) : (
              <table className='w-full'>
                <thead>
                  <tr className='bg-slate-50/80 border-b border-slate-200/60'>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>商品信息</th>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>订单编号</th>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>买家</th>
                    <th className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500'>实付金额</th>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>状态</th>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>店铺</th>
                    <th className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500'>下单时间</th>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>物流</th>
                    <th className='px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500'>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => {
                    const cfg = statusConfig[o.status] || statusConfig['IN_TRANSIT']
                    const item = (o.items && o.items.length > 0) ? o.items[0] : null
                    return (
                      <tr key={o.id} className='group border-b border-slate-100/50 transition-colors hover:bg-blue-50/30'>
                        {/* Product info: image + name + quantity */}
                        <td className='px-4 py-3 min-w-[220px]'>
                          <div className='flex items-start gap-2.5'>
                            {item?.image ? (
                              <img src={item.image} alt={item.productName || ''} className='h-10 w-10 rounded-lg object-cover shrink-0 border border-slate-200' loading='lazy' />
                            ) : (
                              <div className='h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 shrink-0 flex items-center justify-center text-lg'>📦</div>
                            )}
                            <div className='min-w-0 flex-1'>
                              <p className='text-xs font-medium text-slate-700 line-clamp-2 leading-snug'>{item?.productName || '—'}</p>
                              <span className='inline-flex items-center gap-0.5 mt-0.5 text-[10px] text-muted-foreground'>
                                量 ×{item?.quantity ?? 1}
                                {item?.sku && <span className='ml-1 truncate max-w-[120px]'>({String(item.sku).slice(0, 30)})</span>}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Order No — full */}
                        <td className='px-4 py-3'><span className='font-mono text-xs text-blue-600 font-medium'>{o.orderNo || '—'}</span></td>

                        {/* Buyer */}
                        <td className='px-4 py-3'><span className='text-sm text-slate-700'>{o.buyerName || '—'}</span></td>

                        {/* Amount */}
                        <td className='px-4 py-3 text-right'><span className='font-semibold text-blue-600 tabular-nums'>RM {Number(o.actualAmount || 0).toFixed(2)}</span></td>

                        {/* Status Badge */}
                        <td className='px-4 py-3'><span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cfg?.color || 'bg-gray-100 text-gray-700'}`}>{cfg?.icon}{cfg?.label || o.status}</span></td>

                        {/* Shop */}
                        <td className='px-4 py-3'><span className='text-xs text-slate-600'>{shops.find(s => s.id === o.shopId)?.name || '—'}</span></td>

                        {/* Time — full datetime */}
                        <td className='px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap'>
                          {o.orderTime
                            ? new Date(o.orderTime).toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })
                            : (o.createdAt ? new Date(o.createdAt).toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—')
                          }
                        </td>

                        {/* Logistics: carrier + trackingNo */}
                        <td className='px-4 py-3'>
                          {o.trackingNo
                            ? (<><span className='text-[11px] font-medium text-slate-700'>{o.carrier || ''}</span><br/><span className='font-mono text-[10px] text-blue-500'>{String(o.trackingNo).slice(-12)}</span></>)
                            : (o.logisticsStatus ? <span className='text-[11px] text-slate-500'>{o.logisticsStatus}</span> : <span className='text-muted-foreground text-[11px]'>—</span>)
                          }
                        </td>

                        {/* Action */}
                        <td className='px-4 py-3 text-center'>
                          <button onClick={() => setSelectedOrder(o)} className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 transition-colors'>
                            <Eye className='h-3.5 w-3.5' /> 详情
                          </button>
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
                      ].map(([label, val], i) => (
                        <div key={i} className='flex justify-between items-center py-1.5 border-b border-slate-100/50 last:border-0'>
                          <span className='text-slate-500'>{label}</span>
                          <span className={`tabular-nums font-medium ${(val as string).startsWith('-') ? 'text-destructive' : 'text-slate-700'}`}>{val as string}</span>
                        </div>
                      ))}
                      <div className='flex justify-between items-center pt-2 border-t-2 border-t-slate-200 mt-1'>
                        <span className='font-bold text-slate-800'>实付金额</span>
                        <span className='text-lg font-bold tabular-nums text-blue-600'>
                          RM{selectedOrder.actualAmount?.toFixed(2)} {selectedOrder.currency || 'MYR'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* O-004: TikTok Price Detail (from V202407 API) */}
                  <div className='rounded-xl border border-slate-200/60 p-4 bg-gradient-to-b from-blue-50/50 to-transparent'>
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='text-sm font-semibold text-slate-700 flex items-center gap-2'>
                        <span className='h-1.5 w-1.5 rounded-full bg-blue-500'></span> 价格明细
                        <span className='text-[10px] font-normal text-muted-foreground'>TikTok API</span>
                      </h4>
                      {priceDetail && (
                        <span className='text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium'>实时</span>
                      )}
                    </div>

                    {priceLoading ? (
                      <div className='flex items-center gap-2 py-6 text-muted-foreground'>
                        <Loader2 className='h-4 w-4 animate-spin' /> 正在拉取价格明细...
                      </div>
                    ) : priceDetail ? (
                      <div className='space-y-3 text-sm'>
                        {/* 商品价格 */}
                        <div className='space-y-1.5'>
                          <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>商品</p>
                          {[
                            ['商品原价 (MSRP)', priceDetail.skuListPrice],
                            ['促销价', priceDetail.skuSalePrice, true],
                            ['平台折扣', `-${priceDetail.subtotalDeductionPlatform || 0}`],
                            ['卖家折扣', `-${priceDetail.subtotalDeductionSeller || 0}`],
                            ['商品税', priceDetail.subtotalTaxAmount],
                          ].map(([label, val, highlight], i) => (
                            <div key={i} className={`flex justify-between items-center py-0.5 ${highlight ? 'font-medium text-blue-700' : ''}`}>
                              <span className='text-slate-500'>{label}</span>
                              <span className='tabular-nums'>{typeof val === 'number' ? `RM${val.toFixed(2)}` : String(val)}</span>
                            </div>
                          ))}
                        </div>

                        {/* 运费 */}
                        {(priceDetail.shippingSalePrice || priceDetail.shippingFeeDeductionPlatform) && (
                          <>
                            <div className='border-t border-slate-150 pt-2 space-y-1.5'>
                              <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>运费</p>
                              {[
                                ['原始运费', priceDetail.shippingListPrice],
                                ['实际运费', priceDetail.shippingSalePrice, true],
                                ['平台运费减免', priceDetail.shippingFeeDeductionPlatform],
                                ['卖家运费减免', priceDetail.shippingFeeDeductionSeller],
                              ].filter(([, v]) => v).map(([label, val, highlight], i) => (
                                <div key={i} className={`flex justify-between py-0.5 ${highlight ? 'font-medium' : ''}`}>
                                  <span className='text-slate-500'>{label}</span>
                                  <span className='tabular-nums'>{typeof val === 'number' ? `RM${val.toFixed(2)}` : String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* 优惠券 & 税费 */}
                        {(priceDetail.voucherDeductionPlatform || priceDetail.taxAmount) && (
                          <>
                            <div className='border-t border-slate-150 pt-2 space-y-1.5'>
                              <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>优惠与税费</p>
                              {[
                                ...(priceDetail.voucherDeductionPlatform ? [['平台优惠券', `-${priceDetail.voucherDeductionPlatform}`, 'text-red-600'] as const] : []),
                                ...(priceDetail.voucherDeductionSeller ? [['卖家优惠券', `-${priceDetail.voucherDeductionSeller}`, 'text-red-600'] as const] : []),
                                ...(priceDetail.taxAmount ? [['税费', priceDetail.taxAmount] as const] : []),
                              ].map(([label, val, color], i) => (
                                <div key={i} className={`flex justify-between py-0.5 ${color || ''}`}>
                                  <span className='text-slate-500'>{label}</span>
                                  <span className='tabular-nums'>{typeof val === 'number' ? `RM${val.toFixed(2)}` : String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* 汇总行 */}
                        <div className='border-t-2 border-t-slate-200 pt-2 mt-1 flex justify-between'>
                          <span className='font-bold text-slate-800 text-xs'>订单总计 (TikTok)</span>
                          <span className='font-bold tabular-nums text-sm text-blue-600'>
                            RM{(priceDetail.skuSalePrice ?? 0 + (priceDetail.shippingSalePrice ?? 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : selectedOrder && !priceLoading ? (
                      <div className='py-4 text-center text-[12px] text-muted-foreground'>
                        <Receipt className='mx-auto mb-1 h-5 w-5 opacity-30' />
                        暂无价格明细（需 TikTok 返回数据）
                      </div>
                    ) : null}
                  </div>

                  {selectedOrder.remark && (
                    <div className='rounded-lg border border-amber-200/60 bg-amber-50/30 p-3 text-sm'>
                      <span className='text-amber-700 font-medium'>备注：</span>
                      <span className='text-slate-700 ml-1'>{selectedOrder.remark}</span>
                    </div>
                  )}

                  {/* O-003: Order Items with Images */}
                  {(selectedOrder.items && selectedOrder.items.length > 0) && (
                    <div className='rounded-xl border border-slate-200/60 p-4'>
                      <h4 className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                        <span className='h-1.5 w-1.5 rounded-full bg-blue-500'></span> 商品明细 ({selectedOrder.items.length})
                      </h4>
                      <div className='space-y-2.5'>
                        {selectedOrder.items.map((item: any, idx: number) => (
                          <div key={item?.id || idx} className='flex items-center gap-3 rounded-lg p-2.5 bg-slate-50/60 hover:bg-blue-50/40 transition-colors'>
                            {item.image ? (
                              <img src={item.image} alt={item.productName || ''} className='h-12 w-12 rounded-lg object-cover shrink-0 border border-slate-200' />
                            ) : (
                              <div className='h-12 w-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 shrink-0 flex items-center justify-center text-xl'>📦</div>
                            )}
                            <div className='min-w-0 flex-1'>
                              <p className='text-xs font-medium text-slate-800 line-clamp-1'>{item.productName || '—'}</p>
                              <p className='text-[11px] text-muted-foreground mt-0.5'>{item.sku || '—'} · ×{item.quantity ?? 1}</p>
                            </div>
                            <div className='text-right shrink-0'>
                              <p className='text-sm font-semibold text-slate-800 tabular-nums'>RM{Number(item.unitPrice || 0).toFixed(2)}</p>
                              <p className='text-[10px] text-muted-foreground tabular-nums'>小计 RM{(Number(item.subtotal || 0)).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
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

// ── Lightweight Select component (inline, no shadcn dependency for this context) ──
function SelectBox({ placeholder, options }: { placeholder: string; options: string[] }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='h-9 w-[140px] rounded-md border border-slate-200/80 bg-white px-3 text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-between'
      >
        <span>{value || placeholder}</span>
      </button>
      {open && (
        <>
          <div className='fixed inset-0 z-30' onClick={() => setOpen(false)} />
          <div className='absolute top-full left-0 z-40 mt-1 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1 animate-in fade-in zoom-in-95'>
            <button
              type='button'
              className='block w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700'
              onClick={() => { setValue(''); setOpen(false) }}
            >
              全部店铺
            </button>
            {options.map(opt => (
              <button
                key={opt}
                type='button'
                className='block w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                onClick={() => { setValue(opt); setOpen(false) }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
