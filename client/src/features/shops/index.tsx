import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Store, MoreHorizontal, Loader2, RefreshCw, ExternalLink, Trash2, AlertTriangle, Check } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

const regions = [
  { value: 'MY', label: '马来西亚' },
  { value: 'PH', label: '菲律宾' },
  { value: 'SG', label: '新加坡' },
  { value: 'TH', label: '泰国' },
  { value: 'VN', label: '越南' },
  { value: 'ID', label: '印尼' },
  { value: 'US', label: '美国' },
  { value: 'UK', label: '英国' },
]

export function ShopsPage() {
  const [search, setSearch] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authShopName, setAuthShopName] = useState('')
  const [authRegion, setAuthRegion] = useState('MY')
  const [authCode, setAuthCode] = useState('')
  const [codeMode, setCodeMode] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [cipherValues, setCipherValues] = useState<Record<number, string>>({})
  const [savingCipherId, setSavingCipherId] = useState<number | null>(null)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['shops'],
    queryFn: () => api.shops.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.shops.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shops'] }); setDeleteTarget(null) },
  })

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // Step 1: open TikTok auth page
  const handleGoAuth = async () => {
    try {
      const res = await api.shops.authUrl()
      if (res.success && res.authUrl) {
        window.open(res.authUrl, '_blank')
        setCodeMode(true)
      }
    } catch (e: any) {
      showToast('error', '获取授权链接失败: ' + e.message)
    }
  }

  // Step 2: manual code submission (fallback)
  const handleSubmitCode = async () => {
    if (!authCode.trim()) return
    try {
      const res = await fetch('/api/tiktok/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode.trim() }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        // Update shop name & region
        const shopId = json.shop_id
        if (shopId && authShopName) {
          try {
            await fetch(`/api/tiktok/${shopId}/metadata`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: authShopName, region: authRegion }),
              credentials: 'include',
            })
          } catch {}
        }
        showToast('success', '授权成功')
        resetDialog()
        refetch()
      } else {
        showToast('error', json.error || '授权失败')
      }
    } catch (e: any) {
      showToast('error', '请求失败: ' + e.message)
    }
  }

  const handleTestConnection = async (id: number) => {
    try {
      const res = await fetch('/api/tiktok/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
        credentials: 'include',
      })
      const json = await res.json()
      showToast(json.success ? 'success' : 'error', json.success ? '连接成功' : '连接失败: ' + json.error)
    } catch (e: any) {
      showToast('error', '请求失败')
    }
  }

  const handleRefreshToken = async (shopId: string) => {
    try {
      const res = await fetch('/api/tiktok/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: shopId }),
        credentials: 'include',
      })
      const json = await res.json()
      showToast(json.success ? 'success' : 'error', json.success ? 'Token 已刷新' : json.error)
      if (json.success) refetch()
    } catch { showToast('error', '刷新失败') }
  }

  const resetDialog = () => {
    setAuthOpen(false)
    setCodeMode(false)
    setAuthCode('')
    setAuthShopName('')
    setAuthRegion('MY')
  }

  const handleUpdateCipher = async (shopId: number) => {
    const cipher = cipherValues[shopId]?.trim()
    if (!cipher) return
    setSavingCipherId(shopId)
    try {
      const res = await fetch(`/api/tiktok/${shopId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cipher }),
        credentials: 'include',
      })
      const json = await res.json()
      showToast(json.success ? 'success' : 'error', json.success ? 'Cipher 已更新' : json.error || '更新失败')
      if (json.success) {
        setCipherValues(prev => { const n = { ...prev }; delete n[shopId]; return n })
        refetch()
      }
    } catch (e: any) {
      showToast('error', '网络错误')
    } finally {
      setSavingCipherId(null)
    }
  }

  const shops = data?.shops || []
  const filtered = shops.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()))

  const getShopStatus = (shop: any) => {
    const hasToken = shop.accessToken && shop.accessToken.length > 0
    if (!hasToken || !shop.shopId) return { label: '未授权', variant: 'destructive' as const }
    if (!shop.syncEnabled) return { label: '已暂停', variant: 'secondary' as const }
    if (shop.tokenExpiresAt) {
      if (new Date(shop.tokenExpiresAt).getTime() <= Date.now()) return { label: '已过期', variant: 'secondary' as const }
    }
    return { label: '运营中', variant: 'default' as const }
  }

  const getRegionLabel = (code: string) => regions.find(r => r.value === code)?.label || code

  // URL params: check for ?auth=success from callback redirect
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const authResult = urlParams.get('auth')
    if (authResult === 'success') {
      window.history.replaceState({}, '', '/shops')
      refetch()
    }
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
        {/* Toast */}
        {toast && (
          <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-lg text-sm shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {toast.type === 'success' ? <Check className='h-4 w-4' /> : <AlertTriangle className='h-4 w-4' />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>店铺管理</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              TikTok Shop 授权管理，共 {isLoading ? '...' : shops.length} 个店铺
            </p>
          </div>

          <Button onClick={() => setAuthOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            授权店铺
          </Button>
        </div>

        {/* Auth Dialog */}
        <Dialog open={authOpen} onOpenChange={(v) => { if (!v) resetDialog() }}>
          <DialogContent className='sm:max-w-[480px]'>
            <DialogHeader>
              <DialogTitle>授权 TikTok 店铺</DialogTitle>
              <DialogDescription>
                {codeMode ? '授权完成后，将地址栏中授权码粘贴到下方' : '将跳转至 TikTok 官方页面完成 OAuth 授权'}
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label>店铺名称</Label>
                  <Input
                    placeholder='例如：FreshGuard MY'
                    value={authShopName}
                    onChange={(e) => setAuthShopName(e.target.value)}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label>授权站点</Label>
                  <Select value={authRegion} onValueChange={setAuthRegion}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {codeMode && (
                <div className='grid gap-2'>
                  <Label>授权码 <span className='text-muted-foreground font-normal text-xs'>(地址栏 code= 后面整段)</span></Label>
                  <Input
                    placeholder='ROW_xxx...'
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                  />
                </div>
              )}

              <div className='rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1'>
                {!codeMode && (
                  <p>1. 点击「前往授权」→ 新窗口打开 TikTok 授权页面</p>
                )}
                <p>{codeMode ? '2. 复制浏览器地址栏中完整授权码粘贴到上方' : '2. 选择店铺后点击授权'}</p>
                <p>{codeMode ? '3. 点击「确认授权」完成' : '3. 授权后页面自动返回'}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={resetDialog}>取消</Button>
              {!codeMode ? (
                <Button onClick={handleGoAuth}>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  前往授权
                </Button>
              ) : (
                <Button onClick={handleSubmitCode} disabled={!authCode.trim()}>
                  确认授权
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className='sm:max-w-[400px]'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5 text-destructive' />
                确认取消授权
              </DialogTitle>
              <DialogDescription>
                将取消「{deleteTarget?.name}」的授权，清除 Token，后续将无法同步订单和商品数据。此操作不可恢复。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button variant='destructive' onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className='mb-4 flex items-center gap-2'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='搜索店铺名称...'
              className='pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant='outline' size='icon' onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className='flex items-center justify-center py-32'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        )}

        {/* Shop Cards */}
        {!isLoading && (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {filtered.map((shop: any) => {
              const status = getShopStatus(shop)
              const expiresIn = shop.tokenExpiresAt
                ? Math.max(0, Math.floor((new Date(shop.tokenExpiresAt).getTime() - Date.now()) / 86400000))
                : null

              return (
                <Card key={shop.id} className='transition-shadow hover:shadow-md'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
                          <Store className='h-5 w-5' />
                        </div>
                        <div>
                          <CardTitle className='text-base'>{shop.name}</CardTitle>
                          <CardDescription className='flex items-center gap-2 mt-0.5'>
                            <Badge className='bg-black text-white text-[10px]' variant='secondary'>TikTok</Badge>
                            <span className='text-xs'>{getRegionLabel(shop.region)}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleTestConnection(shop.id)}>
                            <ExternalLink className='mr-2 h-4 w-4' />
                            测试连接
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRefreshToken(shop.shopId)}>
                            <RefreshCw className='mr-2 h-4 w-4' />
                            刷新 Token
                          </DropdownMenuItem>
                          <DropdownMenuItem className='text-destructive' onClick={() => setDeleteTarget({ id: shop.id, name: shop.name })}>
                            <Trash2 className='mr-2 h-4 w-4' />
                            取消授权
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center justify-between mb-3'>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {expiresIn !== null && (
                        <span className='text-xs text-muted-foreground'>
                          {expiresIn <= 0 ? '已过期' : `${expiresIn} 天后过期`}
                        </span>
                      )}
                    </div>
                    {/* Cipher input if missing */}
                    {!shop.shopCipher && (
                      <div className='mb-3 p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'>
                        <p className='text-xs text-amber-700 dark:text-amber-300 mb-1.5'>
                          缺少店铺代号（Cipher），请在 Partner Center 测试店铺页面复制后填入
                        </p>
                        <div className='flex gap-1.5'>
                          <Input
                            className='h-7 text-xs flex-1'
                            placeholder='粘贴店铺代号...'
                            value={cipherValues[shop.id] || ''}
                            onChange={(e) => setCipherValues(prev => ({ ...prev, [shop.id]: e.target.value }))}
                          />
                          <Button
                            size='sm'
                            className='h-7 text-xs px-2'
                            disabled={savingCipherId === shop.id || !cipherValues[shop.id]?.trim()}
                            onClick={() => handleUpdateCipher(shop.id)}
                          >
                            {savingCipherId === shop.id ? <Loader2 className='h-3 w-3 animate-spin' /> : '保存'}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className='grid grid-cols-3 gap-3 pt-3 border-t'>
                      <div className='text-center'>
                        <div className='text-lg font-bold tabular-nums'>—</div>
                        <div className='text-[11px] text-muted-foreground'>今日订单</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-lg font-bold tabular-nums'>—</div>
                        <div className='text-[11px] text-muted-foreground'>今日营收</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-lg font-bold tabular-nums'>—</div>
                        <div className='text-[11px] text-muted-foreground'>产品数</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className='flex min-h-[40vh] flex-col items-center justify-center text-muted-foreground'>
            <Store className='mb-3 h-12 w-12 opacity-30' />
            <p className='mb-1'>{search ? '未找到匹配的店铺' : '暂无已授权店铺'}</p>
            <p className='text-xs mb-4'>{!search && '点击「授权店铺」完成 TikTok Shop OAuth 授权'}</p>
            {!search && (
              <Button variant='outline' onClick={() => setAuthOpen(true)}>
                <Plus className='mr-2 h-4 w-4' />
                授权店铺
              </Button>
            )}
          </div>
        )}
      </Main>
    </>
  )
}
