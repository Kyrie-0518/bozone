import { mysqlTable, varchar, text, int, float, boolean, bigint, datetime, mysqlEnum } from 'drizzle-orm/mysql-core'

// ============ Auth Tables (Better-Auth) ============
export const user = mysqlTable('user', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  twoFactorEnabled: boolean('two_factor_enabled'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  phoneNumberVerified: boolean('phone_number_verified').notNull().default(false),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: varchar('ban_expires', { length: 100 }),
  role: varchar('role', { length: 50 }),
  username: varchar('username', { length: 255 }),
  disableResetPassword: boolean('disable_reset_password'),
  provider: varchar('provider', { length: 50 }),
  lastLogin: varchar('last_login', { length: 100 }),
})

export const session = mysqlTable('session', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: varchar('expires_at', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  activeOrganizationId: varchar('active_organization_id', { length: 36 }),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

export const account = mysqlTable('account', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: varchar('access_token_expires_at', { length: 100 }),
  refreshTokenExpiresAt: varchar('refresh_token_expires_at', { length: 100 }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

export const verification = mysqlTable('verification', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: varchar('expires_at', { length: 100 }).notNull(),
  createdAt: varchar('created_at', { length: 100 }),
  updatedAt: varchar('updated_at', { length: 100 }),
})

// ============ TikTok Shop ============
export const tiktokShop = mysqlTable('tiktok_shop', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }),
  region: varchar('region', { length: 10 }).notNull().default('MY'),
  shopId: varchar('shop_id', { length: 255 }).notNull().unique(),
  shopCipher: text('shop_cipher').notNull(),
  appKey: varchar('app_key', { length: 255 }).notNull(),
  appSecret: varchar('app_secret', { length: 255 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: varchar('token_expires_at', { length: 100 }),
  apiVersion: varchar('api_version', { length: 20 }).notNull().default('202309'),
  syncEnabled: boolean('sync_enabled').notNull().default(true),
  lastSyncedAt: varchar('last_synced_at', { length: 100 }),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

// ============ Products ============
export const product = mysqlTable('product', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  sku: varchar('sku', { length: 255 }).notNull().default(''),
  image: text('image'),
  images: text('images'),
  category: varchar('category', { length: 255 }).default(''),
  weight: float('weight').default(0),
  stock: int('stock').default(0),
  sellPrice: float('sell_price').default(0),
  costPrice: float('cost_price').default(0),
  platformProductId: varchar('platform_product_id', { length: 255 }),
  status: varchar('status', { length: 50 }).default('上架'),
  supplierId: int('supplier_id'),
  shopId: int('shop_id').references(() => tiktokShop.id, { onDelete: 'set null' }),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

// ============ Orders ============
export const order = mysqlTable('order', {
  id: int('id').autoincrement().primaryKey(),
  orderNo: varchar('order_no', { length: 255 }).notNull().unique(),
  shopId: int('shop_id').references(() => tiktokShop.id, { onDelete: 'set null' }),
  buyerName: varchar('buyer_name', { length: 255 }).default(''),
  status: varchar('status', { length: 50 }).default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).default('unpaid'),
  logisticsStatus: varchar('logistics_status', { length: 50 }).default(''),
  trackingNo: varchar('tracking_no', { length: 255 }).default(''),
  carrier: varchar('carrier', { length: 255 }).default(''),
  itemTotal: float('item_total').default(0),
  shippingFee: float('shipping_fee').default(0),
  discount: float('discount').default(0),
  taxes: float('taxes').default(0),
  actualAmount: float('actual_amount').default(0),
  currency: varchar('currency', { length: 10 }).default('MYR'),
  remark: text('remark'),
  orderTime: varchar('order_time', { length: 100 }),
  shipDeadline: varchar('ship_deadline', { length: 100 }),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

export const orderItem = mysqlTable('order_item', {
  id: int('id').autoincrement().primaryKey(),
  orderId: int('order_id').notNull().references(() => order.id, { onDelete: 'cascade' }),
  productId: int('product_id').references(() => product.id, { onDelete: 'set null' }),
  sku: varchar('sku', { length: 255 }).default(''),
  productName: varchar('product_name', { length: 500 }).default(''),
  image: text('image'), // TikTok SDK skuImage (商品主图 URL)
  quantity: int('quantity').default(1),
  unitPrice: float('unit_price').default(0),
  subtotal: float('subtotal').default(0),
})

// ============ Finance ============
export const costItem = mysqlTable('cost_item', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  chargeType: varchar('charge_type', { length: 50 }).notNull().default('fixed'),
  value: float('value').default(0),
  currency: varchar('currency', { length: 10 }).default('RMB'),
  formula: text('formula'),
  scope: varchar('scope', { length: 50 }).default('all'),
  isActive: boolean('is_active').default(true),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

export const exchangeRate = mysqlTable('exchange_rate', {
  id: int('id').autoincrement().primaryKey(),
  fromCurrency: varchar('from_currency', { length: 10 }).notNull(),
  toCurrency: varchar('to_currency', { length: 10 }).notNull(),
  rate: float('rate').notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

// ============ Influencers ============
export const influencer = mysqlTable('influencer', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  tiktokId: varchar('tiktok_id', { length: 255 }).default(''),
  followers: int('followers').default(0),
  country: varchar('country', { length: 10 }).default('MY'),
  contactInfo: text('contact_info'),
  contactChannel: varchar('contact_channel', { length: 255 }).default(''),
  productId: int('product_id').references(() => product.id, { onDelete: 'set null' }),
  commissionRate: float('commission_rate').default(0),
  cooperationStatus: varchar('cooperation_status', { length: 50 }).default('未联系'),
  remark: text('remark'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

// ============ AI Studio - Materials ============
export const material = mysqlTable('material', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  category: varchar('category', { length: 255 }).default('默认'),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: int('file_size').default(0),
  tags: text('tags'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
})

// ============ Inventory ============
export const inventory = mysqlTable('inventory', {
  id: int('id').autoincrement().primaryKey(),
  productId: int('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  warehouse: varchar('warehouse', { length: 255 }).default('默认仓库'),
  location: varchar('location', { length: 255 }).default(''),
  quantity: int('quantity').default(0),
  safetyStock: int('safety_stock').default(0),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

export const inventoryMovement = mysqlTable('inventory_movement', {
  id: int('id').autoincrement().primaryKey(),
  productId: int('product_id').references(() => product.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }).notNull(),
  quantity: int('quantity').notNull(),
  source: varchar('source', { length: 255 }).default(''),
  operator: varchar('operator', { length: 255 }).default(''),
  remark: text('remark'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
})

export const shipment = mysqlTable('shipment', {
  id: int('id').autoincrement().primaryKey(),
  orderId: int('order_id').references(() => order.id, { onDelete: 'set null' }),
  trackingNo: varchar('tracking_no', { length: 255 }).default(''),
  carrier: varchar('carrier', { length: 255 }).default(''),
  origin: varchar('origin', { length: 255 }).default(''),
  destination: varchar('destination', { length: 255 }).default(''),
  weight: float('weight').default(0),
  estimatedDelivery: varchar('estimated_delivery', { length: 100 }),
  actualDelivery: varchar('actual_delivery', { length: 100 }),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
})

// ============ TikTok Ads Account (广告API授权) ============
export const tiktokAdAccount = mysqlTable('tiktok_ad_account', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  advertiserId: varchar('advertiser_id', { length: 64 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }),
  appId: varchar('app_id', { length: 64 }).notNull(),
  appSecret: text('app_secret').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: varchar('token_expires_at', { length: 100 }),
  region: varchar('region', { length: 10 }).notNull().default('MY'),
  currency: varchar('currency', { length: 10 }).notNull().default('MYR'),
  timezone: varchar('timezone', { length: 50 }),
  status: mysqlEnum('status', ['active', 'expired', 'revoked', 'error']).default('active'),
  lastSyncedAt: varchar('last_synced_at', { length: 100 }),
  errorMessage: text('error_message'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

// ============ Ads ============
export const adCampaign = mysqlTable('ad_campaign', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  objective: varchar('objective', { length: 100 }).default('conversion'),
  budget: float('budget').default(0),
  spent: float('spent').default(0),
  impressions: int('impressions').default(0),
  clicks: int('clicks').default(0),
  ctr: float('ctr').default(0),
  conversions: int('conversions').default(0),
  cpa: float('cpa').default(0),
  roas: float('roas').default(0),
  status: varchar('status', { length: 50 }).default('draft'),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
  updatedAt: varchar('updated_at', { length: 100 }).notNull(),
})

// ============ Audit Logs ============
export const auditLog = mysqlTable('audit_log', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  username: varchar('username', { length: 255 }).default(''),
  action: varchar('action', { length: 500 }).notNull().default(''),
  method: varchar('method', { length: 10 }).default(''),
  path: varchar('path', { length: 500 }).default(''),
  detail: text('detail'),
  ip: varchar('ip', { length: 50 }).default(''),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
})

// ============ Sync Log ============
export const syncLog = mysqlTable('sync_log', {
  id: int('id').autoincrement().primaryKey(),
  shopId: int('shop_id').references(() => tiktokShop.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('running'),
  total: int('total').default(0),
  success: int('success').default(0),
  fail: int('fail').default(0),
  error: text('error'),
  startedAt: varchar('started_at', { length: 100 }).notNull(),
  finishedAt: varchar('finished_at', { length: 100 }),
  createdAt: varchar('created_at', { length: 100 }).notNull(),
})

// ============ Settings ============
export const setting = mysqlTable('setting', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value'),
})
