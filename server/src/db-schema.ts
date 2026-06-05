import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ============ Auth Tables (Better-Auth) ============
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  phoneNumber: text('phone_number'),
  phoneNumberVerified: integer('phone_number_verified', { mode: 'boolean' }).notNull().default(false),
  banned: integer('banned', { mode: 'boolean' }),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires'),
  role: text('role'),
  username: text('username'),
  disableResetPassword: integer('disable_reset_password', { mode: 'boolean' }),
  provider: text('provider'),
  lastLogin: integer('last_login'),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  activeOrganizationId: text('active_organization_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at'),
  refreshTokenExpiresAt: integer('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
})

// ============ TikTok Shop ============
export const tiktokShop = sqliteTable('tiktok_shop', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  region: text('region').notNull().default('MY'),
  shopId: text('shop_id').notNull().unique(),
  shopCipher: text('shop_cipher').notNull(),
  appKey: text('app_key').notNull(),
  appSecret: text('app_secret').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: text('token_expires_at'),
  apiVersion: text('api_version').notNull().default('202309'),
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).notNull().default(true),
  lastSyncedAt: text('last_synced_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// ============ Products ============
export const product = sqliteTable('product', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sku: text('sku').notNull().default(''),
  image: text('image').default(''),
  weight: real('weight').default(0),
  stock: integer('stock').default(0),
  sellPrice: real('sell_price').default(0),
  costPrice: real('cost_price').default(0),
  supplierId: integer('supplier_id'),
  shopId: integer('shop_id').references(() => tiktokShop.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// ============ Orders ============
export const order = sqliteTable('order', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNo: text('order_no').notNull().unique(),
  shopId: integer('shop_id').references(() => tiktokShop.id, { onDelete: 'set null' }),
  buyerName: text('buyer_name').default(''),
  status: text('status').default('pending'),
  paymentStatus: text('payment_status').default('unpaid'),
  logisticsStatus: text('logistics_status').default(''),
  trackingNo: text('tracking_no').default(''),
  carrier: text('carrier').default(''),
  itemTotal: real('item_total').default(0),
  shippingFee: real('shipping_fee').default(0),
  discount: real('discount').default(0),
  taxes: real('taxes').default(0),
  actualAmount: real('actual_amount').default(0),
  currency: text('currency').default('MYR'),
  remark: text('remark').default(''),
  orderTime: text('order_time'),
  shipDeadline: text('ship_deadline'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const orderItem = sqliteTable('order_item', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => order.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => product.id, { onDelete: 'set null' }),
  sku: text('sku').default(''),
  productName: text('product_name').default(''),
  quantity: integer('quantity').default(1),
  unitPrice: real('unit_price').default(0),
  subtotal: real('subtotal').default(0),
})

// ============ Finance ============
export const costItem = sqliteTable('cost_item', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  chargeType: text('charge_type').notNull().default('fixed'),
  value: real('value').default(0),
  currency: text('currency').default('RMB'),
  formula: text('formula').default(''),
  scope: text('scope').default('all'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const exchangeRate = sqliteTable('exchange_rate', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  rate: real('rate').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// ============ Influencers ============
export const influencer = sqliteTable('influencer', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  tiktokId: text('tiktok_id').default(''),
  followers: integer('followers').default(0),
  country: text('country').default('MY'),
  contactInfo: text('contact_info').default(''),
  contactChannel: text('contact_channel').default(''),
  productId: integer('product_id').references(() => product.id, { onDelete: 'set null' }),
  commissionRate: real('commission_rate').default(0),
  cooperationStatus: text('cooperation_status').default('未联系'),
  remark: text('remark').default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// ============ AI Studio - Materials ============
export const material = sqliteTable('material', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').default('默认'),
  fileType: text('file_type').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').default(0),
  tags: text('tags').default('[]'),
  createdAt: text('created_at').notNull(),
})

// ============ Inventory ============
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  warehouse: text('warehouse').default('默认仓库'),
  location: text('location').default(''),
  quantity: integer('quantity').default(0),
  safetyStock: integer('safety_stock').default(0),
  updatedAt: text('updated_at').notNull(),
})

export const inventoryMovement = sqliteTable('inventory_movement', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => product.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  source: text('source').default(''),
  operator: text('operator').default(''),
  remark: text('remark').default(''),
  createdAt: text('created_at').notNull(),
})

export const shipment = sqliteTable('shipment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => order.id, { onDelete: 'set null' }),
  trackingNo: text('tracking_no').default(''),
  carrier: text('carrier').default(''),
  origin: text('origin').default(''),
  destination: text('destination').default(''),
  weight: real('weight').default(0),
  estimatedDelivery: text('estimated_delivery'),
  actualDelivery: text('actual_delivery'),
  status: text('status').default('pending'),
  createdAt: text('created_at').notNull(),
})

// ============ Ads ============
export const adCampaign = sqliteTable('ad_campaign', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  objective: text('objective').default('conversion'),
  budget: real('budget').default(0),
  spent: real('spent').default(0),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  ctr: real('ctr').default(0),
  conversions: integer('conversions').default(0),
  cpa: real('cpa').default(0),
  roas: real('roas').default(0),
  status: text('status').default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// ============ Audit Logs ============
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  username: text('username').default(''),
  action: text('action').notNull().default(''),
  method: text('method').default(''),
  path: text('path').default(''),
  detail: text('detail').default(''),
  ip: text('ip').default(''),
  createdAt: text('created_at').notNull(),
})

// ============ Settings ============
export const setting = sqliteTable('setting', {
  key: text('key').primaryKey(),
  value: text('value').default('{}'),
})
