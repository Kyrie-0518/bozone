/**
 * TikTok Shop AffiliateSeller (达人) API Service
 * Based on official SDK V202508 — latest complete version
 *
 * AS-001: sellerSearchCreatorOnMarketplace → 搜索达人
 * AS-002: getMarketplaceCreatorPerformance → 达人详情画像
 */
import { apiCall } from './tiktok-auth.js'

// ── Types ──

/** AS-001: Search result creator item (simplified from SDK 50+ fields) */
export interface CreatorSearchResult {
  // Basic
  creatorOpenId: string
  username: string
  nickname: string
  avatar?: { url?: string }
  selectionRegion?: string
  bioDescription?: string
  profileTtUri?: string

  // Followers & Content
  followerCount: number
  ecVideoCount?: number
  ecLiveCount?: number
  avgEcVideoViewCount?: number
  avgEcLiveUv?: number
  ecVideoEngagementRate?: number
  ecLiveEngagementRate?: number

  // GMV & Sales
  gmv?: { amount?: number; currency?: string; range?: { formatted?: string } }
  videoGmv?: { amount?: number; currency?: string; range?: { formatted?: string } }
  liveGmv?: { amount?: number; currency?: string; range?: { formatted?: string } }
  unitsSoldRange?: { formatted?: string }

  // Demographics
  topFollowerDemographics?: Array<{ gender?: string; ageGroup?: string; region?: string }>

  // Category
  categoryIds?: string[]
}

/** AS-001: Search request filters */
export interface CreatorSearchParams {
  keyword?: string                          // 搜索关键词（匹配 username / nickname）
  pageSize?: number                         // 必填: 12 或 20
  pageToken?: string                        // 分页 token
  searchKey?: string                        // 缓存 key（首次不传）

  // 筛选器
  gmvRanges?: string[]                      // GMV 区间
  unitsSoldRanges?: string[]                // 销量区间
  categories?: string[]                     // 类目 ID 列表
  followerMin?: number                      // 最小粉丝数
  followerMax?: number                      // 最大粉丝数
  region?: string                           // 运营区域
}

/** AS-002: Full creator performance detail (~50 fields, simplified) */
export interface CreatorPerformance {
  // Basic
  creatorOpenId: string
  username: string
  nickname: string
  avatar?: { url?: string }
  bioDescription?: string
  profileTtUri?: string
  selectionRegion?: string

  // Followers
  followerCount: number
  followerAge?: Array<{ ageRange: string; percentage: number }>
  followerGender?: Array<{ gender: string; percentage: number }>
  followerLocation?: Array<{ region: string; percentage: number }>

  // GMV (all amounts in MYR or shop currency)
  gmv?: { amount: number; currency: string; range: { formatted: string } }
  videoGmv?: { amount: number; currency: string; range: { formatted: string } }
  liveGmv?: { amount: number; currency: string; range: { formatted: string } }
  gmvRange?: { min?: number; max?: number; formatted: string }
  videoGmvRange?: { min?: number; max?: number; formatted: string }
  liveGmvRange?: { min?: number; max?: number; formatted: string }
  avgGmvPerBuyer?: number

  // GPM (GMV per 1000 views)
  gpm?: number
  gpmRange?: { formatted: string }
  videoGpm?: number
  liveGpm?: number
  videoGpmRange?: { formatted: string }
  liveGpmRange?: { formatted: string }

  // Sales
  unitsSold?: number
  unitsSoldRange?: { formatted: string }
  productOriginalPriceRange?: { min?: number; max?: number; formatted: string }

  // Content Performance
  ecVideoCount: number
  ecLiveCount: number
  avgEcVideoPlayCount: number
  avgEcVideoLikeCount: number
  avgEcVideoCommentCount: number
  avgEcVideoShareCount: number
  avgEcLiveUv: number
  avgEcLiveLikeCount: number
  avgEcLiveCommentCount: number
  avgEcLiveShareCount: number
  ecVideoEngagementRate: number
  ecLiveEngagementRate: number

  // Collaboration Info
  brandCollaborationCount?: number
  topCollaboratedBrandIds?: string[]
  promotedProductNum?: number
  avgCommissionRate?: number
  avgCommissionRateRange?: { min?: number; max?: number; formatted: string }
  rating?: number

  // Distribution
  categoryGmvDistribution?: Array<{ categoryId: string; categoryName?: string; gmv: number }>
  contentGmvDistribution?: Array<{ contentType: string; gmv: number }>

  // Quality Scores
  pps?: number          // Promotion Performance Score
  postRate?: number      // Sample post rate
}

// ── Helpers ──

