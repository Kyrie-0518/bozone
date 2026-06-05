import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Download, Filter, RefreshCw, Loader2, PackageOpen } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { api } from '@/lib/api'

const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive' }> = {
  '待付款': { label: '待付款', variant: 'secondary' },
  '审核中': { label: '审核中', variant: 'outline' },
  '待发货': { label: '待发货', variant: 'default' },
  '部分发货': { label: '部分发货', variant: 'default' },
  '待取件': { label: '待取件', variant: 'default' },
  '运输中': { label: '运输中', variant: 'outline' },
  '已签收': { label: '已签收', variant: 'default' },
  '已完成': { label: '已完成', variant: 'default' },
  '已取消': { label: '已取消', variant: 'destructive' },
  '退货申请': { label: '退货申请', variant: 'destructive' },
  '退货中': { label: '退货中', variant: 'destructive' },
  pending: { label: '待处理', variant: 'secondary' },
  shipped: { label: '已发货', variant: 'default' },
  delivered: { label: '已签收', variant: 'default' },
  cancelled: { label: '已取消', variant: 'destructive' },
  refund: { label: '退款中', variant: 'destructive' },
}

const allStatuses = ['待付款', '审核中', '待发货', '部分发货', '运输中', '已签收', '已完成', '已取消', '退货申请', '退货中']

export function OrdersPage() {
  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const qc = useQueryClient()

  // Load shops for filter
  const { data: shopsData } = useQuery({
    queryKey: ['shops'],
    queryFn: () => api.shops.list(),
  })
  const shops = shopsData?.shops || []

  // Load orders from API
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', search, statusFilter, shopFilter],
    queryFn: () => api.orders.list(
      search,
      statusFilter !== 'all' ? statusFilter : '',
      shopFilter !== 'all' ? shopFilter : '',
    ),
  })
  const orders = ordersData?.data || []

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => api.sync.orders(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })

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
            <h1 className='text-2xl font-bold tracking-tight'>订单管理</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              查看和管理所有跨境订单，共 {isLoading ? '...' : orders.length} 条
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending
                ? <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                : <RefreshCw className='mr-2 h-4 w-4' />
              }
              同步订单
            </Button>
            <Button variant='outline'>
              <Download className='mr-2 h-4 w-4' />
              导出 Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <div className='relative w-64'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='搜索订单号...'
              className='pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={shopFilter} onValueChange={setShopFilter}>
            <SelectTrigger className='w-40'>
              <Filter className='mr-1 h-3.5 w-3.5' />
              <SelectValue placeholder='店铺' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部店铺</SelectItem>
              {shops.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name || s.shopId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='状态' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              {allStatuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className='py-3'>
            <CardTitle className='text-base'>订单列表</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='flex items-center justify-center py-16 text-muted-foreground'>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' /> 加载中...
              </div>
            ) : orders.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                <PackageOpen className='mb-2 h-10 w-10' />
                <p className='text-sm'>暂无订单数据</p>
                <p className='text-xs mt-1'>点击「同步订单」从 TikTok 拉取</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      {['订单号', '店铺', '状态', '物流', '金额', '运费', '币种', '时间'].map((h) => (
                        <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => (
                      <tr
                        key={o.id}
                        className='border-b transition-colors hover:bg-muted/30 cursor-pointer'
                        onClick={() => setSelectedOrder(o)}
                      >
                        <td className='px-3 py-3 text-sm font-medium text-primary tabular-nums'>
                          {(o.orderNo || '').slice(0, 16)}...
                        </td>
                        <td className='px-3 py-3 text-sm text-muted-foreground'>
                          {shops.find((s: any) => s.id === o.shopId)?.name || `#${o.shopId || ''}`}
                        </td>
                        <td className='px-3 py-3'>
                          <Badge variant={statusConfig[o.status]?.variant || 'secondary'}>
                            {statusConfig[o.status]?.label || o.status}
                          </Badge>
                        </td>
                        <td className='px-3 py-3'>
                          <Badge variant='outline' className='text-xs'>
                            {o.logisticsStatus || '—'}
                          </Badge>
                        </td>
                        <td className='px-3 py-3 text-sm tabular-nums font-medium'>
                          {o.actualAmount?.toFixed(2) ?? '—'}
                        </td>
                        <td className='px-3 py-3 text-sm tabular-nums text-muted-foreground'>
                          {o.shippingFee?.toFixed(2) ?? '—'}
                        </td>
                        <td className='px-3 py-3 text-sm text-muted-foreground'>{o.currency || 'MYR'}</td>
                        <td className='px-3 py-3 text-sm text-muted-foreground whitespace-nowrap'>
                          {o.orderTime ? new Date(o.orderTime).toLocaleDateString('zh-CN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Detail Sheet */}
        <Sheet open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
          <SheetContent className='sm:max-w-lg'>
            {selectedOrder && (
              <>
                <SheetHeader>
                  <SheetTitle>订单详情</SheetTitle>
                  <SheetDescription>{selectedOrder.orderNo}</SheetDescription>
                </SheetHeader>
                <div className='mt-6 space-y-4'>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>店铺：</span>
                      {shops.find((s: any) => s.id === selectedOrder.shopId)?.name || '—'}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>状态：</span>
                      <Badge variant={statusConfig[selectedOrder.status]?.variant || 'secondary'} className='ml-1'>
                        {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>买家：</span>
                      {selectedOrder.buyerName || '—'}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>物流：</span>
                      {selectedOrder.logisticsStatus || '—'}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>运单号：</span>
                      {selectedOrder.trackingNo || '—'}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>承运商：</span>
                      {selectedOrder.carrier || '—'}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>下单时间：</span>
                      {selectedOrder.orderTime ? new Date(selectedOrder.orderTime).toLocaleString('zh-CN') : '—'}
                    </div>
                    <div>
                      <span className='text-muted-foreground'>发货截止：</span>
                      {selectedOrder.shipDeadline ? new Date(selectedOrder.shipDeadline).toLocaleDateString('zh-CN') : '—'}
                    </div>
                  </div>

                  <div className='rounded-lg border p-4'>
                    <h4 className='text-sm font-semibold mb-2'>支付信息</h4>
                    <div className='grid grid-cols-2 gap-y-1 text-sm'>
                      <div className='text-muted-foreground'>商品总额</div>
                      <div className='text-right tabular-nums'>{selectedOrder.itemTotal?.toFixed(2) ?? '—'}</div>
                      <div className='text-muted-foreground'>运费</div>
                      <div className='text-right tabular-nums'>{selectedOrder.shippingFee?.toFixed(2) ?? '—'}</div>
                      <div className='text-muted-foreground'>平台优惠</div>
                      <div className='text-right tabular-nums text-destructive'>-{selectedOrder.discount?.toFixed(2) ?? '0.00'}</div>
                      <div className='text-muted-foreground'>税费</div>
                      <div className='text-right tabular-nums'>{selectedOrder.taxes?.toFixed(2) ?? '—'}</div>
                      <div className='border-t pt-1 mt-1 font-semibold'>实付金额</div>
                      <div className='border-t pt-1 mt-1 text-right font-semibold tabular-nums'>
                        {selectedOrder.actualAmount?.toFixed(2) ?? '—'} {selectedOrder.currency || 'MYR'}
                      </div>
                    </div>
                  </div>

                  {selectedOrder.remark && (
                    <div className='rounded-lg border p-3 text-sm'>
                      <span className='text-muted-foreground'>备注：</span>{selectedOrder.remark}
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
