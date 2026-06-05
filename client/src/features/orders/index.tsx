import { useState } from 'react'
import { Search, ShoppingCart, Download, Filter } from 'lucide-react'
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
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refund'
type ShopFilter = 'all' | 'TikTok MY' | 'Shopee MY' | 'Lazada MY'

interface Order {
  id: string
  orderNo: string
  shop: string
  product: string
  sku: string
  quantity: number
  amount: number
  currency: string
  shippingCost: number
  profit: number
  profitMargin: number
  status: OrderStatus
  time: string
  buyerNote?: string
}

const mockOrders: Order[] = [
  { id: '1', orderNo: '5833133557869629', shop: 'TikTok MY', product: '冰箱除味剂', sku: 'FRESH-001', quantity: 1, amount: 21.49, currency: 'MYR', shippingCost: 3.35, profit: 22.12, profitMargin: 34.5, status: 'shipped', time: '2026-05-28 14:22', buyerNote: '请发顺丰' },
  { id: '2', orderNo: '5837850537980657', shop: 'TikTok MY', product: '多功能清洁膏', sku: 'CLEAN-003', quantity: 2, amount: 43.60, currency: 'MYR', shippingCost: 11.35, profit: 29.38, profitMargin: 28.1, status: 'shipped', time: '2026-05-28 12:15' },
  { id: '3', orderNo: '5837787679949996', shop: 'Shopee MY', product: '冰箱除味剂', sku: 'FRESH-001', quantity: 1, amount: 21.80, currency: 'MYR', shippingCost: 3.35, profit: 22.55, profitMargin: 35.8, status: 'processing', time: '2026-05-28 09:48' },
  { id: '4', orderNo: '5837778806180111', shop: 'TikTok MY', product: '洗衣机清洁片', sku: 'WASH-007', quantity: 3, amount: 55.50, currency: 'MYR', shippingCost: 5.16, profit: -4.31, profitMargin: -2.6, status: 'pending', time: '2026-05-27 22:30' },
  { id: '5', orderNo: '5837690012456702', shop: 'TikTok MY', product: '冰箱除味盒', sku: 'FRESH-002', quantity: 1, amount: 15.90, currency: 'MYR', shippingCost: 3.87, profit: 8.92, profitMargin: 21.3, status: 'delivered', time: '2026-05-27 18:05' },
  { id: '6', orderNo: '5837543289012345', shop: 'Lazada MY', product: '厨房清洁剂', sku: 'KIT-009', quantity: 1, amount: 25.00, currency: 'MYR', shippingCost: 4.50, profit: 18.20, profitMargin: 30.5, status: 'delivered', time: '2026-05-27 15:40' },
  { id: '7', orderNo: '5837489012345678', shop: 'Shopee MY', product: '除味棒', sku: 'FRESH-005', quantity: 2, amount: 25.00, currency: 'MYR', shippingCost: 2.80, profit: 12.30, profitMargin: 22.8, status: 'shipped', time: '2026-05-27 11:22' },
  { id: '8', orderNo: '5837234567890123', shop: 'TikTok MY', product: '多功能清洁膏', sku: 'CLEAN-003', quantity: 1, amount: 21.80, currency: 'MYR', shippingCost: 11.35, profit: 14.69, profitMargin: 25.6, status: 'cancelled', time: '2026-05-27 08:15', buyerNote: '买家取消' },
  { id: '9', orderNo: '5837102345678901', shop: 'TikTok MY', product: '管道疏通剂', sku: 'PIPE-012', quantity: 1, amount: 12.50, currency: 'MYR', shippingCost: 2.50, profit: 5.80, profitMargin: 18.2, status: 'pending', time: '2026-05-27 06:30' },
  { id: '10', orderNo: '5836987654321098', shop: 'Shopee MY', product: '玻璃清洁液', sku: 'GLASS-015', quantity: 1, amount: 18.00, currency: 'MYR', shippingCost: 3.00, profit: 11.50, profitMargin: 28.0, status: 'refund', time: '2026-05-26 20:45', buyerNote: '商品破损' },
]

