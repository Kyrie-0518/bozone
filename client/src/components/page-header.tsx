// ── Page Header Component ──
// Unified page title with gradient icon + h2 + subtitle
// Usage: <PageHeader icon={ShoppingCart} title="订单管理" subtitle="管理和追踪所有跨境订单" />
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, children }: PageHeaderProps) {
  return (
    <div className='mb-6 flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10'>
          <Icon className='h-5 w-5 text-primary' />
        </div>
        <div>
          <h2 className='text-xl font-semibold tracking-tight text-foreground'>{title}</h2>
          {subtitle && (
            <p className='text-sm text-muted-foreground mt-0.5'>{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div className='flex items-center gap-2'>{children}</div>}
    </div>
  )
}
