import { useState } from 'react'
import {
  Package,
  Search,
  AlertTriangle,
  Truck,
  Warehouse,
  ArrowDownUp,
  MapPin,
  Clock,
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

// ── Types ──
type StockStatus = 'normal' | 'low' | 'out'
type MovementType = 'in' | 'out' | 'transfer' | 'return'

interface WarehouseItem {
  id: string
  sku: string
  name: string
  warehouse: string
  location: string
  currentStock: number
  safetyStock: number
  status: StockStatus
  lastUpdated: string
}

interface StockMovement {
  id: string
  type: MovementType
  sku: string
  name: string
  quantity: number
  from?: string
  to?: string
  operator: string
  time: string
  note?: string
}

interface Shipment {
  id: string
  orderNo: string
  trackingNo: string
  carrier: string
  status: 'pending' | 'picked' | 'shipped' | 'in_transit' | 'delivered' | 'exception'
  origin: string
  destination: string
  estimatedDelivery: string
  actualDelivery?: string
  weight: number
}

// ── Mock Data ──
const mockInventory: WarehouseItem[] = [
  { id: '1', sku: 'FRESH-001', name: '冰箱除味剂', warehouse: '深圳1号仓', location: 'A-03-12', currentStock: 520, safetyStock: 100, status: 'normal', lastUpdated: '2026-05-28' },
  { id: '2', sku: 'FRESH-002', name: '冰箱除味盒', warehouse: '深圳1号仓', location: 'A-03-15', currentStock: 380, safetyStock: 100, status: 'normal', lastUpdated: '2026-05-28' },
  { id: '3', sku: 'CLEAN-003', name: '多功能清洁膏', warehouse: '深圳1号仓', location: 'B-01-08', currentStock: 45, safetyStock: 80, status: 'low', lastUpdated: '2026-05-27' },
  { id: '4', sku: 'FRESH-004', name: '除味蛋', warehouse: '深圳2号仓', location: 'C-05-22', currentStock: 650, safetyStock: 150, status: 'normal', lastUpdated: '2026-05-28' },
  { id: '5', sku: 'FRESH-005', name: '除味棒', warehouse: '深圳2号仓', location: 'C-05-25', currentStock: 890, safetyStock: 200, status: 'normal', lastUpdated: '2026-05-28' },
  { id: '6', sku: 'WASH-007', name: '洗衣机清洁片', warehouse: '深圳1号仓', location: 'B-02-10', currentStock: 8, safetyStock: 50, status: 'low', lastUpdated: '2026-05-26' },
  { id: '7', sku: 'KIT-009', name: '厨房清洁剂', warehouse: '深圳1号仓', location: 'B-03-01', currentStock: 0, safetyStock: 30, status: 'out', lastUpdated: '2026-05-25' },
  { id: '8', sku: 'FLOOR-010', name: '地板清洁片', warehouse: '深圳2号仓', location: 'C-01-18', currentStock: 340, safetyStock: 80, status: 'normal', lastUpdated: '2026-05-28' },
  { id: '9', sku: 'PIPE-012', name: '管道疏通剂', warehouse: '深圳1号仓', location: 'A-01-05', currentStock: 120, safetyStock: 60, status: 'normal', lastUpdated: '2026-05-27' },
  { id: '10', sku: 'GLASS-015', name: '玻璃清洁液', warehouse: '深圳2号仓', location: 'C-03-09', currentStock: 15, safetyStock: 40, status: 'low', lastUpdated: '2026-05-26' },
]

const mockMovements: StockMovement[] = [
  { id: '1', type: 'out', sku: 'FRESH-001', name: '冰箱除味剂', quantity: 50, from: '深圳1号仓-A-03-12', operator: '张三', time: '2026-05-28 14:30', note: '发货给TikTok订单' },
  { id: '2', type: 'in', sku: 'CLEAN-003', name: '多功能清洁膏', quantity: 200, to: '深圳1号仓-B-01-08', operator: '李四', time: '2026-05-28 10:00', note: '采购入库' },
  { id: '3', type: 'transfer', sku: 'FRESH-004', name: '除味蛋', quantity: 100, from: '深圳1号仓-A-03-20', to: '深圳2号仓-C-05-22', operator: '王五', time: '2026-05-27 16:00' },
  { id: '4', type: 'return', sku: 'WASH-007', name: '洗衣机清洁片', quantity: 3, to: '深圳1号仓-B-02-10', operator: '张三', time: '2026-05-27 09:15', note: '客户退货' },
  { id: '5', type: 'out', sku: 'FRESH-002', name: '冰箱除味盒', quantity: 30, from: '深圳1号仓-A-03-15', operator: '李四', time: '2026-05-26 15:00', note: 'TikTok订单发货' },
  { id: '6', type: 'in', sku: 'FRESH-005', name: '除味棒', quantity: 500, to: '深圳2号仓-C-05-25', operator: '王五', time: '2026-05-26 08:00', note: '批量采购入库' },
]

const mockShipments: Shipment[] = [
  { id: '1', orderNo: '5833133557869...', trackingNo: 'SF1234567890', carrier: '顺丰国际', status: 'in_transit', origin: '深圳', destination: '吉隆坡, 马来西亚', estimatedDelivery: '2026-06-02', weight: 0.15 },
  { id: '2', orderNo: '5837850537980...', trackingNo: 'SF1234567891', carrier: '顺丰国际', status: 'shipped', origin: '深圳', destination: '槟城, 马来西亚', estimatedDelivery: '2026-06-03', weight: 0.70 },
  { id: '3', orderNo: '5837787679949...', trackingNo: 'JD9876543210', carrier: '京东跨境', status: 'picked', origin: '深圳', destination: '吉隆坡, 马来西亚', estimatedDelivery: '2026-06-04', weight: 0.15 },
  { id: '4', orderNo: '5837690012456...', trackingNo: 'SF1234567892', carrier: '顺丰国际', status: 'delivered', origin: '深圳', destination: '新山, 马来西亚', estimatedDelivery: '2026-05-28', actualDelivery: '2026-05-28', weight: 0.12 },
  { id: '5', orderNo: '5837543289012...', trackingNo: 'YTO9988776655', carrier: '圆通跨境', status: 'exception', origin: '深圳', destination: '吉隆坡, 马来西亚', estimatedDelivery: '2026-06-01', weight: 0.50 },
]

// ── Config ──
const stockStatusConfig: Record<StockStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  normal: { label: '正常', variant: 'default' },
  low: { label: '低库存', variant: 'secondary' },
  out: { label: '缺货', variant: 'destructive' },
}