const statusConfig: Record<OrderStatus, { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive' }> = {
  pending: { label: '待处理', variant: 'secondary' },
  processing: { label: '处理中', variant: 'outline' },
  shipped: { label: '已发货', variant: 'default' },
  delivered: { label: '已签收', variant: 'default' },
  cancelled: { label: '已取消', variant: 'destructive' },
  refund: { label: '退款中', variant: 'destructive' },
}

const shops: ShopFilter[] = ['all', 'TikTok MY', 'Shopee MY', 'Lazada MY']
const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refund']

export function OrdersPage() {
  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState<ShopFilter>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = mockOrders.filter((o) => {
    if (search && !o.orderNo.includes(search) && !o.product.includes(search)) return false
    if (shopFilter !== 'all' && o.shop !== shopFilter) return false
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    return true
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
              查看和管理所有跨境订单，共 {filtered.length} 条
            </p>
          </div>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            导出 Excel
          </Button>
        </div>

        {/* Filters */}
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <div className='relative w-64'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='搜索订单号或产品...'
              className='pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={shopFilter} onValueChange={(v) => setShopFilter(v as ShopFilter)}>
            <SelectTrigger className='w-36'>
              <Filter className='mr-1 h-3.5 w-3.5' />
              <SelectValue placeholder='店铺' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部店铺</SelectItem>
              {shops.filter(s => s !== 'all').map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-28'>
              <SelectValue placeholder='状态' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
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
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    {['订单号', '店铺', '产品', '数量', '金额', '运费', '净利润', '利润率', '状态', '时间'].map((h) => (
                      <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className='border-b transition-colors hover:bg-muted/30 cursor-pointer'
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className='px-3 py-3 text-sm font-medium text-primary tabular-nums'>
                        {order.orderNo.slice(0, 12)}...
                      </td>
                      <td className='px-3 py-3 text-sm'>{order.shop}</td>
                      <td className='px-3 py-3 text-sm'>{order.product}</td>
                      <td className='px-3 py-3 text-sm tabular-nums'>{order.quantity}</td>
                      <td className='px-3 py-3 text-sm tabular-nums font-medium'>
                        {order.currency} {order.amount.toFixed(2)}
                      </td>
                      <td className='px-3 py-3 text-sm tabular-nums'>
                        ¥{order.shippingCost.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-sm font-semibold tabular-nums ${order.profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        ¥{order.profit.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-sm tabular-nums ${order.profitMargin >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        {order.profitMargin >= 0 ? '+' : ''}{order.profitMargin}%
                      </td>
                      <td className='px-3 py-3'>
                        <Badge variant={statusConfig[order.status].variant}>
                          {statusConfig[order.status].label}
                        </Badge>
                      </td>
                      <td className='px-3 py-3 text-sm text-muted-foreground whitespace-nowrap'>
                        {order.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <div><span className='text-muted-foreground'>店铺：</span>{selectedOrder.shop}</div>
                    <div><span className='text-muted-foreground'>状态：</span>
                      <Badge variant={statusConfig[selectedOrder.status].variant} className='ml-1'>
                        {statusConfig[selectedOrder.status].label}
                      </Badge>
                    </div>
                    <div><span className='text-muted-foreground'>产品：</span>{selectedOrder.product}</div>
                    <div><span className='text-muted-foreground'>SKU：</span>{selectedOrder.sku}</div>
                    <div><span className='text-muted-foreground'>数量：</span>{selectedOrder.quantity}</div>
                    <div><span className='text-muted-foreground'>金额：</span>{selectedOrder.currency} {selectedOrder.amount.toFixed(2)}</div>
                    <div><span className='text-muted-foreground'>运费：</span>¥{selectedOrder.shippingCost.toFixed(2)}</div>
                    <div><span className='text-muted-foreground'>利润：</span>
                      <span className={selectedOrder.profit >= 0 ? 'text-emerald-500 font-semibold' : 'text-destructive font-semibold'}>
                        ¥{selectedOrder.profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {selectedOrder.buyerNote && (
                    <div className='rounded-lg border p-3 text-sm'>
                      <span className='text-muted-foreground'>买家备注：</span>{selectedOrder.buyerNote}
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