function n(v: any): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v) || 0
  if (typeof v === 'object') {
    if (v.amount != null) return typeof v.amount === 'number' ? v.amount : parseFloat(v.amount) || 0
    if (v.value_string) return parseFloat(v.value_string) || 0
    return 0
  }
  return 0
}

function str(v: any): string {
  if (!v) return ''
  return String(v)
}

function avatarUrl(avatar: any): string | undefined {
  if (!avatar) return undefined
  if (typeof avatar === 'string') return avatar
  return avatar?.url || undefined
}

// ── AS-001: Search Creators on Marketplace ──
// SDK: affiliateSellerV202508Api.MarketplaceCreatorsSearchPost
// POST /affiliate_seller/202508/marketplace_creators/search
export async function searchCreators(
  params: CreatorSearchParams,
  token: string,
  shopCipher: string,
): Promise<{
  creators: CreatorSearchResult[]
  nextPageToken: string
  searchKey: string
}> {
  const body: Record<string, any> = {}

  // Keyword search
  if (params.keyword) body.keyword = params.keyword

  // Filters
  const filters: any = {}
  if (params.gmvRanges?.length) {
    filters.affiliate_data = { ...filters.affiliate_data, gvm_ranges: params.gmvRanges }
  }
  if (params.unitsSoldRanges?.length) {
    filters.affiliate_data = { ...filters.affiliate_data, units_sold_ranges: params.unitsSoldRanges }
  }
  if (params.categories?.length) {
    filters.category = params.categories.map(c => ({ category_id: c }))
  }
  if (params.followerMin !== undefined || params.followerMax !== undefined) {
    filters.follower_demographics = {
      ...(params.followerMin !== undefined ? { min_follower_count: params.followerMin } : {}),
      ...(params.followerMax !== undefined ? { max_follower_count: params.followerMax } : {}),
    }
  }
  if (params.region) {
    filters.content_performance = { ...filters.content_performance, selection_region: params.region }
  }
  if (Object.keys(filters).length > 0) {
    body.advanced_filters = filters
  }

  // Cache key for pagination
  if (params.searchKey) body.search_key = params.searchKey

  // Query parameters (pageSize is required, must be 12 or 20)
  const queryExtras: Record<string, string> = {
    page_size: String(params.pageSize || 20),
  }
  if (params.pageToken) queryExtras.page_token = params.pageToken

  console.log(`[Influencer] Searching creators... keyword=${params.keyword || '(all)'}, pageSize=${queryExtras.page_size}`)

  const result = await apiCall(
    '/affiliate_seller/202508/marketplace_creators/search',
    token,
    shopCipher,
    { method: 'POST', body: Object.keys(body).length > 0 ? body : undefined, _extraQuery: queryExtras },
  )

  const data = result?.data as any
  if (!data) return { creators: [], nextPageToken: '', searchKey: '' }

  const creators: CreatorSearchResult[] = (data.creators || []).map((c: any) => ({
    creatorOpenId: str(c.creator_open_id),
    username: str(c.username),
    nickname: str(c.nickname),
    avatar: c.avatar ? { url: avatarUrl(c.avatar) } : undefined,
    selectionRegion: str(c.selection_region),
    bioDescription: str(c.bio_description),
    profileTtUri: str(c.profile_tt_uri),

    followerCount: n(c.follower_count),
    ecVideoCount: n(c.ec_video_count),
    ecLiveCount: n(c.ec_live_count),
    avgEcVideoViewCount: n(c.avg_ec_video_view_count),
    avgEcLiveUv: n(c.avg_ec_live_uv),
    ecVideoEngagementRate: n(c.ec_video_engagement_rate),
    ecLiveEngagementRate: n(c.ec_live_engagement_rate),

    gmv: c.gmv ? { amount: n(c.gmv.amount), currency: c.gmv.currency, range: c.gmv.range } : undefined,
    videoGmv: c.video_gmv ? { amount: n(c.video_gmv.amount), currency: c.video_gmv.currency, range: c.video_gmv.range } : undefined,
    liveGmv: c.live_gmv ? { amount: n(c.live_gmv.amount), currency: c.live_gmv.currency, range: c.live_gmv.range } : undefined,
    unitsSoldRange: c.units_sold_range,

    topFollowerDemographics: c.top_follower_demographics || [],
    categoryIds: c.category_ids || [],
  }))

  console.log(`[Influencer] Found ${creators.length} creators`)
  return {
    creators,
    nextPageToken: str(data.next_page_token),
    searchKey: str(data.search_key),
  }
}

