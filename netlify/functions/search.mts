import { getStore } from '@netlify/blobs'

const BASE = 'https://api.pokewallet.io'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const LIMIT = 24
const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' }
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' }

export default async (req: Request) => {
  const url = new URL(req.url)
  const term = url.searchParams.get('q')
  const page = Number(url.searchParams.get('page') || '1')

  if (!term) {
    return Response.json({ error: 'Missing q param' }, { status: 400, headers: CORS_HEADERS })
  }

  const cacheKey = `search-${term.toLowerCase()}-page-${page}`
  const store = getStore('pokewallet-cache')

  const cached = await store.get(cacheKey, { type: 'json' })
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return Response.json(cached.data, { headers: CACHE_HEADERS })
  }

  const apiKey = Netlify.env.get('POKEWALLET_API_KEY')
  const res = await fetch(
    `${BASE}/search?q=${encodeURIComponent(term)}&page=${page}&limit=${LIMIT}`,
    { headers: { 'X-API-Key': apiKey || '' } },
  )
  const data = await res.json()

  if (res.ok) {
    await store.setJSON(cacheKey, { timestamp: Date.now(), data })
    return Response.json(data, { headers: CACHE_HEADERS })
  }

  return Response.json(data, { status: res.status, headers: CORS_HEADERS })
}
