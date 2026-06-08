const BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'http://8.138.36.120:3001'

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  })
  if (res.status === 401) {
    // 未登录或会话过期，跳转到登录页
    window.location.href = '/sign-in'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Dashboard
  dashboard: () => request<{ success: boolean; data: any }>('/api/dashboard'),

  // Products
  products: {
    list: (q = '') => request<{ success: boolean; data: any[] }>(`/api/products?q=${encodeURIComponent(q)}`),
    get: (id: number) => request<{ success: boolean; data: any }>(`/api/products/${id}`),
    create: (data: any) => request<{ success: boolean; data: any }>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<{ success: boolean; data: any }>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),
  },

  // Orders
  orders: {
    list: (q = '', status = '', shopId = '') => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      if (shopId) params.set('shopId', shopId)
      return request<{ success: boolean; data: any[] }>(`/api/orders?${params}`)
    },
    get: (id: number) => request<{ success: boolean; data: any }>(`/api/orders/${id}`),
    create: (data: any) => request<{ success: boolean; data: any }>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<{ success: boolean; data: any }>(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/api/orders/${id}`, { method: 'DELETE' }),
  },

  // Finance
  finance: {
    costItems: {
      list: () => request<{ success: boolean; data: any[] }>('/api/finance/cost-items'),
      create: (data: any) => request<{ success: boolean; data: any }>('/api/finance/cost-items', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: number, data: any) => request<{ success: boolean; data: any }>(`/api/finance/cost-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: number) => request<{ success: boolean }>(`/api/finance/cost-items/${id}`, { method: 'DELETE' }),
    },
    exchangeRate: {
      get: () => request<{ success: boolean; data: any[] }>('/api/finance/exchange-rate'),
      update: (data: any) => request<{ success: boolean }>('/api/finance/exchange-rate', { method: 'PUT', body: JSON.stringify(data) }),
    },
  },

  // Influencers
  influencers: {
    list: (q = '') => request<{ success: boolean; data: any[] }>(`/api/influencers?q=${encodeURIComponent(q)}`),
    get: (id: number) => request<{ success: boolean; data: any }>(`/api/influencers/${id}`),
    create: (data: any) => request<{ success: boolean; data: any }>('/api/influencers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<{ success: boolean; data: any }>(`/api/influencers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/api/influencers/${id}`, { method: 'DELETE' }),
  },

  // Materials (AI Studio)
  materials: {
    list: (q = '', category = '') => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (category) params.set('category', category)
      return request<{ success: boolean; data: any[] }>(`/api/materials?${params}`)
    },
    create: (data: any) => request<{ success: boolean; data: any }>('/api/materials', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/api/materials/${id}`, { method: 'DELETE' }),
  },

  // Inventory
  inventory: {
    stock: {
      list: (warehouse = '') => {
        const params = new URLSearchParams()
        if (warehouse) params.set('warehouse', warehouse)
        return request<{ success: boolean; data: any[] }>(`/api/inventory/stock?${params}`)
      },
      create: (data: any) => request<{ success: boolean; data: any }>('/api/inventory/stock', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: number, data: any) => request<{ success: boolean; data: any }>(`/api/inventory/stock/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    movements: {
      list: () => request<{ success: boolean; data: any[] }>('/api/inventory/movements'),
      create: (data: any) => request<{ success: boolean; data: any }>('/api/inventory/movements', { method: 'POST', body: JSON.stringify(data) }),
    },
    shipments: {
      list: () => request<{ success: boolean; data: any[] }>('/api/inventory/shipments'),
      create: (data: any) => request<{ success: boolean; data: any }>('/api/inventory/shipments', { method: 'POST', body: JSON.stringify(data) }),
    },
  },

  // Ads
  ads: {
    list: (q = '', status = '') => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      return request<{ success: boolean; data: any[] }>(`/api/ads?${params}`)
    },
    create: (data: any) => request<{ success: boolean; data: any }>('/api/ads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<{ success: boolean; data: any }>(`/api/ads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ success: boolean }>(`/api/ads/${id}`, { method: 'DELETE' }),
  },

  // TikTok Shops
  shops: {
    list: () => request<{ success: boolean; shops: any[] }>('/api/tiktok'),
    get: (id: number) => request<{ success: boolean; shop: any }>(`/api/tiktok/${id}`),
    delete: (id: number) => request<{ success: boolean }>(`/api/tiktok/${id}`, { method: 'DELETE' }),
    authUrl: () => request<{ success: boolean; authUrl: string }>('/api/tiktok/auth-url', { method: 'POST' }),
  },

  // Audit Logs
  auditLogs: {
    list: (limit = 100) => request<{ success: boolean; data: any[] }>(`/api/audit-logs?limit=${limit}`),
  },

  // Sync
  sync: {
    orders: (shopId?: number) => {
      const path = shopId ? `/api/sync/orders/${shopId}` : '/api/sync/orders'
      return request<{ success: boolean; result?: any; results?: any }>(path, { method: 'POST' })
    },
    products: (shopId?: number) => {
      const path = shopId ? `/api/sync/products/${shopId}` : '/api/sync/products'
      return request<{ success: boolean; result?: any; results?: any }>(path, { method: 'POST' })
    },
    logs: (limit = 50) => request<{ success: boolean; data: any[] }>(`/api/sync/logs?limit=${limit}`),
  },

  // Settings
  setting: {
    get: (key: string) => request<{ success: boolean; data: any }>(`/api/settings/${key}`),
    set: (key: string, value: any) => request<{ success: boolean }>(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify(value) }),
  },
}
