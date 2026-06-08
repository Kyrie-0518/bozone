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
  ScrollText,
  // 广告管理图标
  Megaphone,
  Layers,
  ImagePlus,
  Bot,
  KeyRound,
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
          icon: Megaphone,
          items: [
            { title: '广告概览', url: '/ads', icon: LayoutDashboard },
            { title: '广告系列', url: '/ads/campaigns', icon: Layers },
            { title: '创意素材', url: '/ads/creatives', icon: ImagePlus },
            { title: '商品推广', url: '/ads/products', icon: Package },
            { title: '规则引擎', url: '/ads/rules', icon: Bot },
            { title: '数据报表', url: '/ads/reports', icon: BarChart3 },
            { title: '账户中心', url: '/ads/accounts', icon: KeyRound },
          ],
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