const movementTypeConfig: Record<MovementType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  in: { label: '入库', variant: 'default' },
  out: { label: '出库', variant: 'destructive' },
  transfer: { label: '调拨', variant: 'secondary' },
  return: { label: '退货', variant: 'outline' },
}

const shipmentStatusConfig: Record<Shipment['status'], { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive' }> = {
  pending: { label: '待拣货', variant: 'secondary' },
  picked: { label: '已拣货', variant: 'outline' },
  shipped: { label: '已发货', variant: 'default' },
  in_transit: { label: '运输中', variant: 'default' },
  delivered: { label: '已签收', variant: 'default' },
  exception: { label: '异常', variant: 'destructive' },
}

// ── Component ──
export function InventoryPage() {
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('all')

  const warehouses = ['all', '深圳1号仓', '深圳2号仓']

  const filtered = mockInventory.filter((item) => {
    if (search && !item.name.includes(search) && !item.sku.includes(search)) return false
    if (warehouseFilter !== 'all' && item.warehouse !== warehouseFilter) return false
    return true
  })

  const lowStockCount = mockInventory.filter((i) => i.status === 'low' || i.status === 'out').length
  const pendingShipments = mockShipments.filter((s) => s.status === 'pending' || s.status === 'picked').length

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
            <h1 className='text-2xl font-bold tracking-tight'>库存与物流</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              仓库管理 · 库存监控 · 出入库记录 · 物流追踪
            </p>
          </div>
          <div className='flex gap-2'>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm'>
                  <ArrowDownUp className='mr-1.5 h-4 w-4' />
                  出入库操作
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                  <DialogTitle>出入库操作</DialogTitle>
                  <DialogDescription>记录库存变动</DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'>
                      <Label>操作类型</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder='选择类型' /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value='in'>入库</SelectItem>
                          <SelectItem value='out'>出库</SelectItem>
                          <SelectItem value='transfer'>调拨</SelectItem>
                          <SelectItem value='return'>退货入库</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid gap-2'>
                      <Label>数量</Label>
                      <Input type='number' placeholder='0' />
                    </div>
                  </div>
                  <div className='grid gap-2'>
                    <Label>SKU / 商品</Label>
                    <Input placeholder='选择商品' />
                  </div>
                  <div className='grid gap-2'>
                    <Label>备注</Label>
                    <Input placeholder='备注信息（可选）' />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant='outline'>取消</Button>
                  <Button>确认操作</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alert Cards */}
        <div className='mb-6 grid gap-4 sm:grid-cols-3'>
          <Card className='border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>库存预警</CardTitle>
              <AlertTriangle className='h-4 w-4 text-amber-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-amber-600 dark:text-amber-400'>{lowStockCount}</div>
              <p className='text-xs text-muted-foreground'>个商品低于安全库存</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>总库存 SKU</CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums'>{mockInventory.length}</div>
              <p className='text-xs text-muted-foreground'>
                覆盖 {warehouses.length - 1} 个仓库
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>待处理物流</CardTitle>
              <Truck className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tabular-nums'>{pendingShipments}</div>
              <p className='text-xs text-muted-foreground'>个包裹待发货/已拣货</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue='stock' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='stock'>
              <Warehouse className='mr-1.5 h-4 w-4' />
              库存管理
            </TabsTrigger>
            <TabsTrigger value='movements'>
              <ArrowDownUp className='mr-1.5 h-4 w-4' />
              出入库记录
            </TabsTrigger>
            <TabsTrigger value='shipments'>
              <Truck className='mr-1.5 h-4 w-4' />
              物流追踪
            </TabsTrigger>
          </TabsList>

          {/* ── 库存管理 ── */}
          <TabsContent value='stock'>
            <div className='mb-4 flex flex-wrap items-center gap-3'>
              <div className='relative w-64'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input placeholder='搜索SKU或商品名...' className='pl-9' value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className='w-36'>
                  <SelectValue placeholder='仓库' />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w} value={w}>{w === 'all' ? '全部仓库' : w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['SKU', '商品名称', '仓库', '库位', '当前库存', '安全库存', '状态', '更新时间'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-3 text-sm font-mono text-muted-foreground'>{item.sku}</td>
                          <td className='px-3 py-3 text-sm font-medium'>{item.name}</td>
                          <td className='px-3 py-3 text-sm'>
                            <div className='flex items-center gap-1.5'>
                              <MapPin className='h-3 w-3 text-muted-foreground' />
                              {item.warehouse}
                            </div>
                          </td>
                          <td className='px-3 py-3 text-sm font-mono text-xs'>{item.location}</td>
                          <td className={`px-3 py-3 text-sm font-bold tabular-nums ${
                            item.status === 'out' ? 'text-destructive' : item.status === 'low' ? 'text-amber-500' : ''
                          }`}>
                            {item.currentStock}
                          </td>
                          <td className='px-3 py-3 text-sm tabular-nums text-muted-foreground'>{item.safetyStock}</td>
                          <td className='px-3 py-3'>
                            <Badge variant={stockStatusConfig[item.status].variant}>
                              {stockStatusConfig[item.status].label}
                            </Badge>
                          </td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{item.lastUpdated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 出入库记录 ── */}
          <TabsContent value='movements'>
            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['类型', 'SKU', '商品', '数量', '来源/去向', '操作人', '时间', '备注'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockMovements.map((m) => (
                        <tr key={m.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-3'>
                            <Badge variant={movementTypeConfig[m.type].variant}>
                              {movementTypeConfig[m.type].label}
                            </Badge>
                          </td>
                          <td className='px-3 py-3 text-sm font-mono text-muted-foreground'>{m.sku}</td>
                          <td className='px-3 py-3 text-sm'>{m.name}</td>
                          <td className='px-3 py-3 text-sm font-bold tabular-nums'>{m.quantity}</td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{m.from || m.to}</td>
                          <td className='px-3 py-3 text-sm'>{m.operator}</td>
                          <td className='px-3 py-3 text-sm text-muted-foreground whitespace-nowrap'>{m.time}</td>
                          <td className='px-3 py-3 text-sm text-muted-foreground max-w-[150px] truncate'>{m.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 物流追踪 ── */}
          <TabsContent value='shipments'>
            <Card>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b bg-muted/50'>
                        {['订单号', '运单号', '承运商', '始发地', '目的地', '重量', '预计送达', '实际送达', '状态'].map((h) => (
                          <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground'>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockShipments.map((s) => (
                        <tr key={s.id} className='border-b transition-colors hover:bg-muted/30'>
                          <td className='px-3 py-3 text-sm text-primary font-medium tabular-nums'>{s.orderNo}</td>
                          <td className='px-3 py-3 text-sm font-mono tabular-nums'>{s.trackingNo}</td>
                          <td className='px-3 py-3 text-sm'>{s.carrier}</td>
                          <td className='px-3 py-3 text-sm'>{s.origin}</td>
                          <td className='px-3 py-3 text-sm'>{s.destination}</td>
                          <td className='px-3 py-3 text-sm tabular-nums'>{s.weight}kg</td>
                          <td className='px-3 py-3 text-sm'>
                            <div className='flex items-center gap-1.5'>
                              <Clock className='h-3 w-3 text-muted-foreground' />
                              {s.estimatedDelivery}
                            </div>
                          </td>
                          <td className='px-3 py-3 text-sm text-muted-foreground'>{s.actualDelivery || '—'}</td>
                          <td className='px-3 py-3'>
                            <Badge variant={shipmentStatusConfig[s.status].variant}>
                              {shipmentStatusConfig[s.status].label}
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
        </Tabs>
      </Main>
    </>
  )
}
