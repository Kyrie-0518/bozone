import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, LayoutGrid, List, Loader2, RefreshCw, PackageSearch,
  Package, Eye, TrendingUp,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

const productStatusConfig: Record<string, { label: string; color: string }> = {
  ACTIVATE:   { label: '上架', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ACTIVE:    { label: '上架', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  SELLER_DEACTIVATED: { label: '下架', color: 'bg-slate-100 text-slate-600 border-slate-300' },
  INACTIVE:  { label: '下架', color: 'bg-slate-100 text-slate-600 border-slate-300' },
  FROZEN:   { label: '冻结', color: 'bg-red-100 text-red-700 border-red-200' },
  DELETED:   { label: '已删除', color: 'bg-gray-100 text-gray-500 border-gray-300' },
  DRAFT:     { label: '草稿', color: 'bg-amber-100 text-amber-600 border-amber-200' },
  PENDING:   { label: '审核中', color: 'bg-blue-100 text-blue-600 border-blue-200' },
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.products.list(search),
  })
  const { data: shopsData } = useQuery({ queryKey: ['shops'], queryFn: () => api.shops.list() })
  const shops = shopsData?.shops || []
  void shops

  const createMutation = useMutation({ mutationFn: (body: any) => api.products.create(body), onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }) })
  const syncMutation = useMutation({ mutationFn: () => api.sync.products(), onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }) })

  const products = data?.data || []
  
  // ── Computed stats ──
  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter(p => p.status === 'ACTIVATE' || p.status === 'ACTIVE').length
    const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0)
    const totalValue = products.reduce((s, p) => s + (Number(p.sellPrice) || 0) * Math.max(Number(p.stock) || 1, 1), 0)
    return { total, active, totalStock, totalValue }
  }, [products])

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    createMutation.mutate({
      name: fd.get('name'), sku: fd.get('sku'), category: fd.get('category') || '',
      sellPrice: Number(fd.get('sellPrice')), costPrice: Number(fd.get('costPrice')),
      weight: Number(fd.get('weight')), stock: Number(fd.get('stock') || 0),
    })
    e.currentTarget.reset()
    ;(document.querySelector('[data-dialog-close]') as HTMLElement)?.click()
  }

  // Helper to get status config
  const getStatus = (status?: string) => productStatusConfig[status || ''] || { label: status || '未知', color: 'bg-gray-100 text-gray-500' }

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
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-200'>
              <Package className='h-5 w-5 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-slate-800'>商品管理</h1>
              <p className='text-xs text-muted-foreground mt-0.5'>共 {isLoading ? '...' : products.length.toLocaleString()} 个商品 · 总库存 {stats.totalStock.toLocaleString()}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {/* View toggle */}
            <div className='flex overflow-hidden rounded-lg border bg-white p-0.5 shadow-sm'>
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size='icon' className={`h-8 w-8 rounded-md ${viewMode === 'grid' ? 'shadow-sm' : ''}`} onClick={() => setViewMode('grid')}>
                <LayoutGrid className='h-4 w-4' />
              </Button>
              <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size='icon' className={`h-8 w-8 rounded-md ${viewMode === 'table' ? 'shadow-sm' : ''}`} onClick={() => setViewMode('table')}>
                <List className='h-4 w-4' />
              </Button>
            </div>
            <Button variant='outline' size='sm' onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' /> : <RefreshCw className='mr-1.5 h-3.5 w-3.5' />}
              同步商品
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size='sm'><Plus className='mr-1.5 h-3.5 w-3.5' />添加商品</Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[520px]'>
                <DialogHeader><DialogTitle>添加新商品</DialogTitle><DialogDescription>录入商品基本信息</DialogDescription></DialogHeader>
                <form onSubmit={handleAdd}>
                  <div className='grid gap-4 py-4'>
                    <div className='space-y-1'><Label>商品名称</Label><Input name='name' placeholder='如：FreshGuard 保鲜密封袋 大号' required /></div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='space-y-1'><Label>SKU 编码</Label><Input name='sku' placeholder='FG-BIG-001' /></div>
                      <div className='space-y-1'><Label>分类</Label><Input name='category' placeholder='厨房用品 > 保鲜袋' /></div>
                    </div>
                    <div className='grid grid-cols-3 gap-3'>
                      <div className='space-y-1'><Label>售价 (MYR)</Label><Input name='sellPrice' type='number' step='0.01' placeholder='9.90' /></div>
                      <div className='space-y-1'><Label>成本 (¥)</Label><Input name='costPrice' type='number' step='0.01' placeholder='4.20' /></div>
                      <div className='space-y-1'><Label>重量 (kg)</Label><Input name='weight' type='number' step='0.01' placeholder='0.20' /></div>
                    </div>
                    <div className='space-y-1'><Label>库存数量</Label><Input name='stock' type='number' placeholder='150' /></div>
                  </div>
                  <DialogFooter>
                    <Button type='button' variant='outline' data-dialog-close>取消</Button>
                    <Button type='submit' disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />}保存</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ═══ Stat Cards ═══ */}
        <div className='mb-5 grid grid-cols-4 gap-3'>
          {[
            { label: '商品总数', value: stats.total.toLocaleString(), sub: `在售 ${stats.active} 个`, icon: Package, gradient: 'from-violet-500 to-purple-600', bg: 'violet-50' },
            { label: '总库存量', value: `${(stats.totalStock / 1000).toFixed(1)}k`, sub: `${stats.totalStock} 件`, icon: PackageSearch, gradient: 'from-cyan-500 to-teal-600', bg: 'cyan-50' },
            { label: '总货值 (MYR)', value: `¥${stats.totalValue.toFixed(0)}`, sub: '售价 × 库存合计', icon: TrendingUp, gradient: 'from-emerald-500 to-green-600', bg: 'emerald-50' },
            { label: '在售率', value: stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}%` : '—', sub: `${stats.active}/${stats.total} 上架`, icon: Eye, gradient: 'from-blue-500 to-indigo-600', bg: 'blue-50' },
          ].map((stat, i) => (
            <Card key={i} className={`border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${stat.bg}`}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>{stat.label}</span>
                  <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
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
          <div className='relative flex-1 min-w-[220px] max-w-xs'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
            <Input placeholder='搜索商品名称或 SKU...' className='pl-9 h-9 bg-white border-slate-200/80 focus:border-violet-400' value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-24 text-muted-foreground'>
            <Loader2 className='mr-2 h-5 w-5 animate-spin' /> 加载商品数据...
          </div>
        ) : products.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-24 text-muted-foreground'>
            <PackageSearch className='mb-3 h-14 w-14 opacity-40' />
            <p className='font-medium text-base'>暂无商品数据</p>
            <p className='text-sm mt-1'>点击「同步商品」从 TikTok Shop 拉取最新商品信息</p>
            <Button variant='outline' size='sm' className='mt-4' onClick={() => syncMutation.mutate()}>
              <RefreshCw className='mr-1.5 h-3.5 w-3.5' /> 立即同步
            </Button>
          </div>
        ) : viewMode === 'table' ? (
          /* ═══ Table View ═══ */
          <Card className='border-slate-200/60 shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='bg-slate-50/80 border-b border-slate-200/60'>
                    <th className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'>商品信息</th>
                    <th className='px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500'>SKU</th>
                    <th className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500'>售价</th>
                    <th className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500'>成本</th>
                    <th className='px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500'>库存</th>
                    <th className='px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500'>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data || []).map((p: any) => {
                    const sc = getStatus(p.status)
                    const profitMargin = p.sellPrice && p.costPrice ? (((p.sellPrice - p.costPrice) / p.sellPrice) * 100) : null
                    return (
                      <tr key={p.id} className='group border-b border-slate-100/50 transition-colors hover:bg-violet-50/30'>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-3'>
                            {p.image ? (
                              <img src={p.image} alt={p.name} className='h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200 shadow-sm' onError={(e) => (e.currentTarget.style.display = 'none')} />
                            ) : (
                              <div className='h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ring-1 ring-slate-200'>
                                <Package className='h-4 w-4 text-slate-400' />
                              </div>
                            )}
                            <span className='font-medium text-slate-700 max-w-[180px] truncate'>{p.name || '未命名商品'}</span>
                          </div>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <code className='rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-600'>{p.sku || '—'}</code>
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <span className='font-semibold text-slate-800 tabular-nums'>MYR {Number(p.sellPrice || 0).toFixed(2)}</span>
                          {profitMargin !== null && (
                            <span className={`block text-[10px] tabular-nums ${profitMargin >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                              利润 {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className='px-4 py-3 text-right tabular-nums text-slate-600'>¥{Number(p.costPrice || 0).toFixed(2)}</td>
                        <td className='px-4 py-3 text-center'>
                          <span className={`inline-flex items-center justify-center min-w-[40px] rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${(Number(p.stock) || 0) <= 10 ? 'text-red-600 bg-red-50' : 'text-slate-700 bg-slate-100'}`}>
                            {p.stock || 0}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <Badge variant='secondary' className={`${sc.color} border text-[11px] font-normal`}>{sc.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* ═══ Grid View ═══ */
          <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {products.map((p: any) => {
              const sc = getStatus(p.status)
              const profitMargin = p.sellPrice && p.costPrice ? ((p.sellPrice - p.costPrice) / p.sellPrice * 100) : null
              return (
                <Card key={p.id} className='group relative overflow-hidden border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5'>
                  {/* Product Image Area */}
                  <div className='relative h-36 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden'>
                    {p.image ? (
                      <img src={p.image} alt='' className='h-full w-full object-cover group-hover:scale-105 transition-transform duration-300' onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        ;(e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden')
                      }} />
                    ) : null}
                    <Package className='h-10 w-10 text-slate-300 hidden peer' />
                    {/* Status Badge */}
                    <div className='absolute top-3 right-3'>
                      <Badge className={`${sc.color} border text-[10px] shadow-sm`}>{sc.label}</Badge>
                    </div>
                  </div>

                  <CardContent className='p-4 pt-3'>
                    {/* Name & SKU */}
                    <h3 className='font-semibold text-slate-800 text-sm line-clamp-1 mb-1'>{p.name || '未命名商品'}</h3>
                    <code className='block text-[11px] font-mono text-slate-400 bg-slate-50 rounded px-1.5 py-0.5 inline-block'>{p.sku || 'NO-SKU'}</code>

                    {/* Price Row — Key info */}
                    <div className='mt-3 grid grid-cols-2 gap-x-4 gap-y-1'>
                      <div>
                        <p className='text-[10px] text-muted-foreground'>售价</p>
                        <p className='text-sm font-bold tabular-nums text-emerald-600'>MYR {Number(p.sellPrice || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className='text-[10px] text-muted-foreground'>成本</p>
                        <p className='text-sm tabular-nums text-slate-600'>¥{Number(p.costPrice || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Bottom row: Stock + Profit */}
                    <div className='mt-3 pt-3 border-t border-slate-100/60 flex items-center justify-between'>
                      <div className='flex items-center gap-1.5'>
                        <AlertTriangle className='h-3.5 w-3.5 text-slate-400' />
                        <span className={`text-sm font-bold tabular-nums ${(Number(p.stock) || 0) <= 5 ? 'text-red-500' : 'text-slate-700'}`}>{p.stock || 0}</span>
                        <span className='text-[10px] text-muted-foreground'>件</span>
                      </div>
                      {profitMargin !== null && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${profitMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          <TrendingUp className={`h-3 w-3 ${profitMargin >= 0 ? '' : 'rotate-180'}`} />
                          {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Main>
    </>
  )
}
