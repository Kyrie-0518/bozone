import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowUp, ArrowDown, DollarSign, ShoppingCart, TrendingUp, Percent, Loader2,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { api } from '@/lib/api'

const statusMap = {
  shipped: { label: '已发货', variant: 'default' as const },
  pending: { label: '待发货', variant: 'secondary' as const },
  transit: { label: '运输中', variant: 'outline' as const },
  cancelled: { label: '已取消', variant: 'destructive' as const },
}

export function Dashboard() {
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  })
  const d = dashData?.data || {}

  const statCards = [
    { title: '总营收 (RMB)', value: `¥${(d.revenue || 0).toLocaleString()}`, change: d.revenueChange || 0, icon: DollarSign },
    { title: '总订单', value: String(d.orders || 0), change: d.orderChange || 0, icon: ShoppingCart },
    { title: '商品数', value: String(d.products || 0), change: 0, icon: TrendingUp },
    { title: 'ROI', value: `${d.roi || 0}`, change: 0, icon: Percent },
  ]

  const profitData = (d.trend || []).map((t: any) => ({
    date: t.date?.slice(5) || t.date,
    profit: t.revenue || 0,
    roi: t.count || 0,
  }))
  const topProducts = (d.topProducts || []).map((p: any) => ({ name: p.name, revenue: p.total }))
  const recentOrders: any[] = d.recentOrders || []

  const statusDisplayMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: '待发货', variant: 'secondary' },
    shipped: { label: '已发货', variant: 'default' },
    transit: { label: '运输中', variant: 'outline' },
    completed: { label: '已完成', variant: 'default' },
    cancelled: { label: '已取消', variant: 'destructive' },
    delivered: { label: '已签收', variant: 'default' },
    AWAITING_SHIPMENT: { label: '待发货', variant: 'secondary' },
    IN_TRANSIT: { label: '运输中', variant: 'outline' },
    DELIVERED: { label: '已签收', variant: 'default' },
    COMPLETED: { label: '已完成', variant: 'default' },
    CANCELLED: { label: '已取消', variant: 'destructive' },
  }

  const today = useMemo(() => {
    return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [])

  if (isLoading) {
    return (
      <><Header><div className='me-auto' /></Header>
      <Main><div className='flex items-center justify-center h-64'><Loader2 className='h-8 w-8 animate-spin text-muted-foreground' /></div></Main></>
    )
  }

  return (
    <>
      <Header>
        <div className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        {/* Page Title */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>仪表盘</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              跨境运营总览 · {today}
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {statCards.map((stat, i) => (
            <Card key={i} className='transition-shadow hover:shadow-md'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  {stat.title}
                </CardTitle>
                <stat.icon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold tabular-nums'>{stat.value}</div>
                <p className='mt-1 flex items-center gap-1 text-xs'>
                  {stat.change >= 0 ? (
                    <ArrowUp className='h-3 w-3 text-emerald-500' />
                  ) : (
                    <ArrowDown className='h-3 w-3 text-red-500' />
                  )}
                  <span className={stat.change >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {stat.change >= 0 ? '+' : ''}{stat.change}%
                  </span>
                  <span className='text-muted-foreground'>vs 昨日</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className='mb-6 grid grid-cols-1 gap-4 lg:grid-cols-7'>
          {/* Profit Trend */}
          <Card className='lg:col-span-4'>
            <CardHeader>
              <CardTitle>利润趋势 · 近30天</CardTitle>
              <CardDescription>琥珀色为利润，虚线为ROI</CardDescription>
            </CardHeader>
            <CardContent className='pl-2'>
              <ResponsiveContainer width='100%' height={280}>
                <AreaChart data={profitData}>
                  <defs>
                    <linearGradient id='profitGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#D97706' stopOpacity={0.15} />
                      <stop offset='95%' stopColor='#D97706' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                  <XAxis dataKey='date' tick={{ fontSize: 11 }} className='text-muted-foreground' interval={5} />
                  <YAxis yAxisId='left' tick={{ fontSize: 11 }} className='text-muted-foreground' />
                  <YAxis yAxisId='right' orientation='right' tick={{ fontSize: 11 }} className='text-muted-foreground' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    yAxisId='left'
                    type='monotone'
                    dataKey='profit'
                    stroke='#D97706'
                    strokeWidth={2}
                    fill='url(#profitGradient)'
                    name='利润 ¥'
                  />
                  <Area
                    yAxisId='right'
                    type='monotone'
                    dataKey='roi'
                    stroke='#059669'
                    strokeWidth={2}
                    strokeDasharray='5 5'
                    fill='none'
                    name='ROI %'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className='lg:col-span-3'>
            <CardHeader>
              <CardTitle>热销产品 Top 10</CardTitle>
              <CardDescription>近30天销售额排名</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={280}>
                <BarChart data={topProducts} layout='vertical' margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-border' horizontal={false} />
                  <XAxis type='number' tick={{ fontSize: 10 }} className='text-muted-foreground' />
                  <YAxis dataKey='name' type='category' tick={{ fontSize: 11 }} width={80} className='text-muted-foreground' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`¥${value}`, '销售额']}
                  />
                  <Bar dataKey='revenue' fill='#D97706' radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Table */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>最近订单</CardTitle>
              <CardDescription>最新8笔跨境订单</CardDescription>
            </div>
            <span className='text-sm font-medium text-primary cursor-pointer hover:underline'>
              查看全部 →
            </span>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    {['订单号', '店铺', '产品', '金额(MYR)', '跨境运费', '净利润(RMB)', '状态', '时间'].map((h) => (
                      <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className='border-b transition-colors hover:bg-muted/50'
                    >
                      <td className='px-3 py-3 text-sm font-medium text-primary tabular-nums'>
                        {order.orderNo?.slice(-12) || `#${order.id}`}
                      </td>
                      <td className='px-3 py-3 text-sm'>{order.shop || '-'}</td>
                      <td className='px-3 py-3 text-sm max-w-[150px] truncate'>{order.products || '-'}</td>
                      <td className='px-3 py-3 text-sm tabular-nums'>
                        {order.currency || 'MYR'} {(order.amount || 0).toFixed(2)}
                      </td>
                      <td className='px-3 py-3 text-sm tabular-nums'>
                        {order.currency || 'MYR'} {(order.shipping || 0).toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-sm font-semibold tabular-nums ${order.profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        ¥{order.profit.toFixed(2)}
                      </td>
                      <td className='px-3 py-3'>
                        <Badge variant={statusDisplayMap[order.status]?.variant || statusMap[order.status]?.variant || 'secondary'}>
                          {statusDisplayMap[order.status]?.label || statusMap[order.status]?.label || order.status}
                        </Badge>
                      </td>
                      <td className='px-3 py-3 text-sm text-muted-foreground'>
                        {order.time?.slice(0, 10) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
