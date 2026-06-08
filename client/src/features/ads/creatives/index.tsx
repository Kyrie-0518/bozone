/**
 * 创意素材管理页面
 * 
 * 从 TikTok API 获取真实的广告创意列表（视频/图片）
 * 展示关键效果指标：播放量、CTR、CPA、花费等
 */
import { useState, useEffect } from 'react'
import { ImagePlus, Upload, Search, Filter, Play, Film, Image as ImageIcon, Eye, BarChart3 } from 'lucide-react'
import { api } from '@/lib/api'

interface Creative {
  ad_id?: string
  ad_name?: string
  image_url?: string
  video_url?: string
  format?: string // VIDEO / IMAGE
  spend?: number
  impressions?: number
  clicks?: number
  ctr?: number
  cpc?: number
  conversion?: number
  cpa?: number
  status?: string
}

export function AdsCreativesPage() {
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadCreatives() }, [])

  async function loadCreatives() {
    setLoading(true)
    try {
      const res = await api.get('/api/ads/creatives')
      if (res.data.success) {
        setCreatives(res.data.data || [])
      }
    } catch {}
    setLoading(false)
  }

  const isVideo = (c: Creative) => (c.format || '').toLowerCase().includes('video') || !!c.video_url

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ImagePlus className="h-6 w-6 text-pink-500" /> 创意素材
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input placeholder="搜索素材..." className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-pink-300 outline-none w-48" />
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 text-sm font-medium">
            <Upload className="h-4 w-4" /> 上传素材
          </button>
        </div>
      </div>

      {/* 状态说明条 */}
      <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 正常投放</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> 测试中</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> 已暂停</span>
        <span className="ml-auto">数据来源: TikTok Ads API</span>
      </div>

      {/* 素材网格 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse overflow-hidden">
              <div className="bg-slate-200 aspect-square" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : creatives.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300">
          <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">暂无素材</p>
          <p className="text-sm text-slate-400 mt-1">请先授权广告账户并创建广告系列</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {creatives.map((item, i) => {
              const video = isVideo(item)
              return (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                  {/* 缩略图/视频预览 */}
                  <div className="relative bg-slate-100 aspect-square overflow-hidden">
                    {video ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                        <Play className="h-10 w-10 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                        <Film className="absolute bottom-2 right-2 h-4 w-4 text-white/60" />
                      </div>
                    ) : item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = '' }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* 信息区 */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate text-sm" title={item.ad_name}>
                        {item.ad_name || `素材 #${i + 1}`}
                      </span>
                      <span className={`shrink-0 text-[11px] px-1.5 py-0.5 rounded ${
                        item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{item.status || 'UNKNOWN'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                      <div>
                        <span className="block text-slate-400">曝光</span>
                        <span className="font-mono">{(item.impressions || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">点击</span>
                        <span className="font-mono">{(item.clicks || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">CTR</span>
                        <span className="font-mono">{(item.ctr || 0).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                      <span>CPA ¥{(item.cpa || 0).toFixed(1)}</span>
                      <span className="font-mono">¥{item.spend?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 底部汇总 */}
          <div className="flex justify-between items-center text-sm text-slate-500 px-1">
            <span>{creatives.length} 个素材 · 视频: {creatives.filter(isVideo).length} · 图片: {creatives.filter(c => !isVideo(c)).length}</span>
            <span>总花费: ¥{creatives.reduce((s, c) => s + (c.spend || 0), 0).toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  )
}
