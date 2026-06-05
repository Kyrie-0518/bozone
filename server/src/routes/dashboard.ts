import { Hono } from 'hono'
import { db } from '../db.js'
import { order, product, costItem } from '../db-schema.js'
import { sql } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const [totalRevenue, orderCount, productCount] = await Promise.all([
      db.select({ value: sql<number>`COALESCE(SUM(actual_amount), 0)` }).from(order),
      db.select({ value: sql<number>`COUNT(*)` }).from(order),
      db.select({ value: sql<number>`COUNT(*)` }).from(product),
    ])

    // Orders by date (last 7 days)
    let trendData: any[] = []
    try {
      const trend = await db.execute(sql`
        SELECT DATE(order_time) as date, COUNT(*) as count, COALESCE(SUM(actual_amount), 0) as revenue
        FROM \`order\`
        WHERE order_time >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
        GROUP BY DATE(order_time)
        ORDER BY date
      `)
      trendData = trend[0] as unknown as any[]
    } catch (e: any) {
      console.warn('[Dash] trend query failed:', e.message?.slice(0, 100))
    }

    // Top products by sales
    let topProductsData: any[] = []
    try {
      const topProducts = await db.execute(sql`
        SELECT p.name, COALESCE(SUM(oi.subtotal), 0) as total
        FROM order_item oi
        JOIN product p ON p.id = oi.product_id
        GROUP BY p.name
        ORDER BY total DESC
        LIMIT 10
      `)
      topProductsData = topProducts[0] as unknown as any[]
    } catch (e: any) {
      console.warn('[Dash] topProducts query failed:', e.message?.slice(0, 100))
    }

    // Recent 10 orders
    let recentOrdersData: any[] = []
    try {
      const recentOrders = await db.execute(sql`
        SELECT
          o.id,
          o.order_no as orderNo,
          COALESCE(ts.name, '未知店铺') as shop,
          o.actual_amount as amount,
          o.shipping_fee as shipping,
          o.status,
          o.currency,
          o.order_time as time,
          COALESCE(o.actual_amount, 0) - COALESCE(o.shipping_fee, 0) - COALESCE(o.discount, 0) - COALESCE(o.taxes, 0) as profit,
          GROUP_CONCAT(oi.product_name SEPARATOR ', ') as products
        FROM \`order\` o
        LEFT JOIN tiktok_shop ts ON ts.id = o.shop_id
        LEFT JOIN order_item oi ON oi.order_id = o.id
        GROUP BY o.id
        ORDER BY o.order_time DESC
        LIMIT 10
      `)
      recentOrdersData = (recentOrders[0] as unknown as any[]).map(r => ({
        ...r,
        profit: Number(r.profit || 0),
        amount: Number(r.amount || 0),
        shipping: Number(r.shipping || 0),
      }))
    } catch (e: any) {
      console.warn('[Dash] recentOrders query failed:', e.message?.slice(0, 100))
    }

    // Yesterday comparison
    let todayRev = 0, yesterdayRev = 0, todayCnt = 0, yesterdayCnt = 0
    try {
      const yesterdayOrders = await db.execute(sql`
        SELECT COALESCE(SUM(actual_amount), 0) as revenue, COUNT(*) as count
        FROM \`order\`
        WHERE DATE(order_time) = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)
      `)
      const todayOrders = await db.execute(sql`
        SELECT COALESCE(SUM(actual_amount), 0) as revenue, COUNT(*) as count
        FROM \`order\`
        WHERE DATE(order_time) = CURRENT_DATE
      `)
      const todayData = todayOrders[0] as unknown as any[]
      const yesterdayData = yesterdayOrders[0] as unknown as any[]
      const todayRow = todayData[0]
      const yesterdayRow = yesterdayData[0]
      todayRev = todayRow?.revenue || 0
      yesterdayRev = yesterdayRow?.revenue || 0
      todayCnt = todayRow?.count || 0
      yesterdayCnt = yesterdayRow?.count || 0
    } catch (e: any) {
      console.warn('[Dash] comparison query failed:', e.message?.slice(0, 100))
    }

    const revenueChange = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev * 100) : 0
    const orderChange = yesterdayCnt > 0 ? ((todayCnt - yesterdayCnt) / yesterdayCnt * 100) : 0

    // Calculate ROI
    let roi = '0'
    let rev = 0
    try {
      const totalCost = await db.select({ value: sql<number>`COALESCE(SUM(value), 0)` }).from(costItem)
      const costSum = totalCost[0]?.value || 1000
      rev = totalRevenue[0]?.value || 0
      roi = rev > 0 ? (rev / costSum).toFixed(2) : '0'
    } catch (e: any) {
      console.warn('[Dash] ROI query failed:', e.message?.slice(0, 100))
      rev = totalRevenue[0]?.value || 0
    }

    console.log('[Dash] OK revenue=' + rev + ' orders=' + orderCount[0]?.value)

    return c.json({
      success: true,
      data: {
        revenue: rev,
        orders: orderCount[0]?.value || 0,
        products: productCount[0]?.value || 0,
        roi,
        revenueChange: Math.round(revenueChange * 10) / 10,
        orderChange: Math.round(orderChange * 10) / 10,
        trend: trendData,
        topProducts: topProductsData,
        recentOrders: recentOrdersData,
      },
    })
  } catch (e: any) {
    console.error('[Dash] Error:', e.message)
    return c.json({
      success: true,
      data: {
        revenue: 0, orders: 0, products: 0, roi: '0',
        revenueChange: 0, orderChange: 0, trend: [], topProducts: [], recentOrders: [],
      }
    })
  }
})

export default app
