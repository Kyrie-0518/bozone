import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, LayoutGrid, List, TrendingUp, TrendingDown, Loader2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.products.list(search),
  })

  const createMutation = useMutation({
    mutationFn: (body: any) => api.products.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }) },
  })

  const products = data?.data || []

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    createMutation.mutate({
      name: fd.get('name'), sku: fd.get('sku'),
      sellPrice: Number(fd.get('sellPrice')), costPrice: Number(fd.get('costPrice')),
      weight: Number(fd.get('weight')),
    })
    e.currentTarget.reset()
    ;(document.querySelector('[data-dialog-close]') as HTMLElement)?.click()
  }

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
            <h1 className='text-2xl font-bold tracking-tight'>商品管理</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              管理商品信息、SKU、成本和利润，共 {isLoading ? '...' : products.length} 个商品
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex rounded-lg border p-0.5'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size='icon'
                className='h-8 w-8'
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size='icon'
                className='h-8 w-8'
                onClick={() => setViewMode('table')}
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  添加商品
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                  <DialogTitle>添加新商品</DialogTitle>
                  <DialogDescription>录入商品基本信息</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd}>
                <div className='grid gap-4 py-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'>
                      <Label>商品名称</Label>
                      <Input name='name' placeholder='输入商品名称' required />
                    </div>
                    <div className='grid gap-2'>
                      <Label>SKU</Label>
                      <Input name='sku' placeholder='SKU编号' />
                    </div>
                  </div>
                  <div className='grid grid-cols-3 gap-3'>
                    <div className='grid gap-2'>
                      <Label>售价 (MYR)</Label>
                      <Input name='sellPrice' type='number' placeholder='0.00' step='0.01' />
                    </div>
                    <div className='grid gap-2'>
                      <Label>成本 (RMB)</Label>
                      <Input name='costPrice' type='number' placeholder='0.00' step='0.01' />
                    </div>
                    <div className='grid gap-2'>
                      <Label>重量 (kg)</Label>
                      <Input name='weight' type='number' placeholder='0.00' step='0.01' />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type='button' variant='outline' data-dialog-close>取消</Button>
                  <Button type='submit' disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    保存
                  </Button>
                </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className='mb-4'>
          <div className='relative max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='搜索商品名或SKU...'
              className='pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {viewMode === 'table' ? (
          <Card>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      {['商品名称', 'SKU', '售价(MYR)', '成本(¥)', '重量(kg)', '库存', '总销量', '总利润(¥)', '利润率', '趋势'].map((h) => (
                        <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p.id} className='border-b transition-colors hover:bg-muted/30'>
                        <td className='px-3 py-3 text-sm font-medium'>{p.name}</td>
                        <td className='px-3 py-3 text-sm font-mono text-xs text-muted-foreground'>{p.sku || '-'}</td>
                        <td className='px-3 py-3 text-sm tabular-nums'>MYR {p.sellPrice?.toFixed(2) ?? '0.00'}</td>
                        <td className='px-3 py-3 text-sm tabular-nums'>¥{p.costPrice?.toFixed(2) ?? '0.00'}</td>
                        <td className='px-3 py-3 text-sm tabular-nums'>{p.weight}kg</td>
                        <td className='px-3 py-3 text-sm tabular-nums'>
                          <span className={p.stock === 0 ? 'text-destructive font-semibold' : ''}>{p.stock}</span>
                        </td>
                        <td className='px-3 py-3 text-sm tabular-nums'>—</td>
                        <td className='px-3 py-3 text-sm font-semibold tabular-nums'>—</td>
                        <td className='px-3 py-3 text-sm tabular-nums'>—</td>
                        <td className='px-3 py-3'>
                          <span className='text-muted-foreground'>—</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {products.map((p: any) => (
              <Card key={p.id} className='transition-shadow hover:shadow-md'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <Badge variant='outline' className='font-mono text-[10px]'>{p.sku || 'N/A'}</Badge>
                    <TrendingUp className='h-4 w-4 text-emerald-500' />
                  </div>
                  <CardTitle className='text-base mt-2'>{p.name}</CardTitle>
                  <CardDescription>{p.shopId ? '已关联店铺' : '未关联'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-y-2 text-sm'>
                    <div className='text-muted-foreground'>售价</div>
                    <div className='text-right font-medium tabular-nums'>MYR {p.sellPrice?.toFixed(2) ?? '—'}</div>
                    <div className='text-muted-foreground'>成本</div>
                    <div className='text-right tabular-nums'>¥{p.costPrice?.toFixed(2) ?? '—'}</div>
                    <div className='text-muted-foreground'>库存</div>
                    <div className={`text-right tabular-nums ${p.stock === 0 ? 'text-destructive font-semibold' : ''}`}>{p.stock}</div>
                    <div className='text-muted-foreground'>重量</div>
                    <div className='text-right font-medium tabular-nums'>{p.weight}kg</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Main>
    </>
  )
}