// ── AS-002: Get Creator Full Performance Detail ──
// SDK: affiliateSellerV202508Api.MarketplaceCreatorsCreatorUserIdGet
// GET /affiliate_seller/202508/marketplace_creators/{creator_user_id}
export async function getCreatorPerformance(
  creatorUserId: string,
  token: string,
  shopCipher: string,
): Promise<CreatorPerformance | null> {
  try {
    console.log(`[Influencer] Fetching performance for creator ${creatorUserId}...`)

    const result = await apiCall(
      `/affiliate_seller/202508/marketplace_creators/${creatorUserId}`,
      token,
      shopCipher,
      // GET request, no body
    )

    const d = result?.data as any
    if (!d?.creator) return null

    const c = d.creator

    return {
      // Basic
      creatorOpenId: str(c.creator_open_id || c.creator_user_id),
      username: str(c.username),
      nickname: str(c.nickname),
      avatar: c.avatar ? { url: avatarUrl(c.avatar) } : undefined,
      bioDescription: str(c.bio_description),
      profileTtUri: str(c.profile_tt_uri),
      selectionRegion: str(c.selection_region),

      // Followers
      followerCount: n(c.follower_count),
      followerAge: (c.follower_age || []).map((a: any) => ({ ageRange: str(a.age_range), percentage: n(a.percentage) })),
      followerGender: (c.follower_gender || []).map((g: any) => ({ gender: str(g.gender), percentage: n(g.percentage) })),
      followerLocation: (c.follower_location || []).map((l: any) => ({ region: str(l.region), percentage: n(l.percentage) })),

      // GMV
      gmv: c.gmv ? { amount: n(c.gmv.amount), currency: c.gmv.currency || 'MYR', range: c.gmv.range || {} } : undefined,
      videoGmv: c.video_gmv ? { amount: n(c.video_gmv.amount), currency: c.video_gmv.currency || 'MYR', range: c.video_gmv.range || {} } : undefined,
      liveGmv: c.live_gmv ? { amount: n(c.live_gmv.amount), currency: c.live_gmv.currency || 'MYR', range: c.live_gmv.range || {} } : undefined,
      gmvRange: c.gmv_range,
      videoGmvRange: c.video_gmv_range,
      liveGmvRange: c.live_gmv_range,
      avgGmvPerBuyer: n(c.avg_gmv_per_buyer),

      // GPM
      gpm: n(c.gpm),
      gpmRange: c.gpm_range,
      videoGpm: n(c.video_gpm),
      liveGpm: n(c.live_gpm),
      videoGpmRange: c.video_gpm_range,
      liveGpmRange: c.live_gpm_range,

      // Sales
      unitsSold: n(c.units_sold),
      unitsSoldRange: c.units_sold_range,
      productOriginalPriceRange: c.product_original_price_range,

      // Content
      ecVideoCount: n(c.ec_video_count),
      ecLiveCount: n(c.ec_live_count),
      avgEcVideoPlayCount: n(c.avg_ec_video_play_count),
      avgEcVideoLikeCount: n(c.avg_ec_video_like_count),
      avgEcVideoCommentCount: n(c.avg_ec_video_comment_count),
      avgEcVideoShareCount: n(c.avg_ec_video_share_count),
      avgEcLiveUv: n(c.avg_ec_live_uv),
      avgEcLiveLikeCount: n(c.avg_ec_live_like_count),
      avgEcLiveCommentCount: n(c.avg_ec_live_comment_count),
      avgEcLiveShareCount: n(c.avg_ec_live_share_count),
      ecVideoEngagementRate: n(c.ec_video_engagement_rate),
      ecLiveEngagementRate: n(c.ec_live_engagement_rate),

      // Collaboration
      brandCollaborationCount: n(c.brand_collaboration_count),
      topCollaboratedBrandIds: c.top_collaborated_brand_ids || [],
      promotedProductNum: n(c.promoted_product_num),
      avgCommissionRate: n(c.avg_commission_rate),
      avgCommissionRateRange: c.avg_commission_rate_range,
      rating: n(c.rating),

      // Distribution
      categoryGmvDistribution: (c.category_gmv_distribution || []).map((d: any) => ({
        categoryId: str(d.category_id),
        categoryName: str(d.category_name),
        gmv: n(d.gmv),
      })),
      contentGmvDistribution: (c.content_gmv_distribution || []).map((d: any) => ({
        contentType: str(d.content_type),
        gmv: n(d.gmv),
      })),

      // Quality scores
      pps: n(c.pps),
      postRate: n(c.post_rate),
    }
  } catch (e: any) {
    console.error(`[Influencer] Failed to fetch performance for ${creatorUserId}:`, e.message?.slice(0, 200))
    return null
  }
}
