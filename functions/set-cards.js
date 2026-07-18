const BASE = 'https://api.pokewallet.io'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const LIMIT = 24
const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' }
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' }

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const setCode = url.searchParams.get('set')
  const page = Number(url.searchParams.get('page') || '1')

  if (!setCode) {
    return Response.json({ error: 'Missing set param' }, { status: 400, headers: CORS_HEADERS })
  }

  const cacheKey = `set-${setCode}-page-${page}`
  const cached = await env.POKEWALLET_CACHE.get(cacheKey, { type: 'json' })
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return Response.json(cached.data, { headers: CACHE_HEADERS })
  }

  const res = await fetch(`${BASE}/sets/${encodeURIComponent(setCode)}?page=${page}&limit=${LIMIT}`, {
    headers: { 'X-API-Key': env.POKEWALLET_API_KEY || '' },
  })
  const data = await res.json()

  if (res.ok) {
    await env.POKEWALLET_CACHE.put(cacheKey, JSON.stringify({ timestamp: Date.now(), data }), {
      expirationTtl: 86400,
    })
    return Response.json(data, { headers: CACHE_HEADERS })
  }

  return Response.json(data, { status: res.status, headers: CORS_HEADERS })
}
