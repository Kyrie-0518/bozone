/**
 * TikTok Business API (Ads) — Token 管理服务
 * 
 * 对标 tiktok-auth.ts（Shop API）的相同模式：
 * - Token 存数据库 (tiktok_ad_account 表)
 * - 自动刷新机制
 * - 内存缓存避免频繁查询
 */

import { db } from '../db.js'
import { tiktokAdAccount } from '../db-schema.js'
import { eq } from 'drizzle-orm'

// ── 内存缓存 ──
let cache: {
  advertiserId: string
  accessToken: string
  expiresAt: number
} | null = null

/**
 * 获取有效的 Access Token（自动刷新）
 */
export async function getValidAdsToken(advertiserId: string): Promise<string> {
  // 1. 检查内存缓存
  if (cache && cache.advertiserId === advertiserId && Date.now() < cache.expiresAt) {
    return cache.accessToken
  }

  // 2. 从数据库读取账户信息
  const [account] = await db.select().from(tiktokAdAccount).where(eq(tiktokAdAccount.advertiserId, advertiserId))
  if (!account) throw new Error(`广告账户不存在: ${advertiserId}`)

  // 3. 检查 token 是否还有效（提前5分钟刷新）
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt).getTime() : 0
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    // Token 仍然有效，更新缓存
    cache = { advertiserId, accessToken: account.accessToken!, expiresAt }
    return account.accessToken!
  }

  // 4. Token 过期，使用 refresh_token 刷新
  return refreshAdsToken(advertiserId, account.refreshToken)
}

/**
 * 使用 RefreshToken 刷新 AccessToken
 */
async function refreshAdsToken(advertiserId: string, refreshToken: string): Promise<string> {
  const [account] = await db.select().from(tiktokAdAccount).where(eq(tiktokAdAccount.advertiserId, advertiserId))

  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: account!.appId,
        app_secret: account!.appSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    const data = await res.json() as any
    if (data.code !== 0) {
      throw new Error(`刷新Token失败: ${data.message || JSON.stringify(data)}`)
    }

    const newAccessToken = data.data.access_token
    const newRefreshToken = data.data.refresh_token
    const expiresIn = data.data.expires_in || 86400 // 默认24小时
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // 更新数据库
    await db.update(tiktokAdAccount).set({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenExpiresAt: newExpiresAt,
      status: 'active',
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(tiktokAdAccount.advertiserId, advertiserId))

    // 更新内存缓存
    cache = {
      advertiserId,
      accessToken: newAccessToken,
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    }

    console.log(`[AdsAuth] Token refreshed for advertiser ${advertiserId}`)
    return newAccessToken
  } catch (e: any) {
    // 标记为错误状态
    await db.update(tiktokAdAccount).set({
      status: 'error',
      errorMessage: e.message,
      updatedAt: new Date().toISOString(),
    }).where(eq(tiktokAdAccount.advertiserId, advertiserId))
    throw e
  }
}

/**
 * 清除缓存（用于手动触发刷新）
export function clearCache(): void {
  cache = null
}
*/

/**
 * 获取所有活跃的广告账户列表
 */
export async function listActiveAdAccounts() {
  return db.select({
    id: tiktokAdAccount.id,
    advertiserId: tiktokAdAccount.advertiserId,
    displayName: tiktokAdAccount.displayName,
    region: tiktokAdAccount.region,
    currency: tiktokAdAccount.currency,
    status: tiktokAdAccount.status,
    lastSyncedAt: tiktokAdAccount.lastSyncedAt,
    tokenExpiresAt: tiktokAdAccount.tokenExpiresAt,
  }).from(tiktokAdAccount).where(eq(tiktokAdAccount.status, 'active'))
}
