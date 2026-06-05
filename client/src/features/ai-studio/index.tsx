import { useState } from 'react'
import {
  Film,
  Upload,
  Search,
  Image,
  Video,
  FolderOpen,
  Sparkles,
  Play,
  Clock,
  XCircle,
  Link,
  Trash2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// ── Types ──
interface Material {
  id: string; name: string; type: 'image' | 'video'
  size: string; category: string; tags: string[]; uploadDate: string
}

interface GenerationTask {
  id: string; name: string; type: 'text2video' | 'image2video'
  prompt?: string; sourceImage?: string; status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number; duration?: number; outputUrl?: string; linkedProduct?: string
  createdAt: string; completedAt?: string; error?: string
}

// ── Mock Data ──
const mockMaterials: Material[] = [
  { id: '1', name: '冰箱除味剂_产品图_01.jpg', type: 'image', size: '2.4 MB', category: '产品主图', tags: ['除味剂', '产品图'], uploadDate: '2026-05-28' },
  { id: '2', name: '清洁膏_使用教程.mp4', type: 'video', size: '18.7 MB', category: '产品视频', tags: ['清洁膏', '教程'], uploadDate: '2026-05-27' },
  { id: '3', name: '除味蛋_达人素材_@sarah.mp4', type: 'video', size: '24.3 MB', category: '达人素材', tags: ['除味蛋', '达人'], uploadDate: '2026-05-26' },
  { id: '4', name: '洗衣机清洁片_广告素材.jpg', type: 'image', size: '1.8 MB', category: '广告素材', tags: ['清洁片', '广告'], uploadDate: '2026-05-25' },
  { id: '5', name: '厨房清洁剂_场景图_01.jpg', type: 'image', size: '3.1 MB', category: '产品主图', tags: ['清洁剂', '厨房'], uploadDate: '2026-05-24' },
  { id: '6', name: '除味棒_促销视频.mp4', type: 'video', size: '15.2 MB', category: '广告素材', tags: ['除味棒', '促销'], uploadDate: '2026-05-23' },
]

const mockTasks: GenerationTask[] = [
  { id: 't1', name: '冰箱除味剂-使用场景', type: 'text2video', prompt: '展示冰箱除味剂放入冰箱后的清新效果，干净明亮的厨房场景，温暖自然光', status: 'completed', progress: 100, outputUrl: 'https://generated/demo1.mp4', linkedProduct: '冰箱除味剂', createdAt: '2026-05-28 10:00', completedAt: '2026-05-28 10:03', duration: 180 },
  { id: 't2', name: '清洁膏-厨房实测', type: 'text2video', prompt: '多功能清洁膏擦拭灶台的对比视频，前后效果明显，中景特写切换', status: 'processing', progress: 65, createdAt: '2026-05-28 14:00' },
  { id: 't3', name: '除味蛋-开箱展示', type: 'image2video', sourceImage: '除味蛋主图', prompt: '产品360度旋转展示，柔和灯光，白色背景', status: 'queued', progress: 0, createdAt: '2026-05-28 14:15' },
  { id: 't4', name: '清洁片-动态海报', type: 'image2video', sourceImage: '清洁片海报', prompt: '动态文字弹入效果，促销倒计时，快节奏', status: 'failed', progress: 30, createdAt: '2026-05-28 09:00', error: '生成超时，请重试' },
  { id: 't5', name: '大促预热-素材混剪', type: 'text2video', prompt: '多个产品快剪合集，配合大促倒计时文字，热门BGM', status: 'queued', progress: 0, createdAt: '2026-05-28 15:00' },
]

const categories = ['全部', '产品主图', '产品视频', '达人素材', '广告素材', 'AI生成']
const products = ['冰箱除味剂', '多功能清洁膏', '冰箱除味蛋', '洗衣机清洁片', '除味棒', '厨房清洁剂']
const videoStyles = ['产品展示', '使用教程', '测评对比', '开箱', '促销混剪', '达人素材']

const taskStatusConfig: Record<GenerationTask['status'], { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive' }> = {
  queued: { label: '排队中', variant: 'secondary' },
  processing: { label: '生成中', variant: 'default' },
  completed: { label: '已完成', variant: 'default' },
  failed: { label: '失败', variant: 'destructive' },
}

export function AiStudioPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')

  // Generate form state
  const [genType, setGenType] = useState<'text2video' | 'image2video'>('text2video')
  const [genPrompt, setGenPrompt] = useState('')
  const [genStyle, setGenStyle] = useState('')
  const [genProduct, setGenProduct] = useState('')
  const [genName, setGenName] = useState('')

  const filtered = mockMaterials.filter((m) => {
    if (activeCategory !== '全部' && m.category !== activeCategory) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleGenerate = () => {
    // Would trigger API call in production
    setGenPrompt('')
    setGenName('')
    setGenProduct('')
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
            <h1 className='text-2xl font-bold tracking-tight'>AI 工作室</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              素材库管理 · Seedance 视频生成 · 批量生成队列
            </p>
          </div>
          <Button disabled size='sm'>
            <Upload className='mr-1.5 h-4 w-4' />
            上传素材
          </Button>
        </div>

        <Tabs defaultValue='library' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='library'>
              <FolderOpen className='mr-1.5 h-4 w-4' />素材库
            </TabsTrigger>
            <TabsTrigger value='generate'>
              <Sparkles className='mr-1.5 h-4 w-4' />AI 生成
            </TabsTrigger>
            <TabsTrigger value='queue'>
              <Clock className='mr-1.5 h-4 w-4' />生成队列
            </TabsTrigger>
          </TabsList>

          {/* ── 素材库 ── */}
          <TabsContent value='library'>
            <div className='mb-4 flex flex-wrap items-center gap-3'>
              <div className='relative w-64'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input placeholder='搜索素材...' className='pl-9' value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className='flex gap-1.5 flex-wrap'>
                {categories.map((cat) => (
                  <Badge key={cat} variant={activeCategory === cat ? 'default' : 'outline'} className='cursor-pointer' onClick={() => setActiveCategory(cat)}>{cat}</Badge>
                ))}
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {filtered.map((item) => (
                <Card key={item.id} className='group cursor-pointer transition-shadow hover:shadow-md'>
                  <CardContent className='p-0'>
                    <div className='flex h-40 items-center justify-center rounded-t-lg bg-muted/30'>
                      {item.type === 'image' ? <Image className='h-10 w-10 text-muted-foreground/30' /> : <Video className='h-10 w-10 text-muted-foreground/30' />}
                    </div>
                    <div className='p-3'>
                      <p className='text-sm font-medium truncate'>{item.name}</p>
                      <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
                        <span>{item.size}</span><span>{item.uploadDate}</span>
                      </div>
                      <div className='mt-2 flex gap-1'>{item.tags.map((tag) => <Badge key={tag} variant='secondary' className='text-[10px] px-1.5'>{tag}</Badge>)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── AI 生成 ── */}
          <TabsContent value='generate'>
            <div className='grid gap-6 lg:grid-cols-2'>
              {/* Generation Config */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Sparkles className='h-5 w-5 text-amber-500' />
                    Seedance 视频生成
                  </CardTitle>
                  <CardDescription>输入文案或上传图片，AI 自动生成带货视频</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid gap-2'>
                    <Label>生成方式</Label>
                    <Select value={genType} onValueChange={(v) => setGenType(v as 'text2video' | 'image2video')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value='text2video'>文生视频 — 通过文字描述生成</SelectItem>
                        <SelectItem value='image2video'>图生视频 — 上传产品图生成</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {genType === 'image2video' && (
                    <div className='grid gap-2'>
                      <Label>上传产品图</Label>
                      <div className='flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors'>
                        <div className='text-center'>
                          <Image className='mx-auto h-8 w-8 mb-1' />
                          <span className='text-xs'>点击或拖拽上传</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className='grid gap-2'>
                    <Label>{genType === 'text2video' ? '视频描述 (Prompt)' : '补充描述 (可选)'}</Label>
                    <Textarea
                      rows={4}
                      placeholder={genType === 'text2video' ? '描述你想要的视频画面，如：展示冰箱除味剂的使用场景，明亮厨房，产品特写...' : '补充动态效果描述...'}
                      value={genPrompt}
                      onChange={(e) => setGenPrompt(e.target.value)}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div className='grid gap-2'>
                      <Label>视频风格</Label>
                      <Select value={genStyle} onValueChange={setGenStyle}>
                        <SelectTrigger><SelectValue placeholder='选择风格' /></SelectTrigger>
                        <SelectContent>{videoStyles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className='grid gap-2'>
                      <Label>关联商品</Label>
                      <Select value={genProduct} onValueChange={setGenProduct}>
                        <SelectTrigger><SelectValue placeholder='选择商品' /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='grid gap-2'>
                    <Label>任务名称</Label>
                    <Input placeholder='给生成任务起个名字...' value={genName} onChange={(e) => setGenName(e.target.value)} />
                  </div>

                  <Button className='w-full' onClick={handleGenerate} disabled={genType === 'text2video' ? !genPrompt : true}>
                    <Sparkles className='mr-2 h-4 w-4' />
                    开始生成
                  </Button>
                </CardContent>
              </Card>

              {/* Preview / Info */}
              <Card>
                <CardHeader>
                  <CardTitle>生成预览</CardTitle>
                  <CardDescription>最近生成的视频素材</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {mockTasks.filter(t => t.status === 'completed').slice(0, 3).map((t) => (
                    <div key={t.id} className='flex items-center gap-3 rounded-lg border p-3'>
                      <div className='flex h-16 w-24 items-center justify-center rounded bg-muted flex-shrink-0'>
                        <Play className='h-5 w-5 text-muted-foreground/40' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>{t.name}</p>
                        <div className='flex items-center gap-2 mt-1'>
                          <Badge variant='outline' className='text-[10px]'>{t.duration}s</Badge>
                          {t.linkedProduct && <Badge variant='secondary' className='text-[10px]'>{t.linkedProduct}</Badge>}
                        </div>
                      </div>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <Link className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                  {mockTasks.filter(t => t.status === 'completed').length === 0 && (
                    <div className='flex min-h-[200px] flex-col items-center justify-center text-muted-foreground'>
                      <Film className='mb-2 h-8 w-8 opacity-30' />
                      <p className='text-sm'>暂无已完成的生成结果</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 生成队列 ── */}
          <TabsContent value='queue'>
            <Card>
              <CardHeader>
                <CardTitle>批量生成队列</CardTitle>
                <CardDescription>管理所有视频生成任务，支持批量提交和进度追踪</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {mockTasks.map((task) => (
                    <div key={task.id} className='rounded-lg border p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium'>{task.name}</span>
                          <Badge variant={task.status === 'processing' || task.status === 'queued' ? 'secondary' : task.status === 'completed' ? 'default' : 'destructive'}>
                            {taskStatusConfig[task.status].label}
                          </Badge>
                        </div>
                        <span className='text-xs text-muted-foreground'>{task.createdAt}</span>
                      </div>

                      {(task.status === 'processing' || task.status === 'queued') && (
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <span>{task.status === 'queued' ? '等待处理...' : `生成中 ${task.progress}%`}</span>
                          </div>
                          <Progress value={task.progress} className='h-2' />
                        </div>
                      )}

                      {task.status === 'completed' && (
                        <div className='flex items-center gap-3'>
                          <div className='flex h-12 w-20 items-center justify-center rounded bg-muted flex-shrink-0'>
                            <Play className='h-4 w-4 text-muted-foreground/40' />
                          </div>
                          <div className='flex-1'>
                            <p className='text-xs text-muted-foreground'>耗时 {task.duration}s · {task.completedAt}</p>
                            {task.linkedProduct && <Badge variant='secondary' className='mt-1 text-[10px]'>{task.linkedProduct}</Badge>}
                          </div>
                          <div className='flex gap-1'>
                            <Button variant='ghost' size='icon' className='h-7 w-7'><Link className='h-3.5 w-3.5' /></Button>
                            <Button variant='ghost' size='icon' className='h-7 w-7'><Trash2 className='h-3.5 w-3.5 text-destructive' /></Button>
                          </div>
                        </div>
                      )}

                      {task.status === 'failed' && (
                        <div className='flex items-center gap-2 text-sm text-destructive'>
                          <XCircle className='h-4 w-4' />
                          {task.error}
                          <Button variant='outline' size='sm' className='ml-auto'>重试</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
