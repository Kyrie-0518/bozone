import crypto from 'node:crypto'

const APP_KEY = '6k44pdou0umit'
const APP_SECRET = 'f9816fdcae567d102d5861daff1c5d2e2d3c8f4a'

// Get token from DB via local API
const res = await fetch('http://localhost:3001/api/tiktok')
const { shops } = await res.json()
const shop = shops.find(s => s.shopId === 'RcNEVQAAAAAa')
if (!shop) { console.log('Shop not found'); process.exit(1) }

// Get real token
const fullRes = await fetch(`http://localhost:3001/api/tiktok/${shop.id}`)
const { shop: fullShop } = await fullRes.json()

console.log('Testing with shop:', fullShop.shopId)
console.log('Has cipher:', !!fullShop.shopCipher)

const accessToken = fullShop.accessToken
const shopCipher = fullShop.shopCipher || '8663771291495990774' // try if DB has it

// 1. Test get_authorized_shop (no cipher needed)
const ts = Math.floor(Date.now() / 1000).toString()
const params1 = { app_key: APP_KEY, sign_method: 'HMAC-SHA256', timestamp: ts }
const signStr1 = Object.keys(params1).sort().map(k => `${k}${params1[k]}`).join('')
const sign1 = crypto.createHmac('sha256', APP_SECRET).update(signStr1).digest('hex')

const qs1 = new URLSearchParams({ ...params1, sign: sign1 })
const url1 = `https://open-api.tiktokglobalshop.com/api/shop/get_authorized_shop?${qs1}`

console.log('\n[Test 1] get_authorized_shop (no cipher)')
console.log('URL:', url1.slice(0, 100) + '...')

try {
  const r1 = await fetch(url1, { headers: { 'x-tts-access-token': accessToken } })
  const t1 = await r1.text()
  console.log('Status:', r1.status)
  console.log('Body:', t1.slice(0, 300))
} catch(e) {
  console.log('Error:', e.message)
}

// 2. Test /authorization/202309/shops
const ts2 = Math.floor(Date.now() / 1000).toString()
const params2 = { app_key: APP_KEY, sign_method: 'HMAC-SHA256', timestamp: ts2 }
const signStr2 = Object.keys(params2).sort().map(k => `${k}${params2[k]}`).join('')
const sign2 = crypto.createHmac('sha256', APP_SECRET).update(signStr2).digest('hex')

const qs2 = new URLSearchParams({ ...params2, sign: sign2 })
const url2 = `https://open-api.tiktokglobalshop.com/authorization/202309/shops?${qs2}`

console.log('\n[Test 2] authorization/202309/shops (get cipher)')
try {
  const r2 = await fetch(url2, { headers: { 'x-tts-access-token': accessToken } })
  const t2 = await r2.text()
  console.log('Status:', r2.status)
  console.log('Body:', t2.slice(0, 500))
} catch(e) {
  console.log('Error:', e.message)
}
