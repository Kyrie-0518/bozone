import { Hono } from 'hono'
import { db } from '../db.js'
import { order, product, tiktokShop } from '../db-schema.js'
import { sql, eq, desc } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const [totalRevenue, orderCount, productCount] = await Promise.all([
    db.select({ value: sql<number>`COALESCE(SUM(actual_amount), 0)` }).from(order).all(),
    db.select({ value: sql<number>`COUNT(*)` }).from(order).all(),
    db.select({ value: sql<number>`COUNT(*)` }).from(product).all(),
  ])

  // Orders by date (last 7 days)
  const trend = await db.all(sql`
    SELECT DATE(order_time) as date, COUNT(*) as count, COALESCE(SUM(actual_amount), 0) as revenue
    FROM "order"
    WHERE order_time >= DATE('now', '-7 days')
    GROUP BY DATE(order_time)
    ORDER BY date
  `)

  // Top products by sales
  const topProducts = await db.all(sql`
    SELECT p.name, COALESCE(SUM(oi.subtotal), 0) as total
    FROM order_item oi
    JOIN product p ON p.id = oi.product_id
    GROUP BY p.name
    ORDER BY total DESC
    LIMIT 10
  `)

  // Recent 10 orders with shop name and product summary
  const recentOrders = await db.all(sql`
    SELECT
      o.id,
      o.order_no as "orderNo",
      COALESCE(ts.name, '未知店铺') as "shop",
      o.actual_amount as "amount",
      o.shipping_fee as "shipping",
      o.status,
      o.currency,
      o.order_time as "time",
      COALESCE(o.actual_amount, 0) - COALESCE(o.shipping_fee, 0) - COALESCE(o.discount, 0) - COALESCE(o.taxes, 0) as "profit",
      GROUP_CONCAT(oi.product_name, ', ') as "products"
    FROM "order" o
    LEFT JOIN tiktok_shop ts ON ts.id = o.shop_id
    LEFT JOIN order_item oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.order_time DESC
    LIMIT 10
  `)

  // Yesterday comparison for change indicators
  const yesterdayOrders = await db.all(sql`
    SELECT COALESCE(SUM(actual_amount), 0) as revenue, COUNT(*) as count
    FROM "order"
    WHERE DATE(order_time) = DATE('now', '-1 day')
  `)
  const todayOrders = await db.all(sql`
    SELECT COALESCE(SUM(actual_amount), 0) as revenue, COUNT(*) as count
    FROM "order"
    WHERE DATE(order_time) = DATE('now')
  `)

  const todayRev = todayOrders[0]?.revenue || 0
  const yesterdayRev = yesterdayOrders[0]?.revenue || 0
  const todayCnt = todayOrders[0]?.count || 0
  const yesterdayCnt = yesterdayOrders[0]?.count || 0

  const revenueChange = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev * 100) : 0
  const orderChange = yesterdayCnt > 0 ? ((todayCnt - yesterdayCnt) / yesterdayCnt * 100) : 0

  // Calculate ROI (simplified: revenue / hypothetical cost)
  const totalCost = await db.select({ value: sql<number>`COALESCE(SUM(value), 0)` }).from(
    sql`cost_item`
  ).all()
  const costSum = totalCost[0]?.value || 1000 // avoid division by zero
  const roi = totalRevenue[0]?.value > 0
    ? ((totalRevenue[0].value / costSum)).toFixed(2)
    : '0'

  return c.json({
    success: true,
    data: {
      revenue: totalRevenue[0]?.value || 0,
      orders: orderCount[0]?.value || 0,
      products: productCount[0]?.value || 0,
      roi,
      revenueChange: Math.round(revenueChange * 10) / 10,
      orderChange: Math.round(orderChange * 10) / 10,
      trend,
      topProducts,
      recentOrders: (recentOrders as any[]).map(r => ({
        ...r,
        profit: Number(r.profit || 0),
        amount: Number(r.amount || 0),
        shipping: Number(r.shipping || 0),
      })),
    },
  })
})

export default app
