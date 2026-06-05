import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Package,
  Users,
  Video,
  Banknote,
  Settings,
  BarChart3,
  Warehouse,
  TrendingUp,
  ScrollText,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Kyrie',
    email: 'kyrie@bozone.cn',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Bozone',
      logo: BarChart3,
      plan: '跨境，更进一步',
    },
  ],
  navGroups: [
    {
      title: '运营中心',
      items: [
        {
          title: '仪表盘',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '店铺管理',
          url: '/shops',
          icon: Store,
        },
        {
          title: '订单管理',
          url: '/orders',
          icon: ShoppingCart,
        },
        {
          title: '商品管理',
          url: '/products',
          icon: Package,
        },
      ],
    },
    {
      title: 'TikTok 运营',
      items: [
        {
          title: '达人BD',
          url: '/influencers',
          icon: Users,
        },
        {
          title: 'AI 工作室',
          url: '/ai-studio',
          icon: Video,
        },
        {
          title: '广告管理',
          url: '/ads',
          icon: TrendingUp,
        },
      ],
    },
    {
      title: '仓储物流',
      items: [
        {
          title: '库存与物流',
          url: '/inventory',
          icon: Warehouse,
        },
      ],
    },
    {
      title: '财务',
      items: [
        {
          title: '财务核算',
          url: '/finance',
          icon: Banknote,
        },
      ],
    },
    {
      title: '系统',
      items: [
        {
          title: '系统设置',
          url: '/settings',
          icon: Settings,
        },
        {
          title: '操作日志',
          url: '/audit-logs',
          icon: ScrollText,
        },
      ],
    },
  ],
}
