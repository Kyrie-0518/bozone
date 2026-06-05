import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = `file:${path.join(__dirname, '..', 'data', 'bozone.db')}`

const turso = createClient({ url: dbPath })
export const db = drizzle(turso)

// ── Create all business tables ──
export async function initBusinessTables() {
  const c = createClient({ url: dbPath })
  try {
    await c.batch([
      // TikTok Shop
      `CREATE TABLE IF NOT EXISTS "tiktok_shop" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT, "region" TEXT NOT NULL DEFAULT 'MY',
        "shop_id" TEXT NOT NULL UNIQUE, "shop_cipher" TEXT NOT NULL,
        "app_key" TEXT NOT NULL, "app_secret" TEXT NOT NULL,
        "access_token" TEXT NOT NULL, "refresh_token" TEXT NOT NULL,
        "token_expires_at" TEXT, "api_version" TEXT NOT NULL DEFAULT '202309',
        "sync_enabled" INTEGER NOT NULL DEFAULT 1, "last_synced_at" TEXT,
        "created_at" TEXT NOT NULL, "updated_at" TEXT NOT NULL
      )`,
      // Products
      `CREATE TABLE IF NOT EXISTS "product" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "sku" TEXT NOT NULL DEFAULT '',
        "image" TEXT DEFAULT '', "weight" REAL DEFAULT 0, "stock" INTEGER DEFAULT 0,
        "sell_price" REAL DEFAULT 0, "cost_price" REAL DEFAULT 0, "supplier_id" INTEGER,
        "shop_id" INTEGER REFERENCES "tiktok_shop"("id") ON DELETE SET NULL,
        "created_at" TEXT NOT NULL, "updated_at" TEXT NOT NULL
      )`,
      // Orders
      `CREATE TABLE IF NOT EXISTS "order" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "order_no" TEXT NOT NULL UNIQUE,
        "shop_id" INTEGER REFERENCES "tiktok_shop"("id") ON DELETE SET NULL,
        "buyer_name" TEXT DEFAULT '', "status" TEXT DEFAULT 'pending',
        "payment_status" TEXT DEFAULT 'unpaid', "logistics_status" TEXT DEFAULT '',
        "tracking_no" TEXT DEFAULT '', "carrier" TEXT DEFAULT '',
        "item_total" REAL DEFAULT 0, "shipping_fee" REAL DEFAULT 0,
        "discount" REAL DEFAULT 0, "taxes" REAL DEFAULT 0,
        "actual_amount" REAL DEFAULT 0, "currency" TEXT DEFAULT 'MYR',
        "remark" TEXT DEFAULT '', "order_time" TEXT, "ship_deadline" TEXT,
        "created_at" TEXT NOT NULL, "updated_at" TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "order_item" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "order_id" INTEGER NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
        "product_id" INTEGER REFERENCES "product"("id") ON DELETE SET NULL,
        "sku" TEXT DEFAULT '', "product_name" TEXT DEFAULT '',
        "quantity" INTEGER DEFAULT 1, "unit_price" REAL DEFAULT 0, "subtotal" REAL DEFAULT 0
      )`,
      // Finance
      `CREATE TABLE IF NOT EXISTS "cost_item" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL UNIQUE,
        "charge_type" TEXT NOT NULL DEFAULT 'fixed', "value" REAL DEFAULT 0,
        "currency" TEXT DEFAULT 'RMB', "formula" TEXT DEFAULT '', "scope" TEXT DEFAULT 'all',
        "is_active" INTEGER DEFAULT 1, "created_at" TEXT NOT NULL, "updated_at" TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "exchange_rate" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "from_currency" TEXT NOT NULL, "to_currency" TEXT NOT NULL,
        "rate" REAL NOT NULL, "updated_at" TEXT NOT NULL
      )`,
      // Influencers
      `CREATE TABLE IF NOT EXISTS "influencer" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL,
        "tiktok_id" TEXT DEFAULT '', "followers" INTEGER DEFAULT 0,
        "country" TEXT DEFAULT 'MY', "contact_info" TEXT DEFAULT '',
        "contact_channel" TEXT DEFAULT '', "product_id" INTEGER REFERENCES "product"("id") ON DELETE SET NULL,
        "commission_rate" REAL DEFAULT 0, "cooperation_status" TEXT DEFAULT '未联系',
        "remark" TEXT DEFAULT '', "created_at" TEXT NOT NULL, "updated_at" TEXT NOT NULL
      )`,
      // AI Materials
      `CREATE TABLE IF NOT EXISTS "material" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL,
        "category" TEXT DEFAULT '默认', "file_type" TEXT NOT NULL,
        "file_url" TEXT NOT NULL, "file_size" INTEGER DEFAULT 0,
        "tags" TEXT DEFAULT '[]', "created_at" TEXT NOT NULL
      )`,
      // Inventory
      `CREATE TABLE IF NOT EXISTS "inventory" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "product_id" INTEGER NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
        "warehouse" TEXT DEFAULT '默认仓库', "location" TEXT DEFAULT '',
        "quantity" INTEGER DEFAULT 0, "safety_stock" INTEGER DEFAULT 0,
        "updated_at" TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "inventory_movement" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "product_id" INTEGER REFERENCES "product"("id") ON DELETE SET NULL,
        "type" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
        "source" TEXT DEFAULT '', "operator" TEXT DEFAULT '',
        "remark" TEXT DEFAULT '', "created_at" TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "shipment" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "order_id" INTEGER REFERENCES "order"("id") ON DELETE SET NULL,
        "tracking_no" TEXT DEFAULT '', "carrier" TEXT DEFAULT '',
        "origin" TEXT DEFAULT '', "destination" TEXT DEFAULT '',
        "weight" REAL DEFAULT 0, "estimated_delivery" TEXT, "actual_delivery" TEXT,
        "status" TEXT DEFAULT 'pending', "created_at" TEXT NOT NULL
      )`,
      // Ads
      `CREATE TABLE IF NOT EXISTS "ad_campaign" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL,
        "objective" TEXT DEFAULT 'conversion', "budget" REAL DEFAULT 0,
        "spent" REAL DEFAULT 0, "impressions" INTEGER DEFAULT 0,
        "clicks" INTEGER DEFAULT 0, "ctr" REAL DEFAULT 0,
        "conversions" INTEGER DEFAULT 0, "cpa" REAL DEFAULT 0,
        "roas" REAL DEFAULT 0, "status" TEXT DEFAULT 'draft',
        "created_at" TEXT NOT NULL, "updated_at" TEXT NOT NULL
      )`,
      // Audit Logs
      `CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT, "user_id" TEXT,
        "username" TEXT DEFAULT '', "action" TEXT NOT NULL DEFAULT '',
        "method" TEXT DEFAULT '', "path" TEXT DEFAULT '', "detail" TEXT DEFAULT '',
        "ip" TEXT DEFAULT '', "created_at" TEXT NOT NULL
      )`,
      // Settings
      `CREATE TABLE IF NOT EXISTS "setting" (
        "key" TEXT PRIMARY KEY, "value" TEXT DEFAULT '{}'
      )`,
    ])
    console.log('[DB] All business tables ready.')
  } finally {
    c.close()
  }
}
