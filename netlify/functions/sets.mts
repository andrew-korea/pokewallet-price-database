import { getStore } from '@netlify/blobs'

const BASE = 'https://api.pokewallet.io'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' }
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' }

export default async () => {
  const store = getStore('pokewallet-cache')
  const cacheKey = 'sets'

  const cached = await store.get(cacheKey, { type: 'json' })
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return Response.json(cached.data, { headers: CACHE_HEADERS })
  }

  const apiKey = Netlify.env.get('POKEWALLET_API_KEY')
  const res = await fetch(`${BASE}/sets`, {
    headers: { 'X-API-Key': apiKey || '' },
  })
  const data = await res.json()

  if (res.ok) {
    await store.setJSON(cacheKey, { timestamp: Date.now(), data })
    return Response.json(data, { headers: CACHE_HEADERS })
  }

  return Response.json(data, { status: res.status, headers: CORS_HEADERS })
}
