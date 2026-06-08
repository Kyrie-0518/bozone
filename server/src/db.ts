import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

// ── Bootstrap: create database if not exists ──
async function ensureDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  })
  const dbName = process.env.DB_NAME || 'bozone'
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.end()
}

await ensureDatabase()

// ── Connection Pool ──
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bozone',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
})

export const db = drizzle(pool)

// ── Create all business tables ──
export async function initBusinessTables() {
  const conn = await pool.getConnection()
  try {
    const queries = [
      // TikTok Shop
      `CREATE TABLE IF NOT EXISTS tiktok_shop (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        region VARCHAR(10) NOT NULL DEFAULT 'MY',
        shop_id VARCHAR(255) NOT NULL UNIQUE,
        shop_cipher TEXT NOT NULL,
        app_key VARCHAR(255) NOT NULL,
        app_secret VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        token_expires_at VARCHAR(100),
        api_version VARCHAR(20) NOT NULL DEFAULT '202309',
        sync_enabled TINYINT(1) NOT NULL DEFAULT 1,
        last_synced_at VARCHAR(100),
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Products
      `CREATE TABLE IF NOT EXISTS product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        sku VARCHAR(255) NOT NULL DEFAULT '',
        image TEXT,
        images TEXT,
        category VARCHAR(255) DEFAULT '',
        weight FLOAT DEFAULT 0,
        stock INT DEFAULT 0,
        sell_price FLOAT DEFAULT 0,
        cost_price FLOAT DEFAULT 0,
        platform_product_id VARCHAR(255),
        status VARCHAR(50) DEFAULT '上架',
        supplier_id INT,
        shop_id INT,
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES tiktok_shop(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Orders
      `CREATE TABLE IF NOT EXISTS \`order\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(255) NOT NULL UNIQUE,
        shop_id INT,
        buyer_name VARCHAR(255) DEFAULT '',
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        logistics_status VARCHAR(50) DEFAULT '',
        tracking_no VARCHAR(255) DEFAULT '',
        carrier VARCHAR(255) DEFAULT '',
        item_total FLOAT DEFAULT 0,
        shipping_fee FLOAT DEFAULT 0,
        discount FLOAT DEFAULT 0,
        taxes FLOAT DEFAULT 0,
        actual_amount FLOAT DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'MYR',
        remark TEXT,
        order_time VARCHAR(100),
        ship_deadline VARCHAR(100),
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES tiktok_shop(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS order_item (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        sku VARCHAR(255) DEFAULT '',
        product_name VARCHAR(500) DEFAULT '',
        quantity INT DEFAULT 1,
        unit_price FLOAT DEFAULT 0,
        subtotal FLOAT DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES \`order\`(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Finance
      `CREATE TABLE IF NOT EXISTS cost_item (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        charge_type VARCHAR(50) NOT NULL DEFAULT 'fixed',
        value FLOAT DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'RMB',
        formula TEXT,
        scope VARCHAR(50) DEFAULT 'all',
        is_active TINYINT(1) DEFAULT 1,
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS exchange_rate (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        rate FLOAT NOT NULL,
        updated_at VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Influencers
      `CREATE TABLE IF NOT EXISTS influencer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tiktok_id VARCHAR(255) DEFAULT '',
        followers INT DEFAULT 0,
        country VARCHAR(10) DEFAULT 'MY',
        contact_info TEXT,
        contact_channel VARCHAR(255) DEFAULT '',
        product_id INT,
        commission_rate FLOAT DEFAULT 0,
        cooperation_status VARCHAR(50) DEFAULT '未联系',
        remark TEXT,
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // AI Materials
      `CREATE TABLE IF NOT EXISTS material (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        category VARCHAR(255) DEFAULT '默认',
        file_type VARCHAR(50) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INT DEFAULT 0,
        tags TEXT,
        created_at VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Inventory
      `CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        warehouse VARCHAR(255) DEFAULT '默认仓库',
        location VARCHAR(255) DEFAULT '',
        quantity INT DEFAULT 0,
        safety_stock INT DEFAULT 0,
        updated_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS inventory_movement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        type VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        source VARCHAR(255) DEFAULT '',
        operator VARCHAR(255) DEFAULT '',
        remark TEXT,
        created_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS shipment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        tracking_no VARCHAR(255) DEFAULT '',
        carrier VARCHAR(255) DEFAULT '',
        origin VARCHAR(255) DEFAULT '',
        destination VARCHAR(255) DEFAULT '',
        weight FLOAT DEFAULT 0,
        estimated_delivery VARCHAR(100),
        actual_delivery VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        created_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES \`order\`(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Ads
      `CREATE TABLE IF NOT EXISTS ad_campaign (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        objective VARCHAR(100) DEFAULT 'conversion',
        budget FLOAT DEFAULT 0,
        spent FLOAT DEFAULT 0,
        impressions INT DEFAULT 0,
        clicks INT DEFAULT 0,
        ctr FLOAT DEFAULT 0,
        conversions INT DEFAULT 0,
        cpa FLOAT DEFAULT 0,
        roas FLOAT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Audit Logs
      `CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        username VARCHAR(255) DEFAULT '',
        action VARCHAR(500) NOT NULL DEFAULT '',
        method VARCHAR(10) DEFAULT '',
        path VARCHAR(500) DEFAULT '',
        detail TEXT,
        ip VARCHAR(50) DEFAULT '',
        created_at VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Sync Log
      `CREATE TABLE IF NOT EXISTS sync_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'running',
        total INT DEFAULT 0,
        success INT DEFAULT 0,
        fail INT DEFAULT 0,
        error TEXT,
        started_at VARCHAR(100) NOT NULL,
        finished_at VARCHAR(100),
        created_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES tiktok_shop(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Settings
      `CREATE TABLE IF NOT EXISTS setting (
        \`key\` VARCHAR(255) PRIMARY KEY,
        value TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ]

    for (const q of queries) {
      await conn.execute(q)
    }

    // ── Add new columns to existing tables (safe via INFORMATION_SCHEMA check) ──
    // ── Product table auto-migration ──
    const [existingCols] = await conn.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product'`, [process.env.DB_NAME || 'bozone'])
    const colNames = (existingCols as any[]).map((r: any) => r.COLUMN_NAME)
    const altColumns = [
      { name: 'images', ddl: `ALTER TABLE product ADD COLUMN images TEXT AFTER image` },
      { name: 'category', ddl: `ALTER TABLE product ADD COLUMN category VARCHAR(255) DEFAULT '' AFTER images` },
      { name: 'platform_product_id', ddl: `ALTER TABLE product ADD COLUMN platform_product_id VARCHAR(255) AFTER cost_price` },
      { name: 'status', ddl: `ALTER TABLE product ADD COLUMN status VARCHAR(50) DEFAULT '上架' AFTER platform_product_id` },
    ]
    for (const col of altColumns) {
      if (!colNames.includes(col.name)) {
        try { await conn.execute(col.ddl) } catch { /* ignore */ }
      }
    }

    // ── Order Item table auto-migration (O-001: SKU image) ──
    const [orderItemCols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_item'`,
      [process.env.DB_NAME || 'bozone']
    )
    const oiColNames = (orderItemCols as any[]).map((r: any) => r.COLUMN_NAME)
    if (!oiColNames.includes('image')) {
      try {
        await conn.execute(`ALTER TABLE order_item ADD COLUMN image TEXT AFTER product_name`)
        console.log('[DB] Migrated: order_item.image column added')
      } catch { /* ignore */ }
    }

    console.log('[DB] All business tables ready.')
  } finally {
    conn.release()
  }
}
